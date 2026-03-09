import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  createReportingMcpSessionManager,
  REPORTING_HOST_CONTEXT_HEADER,
  serializeReportingHostContext,
} from "../dist/http.js";

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

describe("reporting MCP HTTP sessions", () => {
  const manager = createReportingMcpSessionManager();
  const server = createServer(async (req, res) => {
    const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
    if (requestUrl.pathname !== "/mcp") {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    const parsedBody =
      req.method === "POST" && req.headers["content-type"]?.includes("application/json")
        ? await readJsonBody(req)
        : undefined;
    await manager.handleNodeRequest(req, res, parsedBody);
  });

  let baseUrl = "";

  before(async () => {
    await new Promise((resolve, reject) => {
      server.listen(0, "127.0.0.1", (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to resolve test server address");
    }
    baseUrl = `http://127.0.0.1:${address.port}/mcp`;
  });

  after(async () => {
    await manager.closeAllSessions();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  });

  async function connectWithContext(hostContext) {
    const transport = new StreamableHTTPClientTransport(new URL(baseUrl), {
      requestInit: {
        headers: {
          [REPORTING_HOST_CONTEXT_HEADER]: serializeReportingHostContext(hostContext),
        },
      },
    });
    const client = new Client({
      name: "reporting-mcp-test-client",
      version: "0.1.0",
    });

    await client.connect(transport);

    return {
      client,
      transport,
      async close() {
        await transport.terminateSession().catch(() => undefined);
        await client.close();
      },
    };
  }

  it("scopes query resources and tools to the connected host context", async () => {
    const portfolioClient = await connectWithContext({
      source: "portfolio-test",
      tenantId: "portfolio",
      queryCatalog: {
        queries: [
          {
            name: "projects",
            fields: ["id", "name", "status"],
          },
        ],
      },
    });

    const workfrontClient = await connectWithContext({
      source: "workfront-test",
      tenantId: "workfront",
      queryCatalog: {
        queries: [
          {
            name: "tasks",
            fields: ["id", "name", "assignee"],
          },
        ],
      },
    });

    try {
      const portfolioCatalog = await portfolioClient.client.readResource({
        uri: "report-spec://v1/query-catalog",
      });
      const workfrontCatalog = await workfrontClient.client.readResource({
        uri: "report-spec://v1/query-catalog",
      });

      const portfolioText = portfolioCatalog.contents.find((content) => "text" in content)?.text ?? "";
      const workfrontText = workfrontCatalog.contents.find((content) => "text" in content)?.text ?? "";

      assert.match(portfolioText, /"tenantId": "portfolio"/);
      assert.match(portfolioText, /"name": "projects"/);
      assert.doesNotMatch(portfolioText, /"name": "tasks"/);

      assert.match(workfrontText, /"tenantId": "workfront"/);
      assert.match(workfrontText, /"name": "tasks"/);
      assert.doesNotMatch(workfrontText, /"name": "projects"/);

      const portfolioQueries = await portfolioClient.client.callTool({
        name: "list_available_queries",
        arguments: {},
      });
      const workfrontQueries = await workfrontClient.client.callTool({
        name: "list_available_queries",
        arguments: {},
      });

      const portfolioPayload = JSON.parse(portfolioQueries.content[0].text);
      const workfrontPayload = JSON.parse(workfrontQueries.content[0].text);

      assert.deepEqual(
        portfolioPayload.queries.map((query) => query.name),
        ["projects"]
      );
      assert.deepEqual(
        workfrontPayload.queries.map((query) => query.name),
        ["tasks"]
      );
    } finally {
      await portfolioClient.close();
      await workfrontClient.close();
    }
  });

  it("uses session query metadata as the default validation context", async () => {
    const clientHandle = await connectWithContext({
      source: "validation-test",
      queryCatalog: {
        queries: [
          {
            name: "projects",
            fields: ["id", "name"],
          },
        ],
      },
    });

    try {
      const validationResult = await clientHandle.client.callTool({
        name: "validate_report_spec",
        arguments: {
          spec: {
            id: "bad-report",
            title: "Bad Report",
            layout: "singleColumn",
            dataSources: {
              tasks: {
                name: "tasks",
                query: "tasks",
              },
            },
            filters: [],
            widgets: [],
          },
        },
      });

      const payload = JSON.parse(validationResult.content[0].text);
      assert.equal(payload.valid, false);
      assert.match(JSON.stringify(payload.diagnostics), /tasks/);
    } finally {
      await clientHandle.close();
    }
  });
});
