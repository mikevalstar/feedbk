import type { Comment, FeedbackConfig, NewCommentPayload } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // keep the status-based message
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

function base(config: FeedbackConfig): string {
  return `${config.apiUrl.replace(/\/$/, "")}/api/projects/${encodeURIComponent(config.projectKey)}/comments`;
}

export async function listComments(config: FeedbackConfig, pagePath: string): Promise<Comment[]> {
  const url = `${base(config)}?pagePath=${encodeURIComponent(pagePath)}`;
  const data = await request<{ comments: Comment[] }>(url);
  return data.comments;
}

export function createComment(config: FeedbackConfig, payload: NewCommentPayload): Promise<Comment> {
  return request<Comment>(base(config), { method: "POST", body: JSON.stringify(payload) });
}

export function updateComment(
  config: FeedbackConfig,
  commentId: string,
  patch: { body?: string; status?: "open" | "resolved" },
): Promise<Comment> {
  return request<Comment>(`${base(config)}/${encodeURIComponent(commentId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteComment(config: FeedbackConfig, commentId: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`${base(config)}/${encodeURIComponent(commentId)}`, { method: "DELETE" });
}
