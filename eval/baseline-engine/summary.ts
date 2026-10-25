import { LEVEL_COPY } from "./scoring";
import type { AnalysisResult } from "./types";

/**
 * Plain-text summary for the "Copy summary" button. Deliberately excludes
 * the original message so a copied summary does not spread its contents.
 */
export function buildSummaryText(result: AnalysisResult): string {
  const lines: string[] = [];
  lines.push("SafeClick AI: message check summary");
  lines.push(`Concern level: ${LEVEL_COPY[result.level].label} (heuristic score ${result.score}/100)`);
  if (result.conversation?.escalationTurn != null) {
    lines.push(
      `Conversation: ${result.conversation.turnsBeforeRequest} messages without a request came before the first request (message ${result.conversation.escalationTurn + 1}).`,
    );
  }
  lines.push("");
  if (result.signals.length === 0) {
    lines.push("No common warning patterns were found.");
  } else {
    lines.push("Warning signs found:");
    for (const s of result.signals) lines.push(`- ${s.title}`);
  }
  lines.push("");
  lines.push("Suggested next steps:");
  for (const a of result.recommendations.slice(0, 5)) lines.push(`- ${a.text}`);
  lines.push("");
  lines.push(
    "Note: this score is a rule-based heuristic, not a probability of fraud. A low score does not mean a message is safe.",
  );
  return lines.join("\n");
}
