export const SITE = {
  name: "Taproot",
  tagline: "Find the real reason you're stuck.",
  description:
    "Taproot traces the topic you're stuck on down its tree of prerequisite skills to find the root gap, explains it, and helps you climb back up. Free, no sign-up.",
  repo: "https://github.com/akshayavinash2006/taproot",
};

/** Prefilled GitHub issue for reporting a wrong or confusing question. */
export function reportIssueUrl(questionId: string, prompt: string) {
  const title = `Question problem: ${questionId}`;
  const body = `**Question id:** ${questionId}\n\n**Question:** ${prompt}\n\n**What's wrong?**\n\n`;
  return `${SITE.repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=question-report`;
}
