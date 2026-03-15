import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type {
  ReportingContextProvider,
  ReportingContextProviderInput,
  SemanticReportingContext,
} from "@prism-reporting/core";
import { createReportingMcpServer } from "./server.js";
import {
  baseContextToHostContext,
  loadQueryCatalogFromEnv,
  type ReportingHostContext,
} from "./contract.js";

/**
 * @deprecated Prefer passing a ReportingContextProvider to the session manager.
 * This header is only used when no context provider is supplied.
 */
export const REPORTING_HOST_CONTEXT_HEADER = "x-reporting-host-context";
const DEFAULT_MCP_PATH = "/mcp";

type SessionHandle = {
  transport: StreamableHTTPServerTransport;
  server: ReturnType<typeof createReportingMcpServer>["mcpServer"];
  hostContext: ReportingHostContext;
};

export type SessionManagerOptions = {
  /**
   * Preferred: supply a reporting context provider. Context is obtained via getBaseContext
   * (and optionally getSemanticContext) for each new session. When set, header-based context
   * is only used as fallback if the provider fails or is not set.
   */
  contextProvider?: ReportingContextProvider;
  /**
   * Optional: derive per-request input for the context provider (e.g. tenantId from headers).
   * If omitted, getBaseContext/getSemanticContext are called with undefined.
   */
  getContextProviderInput?: (req: IncomingMessage) => ReportingContextProviderInput | undefined;
  /** Fallback when no contextProvider is set and no valid header is present (e.g. env-based catalog). */
  fallbackHostContext?: ReportingHostContext;
};

function readHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function serializeReportingHostContext(hostContext: ReportingHostContext) {
  return Buffer.from(JSON.stringify(hostContext), "utf8").toString("base64url");
}

