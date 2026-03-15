declare module "ai" {
  export function jsonSchema(schema: unknown): unknown;
  export function stepCountIs(count: number): unknown;
  export function streamText(options: unknown): {
    toUIMessageStreamResponse(): Response;
  };
  export function tool(options: {
    description: string;
    inputSchema: unknown;
    execute: (input: any) => Promise<unknown>;
  }): unknown;
}
