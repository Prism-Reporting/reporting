import { readFile } from "node:fs/promises";
import {
  formatCombinedReportingContextForAgent,
  formatReportSpecForPrompt,
  type BaseReportingContext,
  type ReportingContextProvider,
  type SemanticReportingContext,
  type ValidationContext,
} from "@reporting/core";
import { getReportGenerationRules } from "@reporting/mcp-server/contract";

export interface LoadedAgentSkill {
  path: string;
  name?: string;
  description?: string;
  body: string;
}

export interface ReportingAgentRuntimeOptions {
  contextProvider: ReportingContextProvider;
  skillPaths: string[];
  baseInstructions?: string;
  runtimeNotes?: string[];
  submissionToolName?: string;
  submissionToolDescription?: string;
}

export interface BuildSystemPromptOptions {
  validationErrorText?: string;
  currentSpec?: Record<string, unknown> | null;
}

export interface BuildModelMessagesOptions {
  prompt: string;
  messages?: Array<{ role?: string; content?: unknown; parts?: Array<{ type?: string; text?: string }> }>;
  currentSpec?: Record<string, unknown> | null;
  validationErrorText?: string;
}

export interface ReportingAgentRuntime {
  loadSkills(): Promise<LoadedAgentSkill[]>;
  getBaseContext(): Promise<BaseReportingContext>;
  getSemanticContext(): Promise<SemanticReportingContext | null>;
  getValidationContext(): Promise<ValidationContext>;
  buildSystemPrompt(options?: BuildSystemPromptOptions): Promise<string>;
  buildDynamicSystemMessage(options?: BuildSystemPromptOptions): string;
  buildModelMessages(options: BuildModelMessagesOptions): Array<{ role: string; content: string }>;
}

const DEFAULT_BASE_INSTRUCTIONS =
  "You are a helpful assistant. The user is chatting in an app that shows a live report.";

function getMessageText(message: {
  content?: unknown;
  parts?: Array<{ type?: string; text?: string }>;
}): string {
  if (typeof message?.content === "string") return message.content;
  if (Array.isArray(message?.parts)) {
    return message.parts
      .filter((part) => part?.type === "text")
      .map((part) => part.text ?? "")
      .join("\n");
  }
  return "";
}

function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const text = content.trimStart();
  if (!text.startsWith("---\n")) {
    return { meta: {}, body: content.trim() };
  }

  const endIndex = text.indexOf("\n---\n", 4);
  if (endIndex < 0) {
    return { meta: {}, body: content.trim() };
  }

  const frontmatter = text.slice(4, endIndex);
  const body = text.slice(endIndex + 5).trim();
  const meta: Record<string, string> = {};

  for (const line of frontmatter.split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key) {
      meta[key] = value.replace(/^['"]|['"]$/g, "");
    }
  }

  return { meta, body };
}

export function buildValidationContextFromBaseContext(
  baseContext: BaseReportingContext | null | undefined
): ValidationContext {
  const queries = Array.isArray(baseContext?.queries) ? baseContext.queries : [];
  return {
    availableQueries: queries.map((query) => query.name),
    availableFields: Object.fromEntries(
      queries
        .filter((query) => Array.isArray(query.fields) && query.fields.length > 0)
        .map((query) => [query.name, query.fields ?? []])
    ),
  };
}

export async function loadAgentSkill(skillPath: string): Promise<LoadedAgentSkill> {
  const raw = await readFile(skillPath, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  return {
    path: skillPath,
    name: meta.name,
    description: meta.description,
    body,
  };
}

export function createReportingAgentRuntime(
  options: ReportingAgentRuntimeOptions
): ReportingAgentRuntime {
  let loadedSkillsPromise: Promise<LoadedAgentSkill[]> | null = null;

  const loadSkills = async () => {
    if (!loadedSkillsPromise) {
      loadedSkillsPromise = Promise.all(options.skillPaths.map((skillPath) => loadAgentSkill(skillPath)));
    }
    return loadedSkillsPromise;
  };

  const getBaseContext = () => options.contextProvider.getBaseContext();
  const getSemanticContext = async () =>
    (typeof options.contextProvider.getSemanticContext === "function"
      ? await options.contextProvider.getSemanticContext()
      : null) ?? null;

  const buildDynamicSystemMessage = ({
    currentSpec = null,
    validationErrorText = "",
  }: BuildSystemPromptOptions = {}) => {
    const blocks: string[] = [];
    if (validationErrorText) {
      blocks.push(`Validation feedback from the latest apply_report_spec attempt:\n${validationErrorText}`);
    }

    if (currentSpec && typeof currentSpec === "object" && !Array.isArray(currentSpec)) {
      blocks.push(
        "The user is currently viewing the report described below. Use this when they ask about the current report or want to modify it.",
        formatReportSpecForPrompt(currentSpec)
      );
    }

    return blocks.join("\n\n").trim();
  };

  const buildModelMessages = ({
    prompt,
    messages = [],
    currentSpec = null,
    validationErrorText = "",
  }: BuildModelMessagesOptions) => {
    const history = (Array.isArray(messages) ? messages : []).map((message) => ({
      role: message.role ?? "user",
      content: String(getMessageText(message) ?? ""),
    }));
    const text = prompt.trim();
    const hasTrailingPrompt =
      history.length > 0 &&
      history[history.length - 1]?.role === "user" &&
      history[history.length - 1]?.content.trim() === text;
    const conversationHistory = hasTrailingPrompt ? history.slice(0, -1) : history;
    const dynamicSystemMessage = buildDynamicSystemMessage({ currentSpec, validationErrorText });
    const modelMessages = [...conversationHistory];

    if (dynamicSystemMessage) {
      modelMessages.push({ role: "system", content: dynamicSystemMessage });
    }

    modelMessages.push({ role: "user", content: text });
    return modelMessages;
  };

  return {
    loadSkills,
    getBaseContext,
    getSemanticContext,
    async getValidationContext() {
      return buildValidationContextFromBaseContext(await getBaseContext());
    },
    buildDynamicSystemMessage,
    buildModelMessages,
    async buildSystemPrompt(_: BuildSystemPromptOptions = {}) {
      const [skills, baseContext, semanticContext] = await Promise.all([
        loadSkills(),
        getBaseContext(),
        getSemanticContext(),
      ]);
      const guideBlock = getReportGenerationRules({
        queries: baseContext?.queries ?? [],
        submissionToolName: options.submissionToolName ?? "apply_report_spec",
        submissionToolDescription:
          options.submissionToolDescription ??
          "That tool validates and dry-runs the spec before the live report is updated.",
        inlineGuide: true,
      });
      const contextBlock = formatCombinedReportingContextForAgent(baseContext, semanticContext);
      const skillBlock = skills
        .map((skill) => {
          const header = skill.name ? `Skill: ${skill.name}` : "Skill instructions:";
          return `${header}\n${skill.body}`.trim();
        })
        .join("\n\n");

      return [
        options.baseInstructions ?? DEFAULT_BASE_INSTRUCTIONS,
        ...(options.runtimeNotes ?? []),
        skillBlock ? `Loaded agent skill instructions:\n\n${skillBlock}` : "",
        "Report DSL guide:",
        guideBlock,
        contextBlock ? `Dataset context:\n\n${contextBlock}` : "",
      ]
        .filter((section) => section.trim().length > 0)
        .join("\n\n")
        .trim();
    },
  };
}