export function parseReportingHostContextHeader(headerValue: string | undefined) {
  if (!headerValue) return null;

  try {
    return JSON.parse(Buffer.from(headerValue, "base64url").toString("utf8")) as ReportingHostContext;
  } catch (error) {
    throw new Error(
      `Invalid ${REPORTING_HOST_CONTEXT_HEADER} header: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function createFallbackHostContextFromEnv(): ReportingHostContext | null {
  const queryCatalogResult = loadQueryCatalogFromEnv();
  if (queryCatalogResult.queries.length === 0 && !queryCatalogResult.error) {
    return null;
  }

  return {
    queryCatalog: { queries: queryCatalogResult.queries },
    source: queryCatalogResult.source,
  };
}

export function createReportingMcpSessionManager(options: SessionManagerOptions = {}) {
  const sessions = new Map<string, SessionHandle>();
  const fallbackHostContext = options.fallbackHostContext ?? createFallbackHostContextFromEnv();
  const { contextProvider, getContextProviderInput } = options;

  function getSession(req: IncomingMessage) {
    const sessionId = readHeaderValue(req.headers["mcp-session-id"]);
    return sessionId ? sessions.get(sessionId) : null;
  }

  /** Legacy: resolve context from deprecated header or env fallback. Used when no provider or provider fails. */
  function buildHostContextFromHeaderOrFallback(req: IncomingMessage): ReportingHostContext {
    const headerValue = readHeaderValue(req.headers[REPORTING_HOST_CONTEXT_HEADER]);
    try {
      const fromHeader = headerValue ? parseReportingHostContextHeader(headerValue) : null;
      if (fromHeader) return fromHeader;
    } catch {
      // Invalid header; fall through to fallback
    }
    return fallbackHostContext ?? { queryCatalog: { queries: [] } };
  }

  /**
   * Resolves host context for a new session. Prefer contextProvider; fall back to header then env.
   * Returns hostContext and optional semanticContext for createReportingMcpServer.
   */
  async function resolveSessionContext(req: IncomingMessage): Promise<{
    hostContext: ReportingHostContext;
    semanticContext?: SemanticReportingContext | null;
  }> {
    if (contextProvider) {
      const input = getContextProviderInput?.(req);
      try {
        const base = await contextProvider.getBaseContext(input);
        const hostContext = baseContextToHostContext(base);
        const semanticContext =
          typeof contextProvider.getSemanticContext === "function"
            ? await contextProvider.getSemanticContext(input)
            : undefined;
        return { hostContext, semanticContext: semanticContext ?? undefined };
      } catch {
        // Provider failed; fall back to header/fallback
      }
    }
    const hostContext = buildHostContextFromHeaderOrFallback(req);
    return { hostContext };
  }

  async function handleNodeRequest(
    req: IncomingMessage,
    res: ServerResponse,
    parsedBody?: unknown
  ) {
    const existingSession = getSession(req);
    if (existingSession) {
      await existingSession.transport.handleRequest(req, res, parsedBody);
      return;
    }

    const isInitRequest =
      req.method === "POST" && parsedBody !== undefined && isInitializeRequest(parsedBody);

    if (!isInitRequest) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },
          id: null,
        })
      );
      return;
    }

    const { hostContext, semanticContext } = await resolveSessionContext(req);
    const { mcpServer } = createReportingMcpServer(hostContext, semanticContext);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (sessionId) => {
        sessions.set(sessionId, {
          transport,
          server: mcpServer,
          hostContext,
        });
      },
      onsessionclosed: (sessionId) => {
        sessions.delete(sessionId);
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        sessions.delete(transport.sessionId);
      }
    };

    await mcpServer.connect(transport);

    try {
      await transport.handleRequest(req, res, parsedBody);
    } catch (error) {
      await mcpServer.close().catch(() => undefined);
      if (transport.sessionId) {
        sessions.delete(transport.sessionId);
      }
      throw error;
    }
  }

  async function closeAllSessions() {
    for (const [sessionId, session] of sessions) {
      await session.server.close().catch(() => undefined);
      await session.transport.close().catch(() => undefined);
      sessions.delete(sessionId);
    }
  }

  return {
    handleNodeRequest,
    closeAllSessions,
    getSessionCount() {
      return sessions.size;
    },
  };
}

async function readJsonBody(req: IncomingMessage) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export type StandaloneServerOptions = {
  host?: string;
  mcpPath?: string;
  port?: number;
  /** Preferred: use a context provider for session context. */
  contextProvider?: ReportingContextProvider;
  /** Optional: derive provider input from the request (e.g. tenantId from headers). */
  getContextProviderInput?: (req: IncomingMessage) => ReportingContextProviderInput | undefined;
  /** Fallback when no contextProvider and no valid header (e.g. env-based catalog). */
  fallbackHostContext?: ReportingHostContext;
};

export function startStandaloneReportingMcpHttpServer(options: StandaloneServerOptions = {}) {
  const host = options.host ?? "127.0.0.1";
  const mcpPath = options.mcpPath ?? DEFAULT_MCP_PATH;
  const port = options.port ?? Number(process.env.REPORTING_MCP_PORT || 7071);
  const sessionManager = createReportingMcpSessionManager({
    contextProvider: options.contextProvider,
    getContextProviderInput: options.getContextProviderInput,
    fallbackHostContext: options.fallbackHostContext,
  });

  const server = createServer(async (req, res) => {
    const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? `${host}:${port}`}`);
    if (requestUrl.pathname !== mcpPath) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    try {
      const parsedBody =
        req.method === "POST" && req.headers["content-type"]?.includes("application/json")
          ? await readJsonBody(req)
          : undefined;
      await sessionManager.handleNodeRequest(req, res, parsedBody);
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: error instanceof Error ? error.message : String(error),
            },
            id: null,
          })
        );
      }
    }
  });

  const close = async () => {
    await sessionManager.closeAllSessions();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  };

  return {
    server,
    sessionManager,
    start() {
      return new Promise<HttpServer>((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
          server.off("error", reject);
          resolve(server);
        });
      });
    },
    close,
    url: `http://${host}:${port}${mcpPath}`,
  };
}
