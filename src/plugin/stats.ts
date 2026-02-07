export interface QuotaInfo {
  metric: string;
  limit: number;
  usage?: number;
  unit: string;
}

/**
 * Fetches quota information from Google Cloud Quotas API.
 * Uses the Cloud AI Companion API (Code Assist) service name.
 */
export async function fetchGeminiStats(
  projectId: string,
  accessToken: string,
): Promise<QuotaInfo[]> {
  const location = "global";
  const service = "cloudaicompanion.googleapis.com";
  const url = `https://cloudquotas.googleapis.com/v1/projects/${projectId}/locations/${location}/quotaInfos`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quotas: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const quotaInfos = data.quotaInfos || [];

    return quotaInfos
      .filter(
        (q: any) =>
          q.service === service || q.quotaId.includes("cloudaicompanion"),
      )
      .map((q: any) => ({
        metric: q.metricDisplayName || q.quotaId,
        limit: q.quotaValue,
        unit: q.metricUnit,
      }));
  } catch (error) {
    console.error("Error fetching Gemini stats:", error);
    return [];
  }
}

/**
 * Formats quota information into a Markdown table.
 */
export function formatQuotaMarkdown(
  projectId: string,
  stats: QuotaInfo[],
): string {
  if (stats.length === 0) {
    return `### Gemini Quota Status (Project: ${projectId})\n\nNo quota information found or API not enabled.`;
  }

  let table = `### Gemini Quota Status (Project: ${projectId})\n\n`;
  table += "| Metric | Limit | Unit |\n";
  table += "| :--- | :--- | :--- |\n";

  for (const stat of stats) {
    table += `| ${stat.metric} | ${stat.limit.toLocaleString()} | ${stat.unit} |\n`;
  }

  return table;
}
