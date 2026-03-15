import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getReportGenerationRules } from "../dist/contract.js";

describe("report generation rules", () => {
  it("keeps MCP-oriented guidance by default", () => {
    const guide = getReportGenerationRules();

    assert.match(guide, /validate_report_spec/);
    assert.match(guide, /report-spec:\/\/v1\/guide/);
    assert.match(guide, /conditionalFormatting/);
    assert.match(guide, /row\/cell highlighting|rows or individual cells/);
    assert.match(guide, /card highlighting/);
  });

  it("supports embedded apply-tool guidance for non-MCP hosts", () => {
    const guide = getReportGenerationRules({
      submissionToolName: "apply_report_dls",
      submissionToolDescription:
        "That tool validates and dry-runs the spec before the live report is updated.",
      inlineGuide: true,
    });

    assert.match(guide, /apply_report_dls/);
    assert.doesNotMatch(guide, /validate_report_spec/);
    assert.doesNotMatch(guide, /report-spec:\/\/v1\/guide/);
    assert.match(
      guide,
      /Read the full Report DSL guide included in this prompt/
    );
  });
});
