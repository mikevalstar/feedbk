export type CommentType = "component" | "page-position" | "page-general";
export type CommentStatus = "open" | "resolved";

export type FeedbackConfig = {
  projectKey: string;
  apiUrl: string;
};

export type Identity = {
  name: string;
  email: string;
};

/** Mirrors the backend's comments table (apps/backend/src/schema.ts). */
export type Comment = {
  id: string;
  projectKey: string;
  pagePath: string;
  url: string;
  type: CommentType;
  body: string;
  authorName: string;
  authorEmail: string;
  status: CommentStatus;

  componentName: string | null;
  componentTag: string | null;
  componentMetadata: string | null;
  domPath: string | null;
  textSnippet: string | null;

  viewportWidth: number | null;
  viewportHeight: number | null;
  scrollX: number | null;
  scrollY: number | null;
  clientX: number | null;
  clientY: number | null;
  pageX: number | null;
  pageY: number | null;
  normalizedX: number | null;
  normalizedY: number | null;

  createdAt: string;
  updatedAt: string;
};

export type CoordinateData = {
  viewportWidth: number;
  viewportHeight: number;
  scrollX: number;
  scrollY: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  normalizedX: number;
  normalizedY: number;
};

export type ComponentTarget = {
  componentName: string;
  componentTag: string;
  componentMetadata: string;
  domPath: string;
  textSnippet: string;
};

export type NewCommentPayload = {
  pagePath: string;
  url: string;
  type: CommentType;
  body: string;
  authorName: string;
  authorEmail: string;
} & Partial<CoordinateData> &
  Partial<ComponentTarget>;

/** A comment being composed: everything but body/author, which the form collects. */
export type Draft = {
  type: CommentType;
  coords: CoordinateData | null;
  component: ComponentTarget | null;
};
