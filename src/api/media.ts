import { http } from "@/utils/http";

export type MediaAsset = {
  id: number;
  filename: string;
  originalName: string | null;
  url: string;
  fileSize: number | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  createdAt: string;
};

export type AltTextForm = {
  altText: string;
};

/** 上傳圖片 */
export const uploadMedia = (file: File, altText?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (altText) formData.append("altText", altText);
  return http.request<MediaAsset>("post", "/api/admin/media/upload", {
    data: formData,
    headers: { "Content-Type": "multipart/form-data" }
  });
};

/** 取得圖庫列表 */
export const getMediaList = () => {
  return http.request<MediaAsset[]>("get", "/api/admin/media");
};

/** 取得單張圖片 */
export const getMedia = (id: number) => {
  return http.request<MediaAsset>("get", `/api/admin/media/${id}`);
};

/** 更新 alt text */
export const updateAltText = (id: number, altText: string) => {
  return http.request<MediaAsset>("patch", `/api/admin/media/${id}/alt-text`, {
    data: { altText } satisfies AltTextForm
  });
};

/** 刪除圖片 */
export const deleteMedia = (id: number) => {
  return http.request<void>("delete", `/api/admin/media/${id}`);
};

/** 幫圖片加 tag */
export const addTagToMedia = (mediaId: number, tagId: number) => {
  return http.request<MediaAsset>("post", `/api/admin/media/${mediaId}/tags`, {
    data: { tagId }
  });
};

/** 移除圖片的 tag */
export const removeTagFromMedia = (mediaId: number, tagId: number) => {
  return http.request<void>(
    "delete",
    `/api/admin/media/${mediaId}/tags/${tagId}`
  );
};
