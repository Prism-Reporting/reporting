#!/usr/bin/env node
import { startStandaloneReportingMcpHttpServer } from "./http.js";

async function main() {
  const server = startStandaloneReportingMcpHttpServer();
  await server.start();
  console.log(`Reporting MCP HTTP server listening on ${server.url}`);

  const shutdown = async () => {
    await server.close().catch((error) => {
      console.error("Error shutting down reporting MCP server:", error);
    });
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
