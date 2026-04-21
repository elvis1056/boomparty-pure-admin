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
};

export type TagForm = {
  name: string;
  type: TagType;
};

/** 取得所有 tag（公開） */
export const getTags = () => {
  return http.request<Tag[]>("get", "/api/tags");
};

/** 新增 tag */
export const createTag = (data: TagForm) => {
  return http.request<Tag>("post", "/api/admin/tags", { data });
};

/** 刪除 tag */
export const deleteTag = (id: number) => {
  return http.request<void>("delete", `/api/admin/tags/${id}`);
};
