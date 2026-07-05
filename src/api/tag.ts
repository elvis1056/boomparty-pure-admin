import { http } from "@/utils/http";

export const TAG_TYPE = {
  CONTENT: "CONTENT",
  STYLE: "STYLE",
  OCCASION: "OCCASION"
} as const;

export type TagType = (typeof TAG_TYPE)[keyof typeof TAG_TYPE];

export type Tag = {
  id: number;
  name: string;
  slug: string;
  type: TagType;
  createdAt: string;
  usageCount: number;
};

export type TagForm = {
  name: string;
  type: TagType;
  slug?: string;
};

/** Generate URL-safe slug from name */
const toSlug = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "");

/** 取得所有 tag（公開） */
export const getTags = () => {
  return http.request<Tag[]>("get", "/api/tags");
};

/** 新增 tag */
export const createTag = (data: TagForm) => {
  const payload = {
    name: data.name,
    type: data.type,
    slug: data.slug ? data.slug : toSlug(data.name)
  };
  return http.request<Tag>("post", "/api/admin/tags", { data: payload });
};

/** 更新 tag */
export const updateTag = (id: number, data: TagForm) => {
  const payload = {
    name: data.name,
    type: data.type,
    slug: data.slug ? data.slug : toSlug(data.name)
  };
  return http.request<Tag>("put", `/api/admin/tags/${id}`, { data: payload });
};

/** 刪除 tag */
export const deleteTag = (id: number) => {
  return http.request<void>("delete", `/api/admin/tags/${id}`);
};
