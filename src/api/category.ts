import { http } from "@/utils/http";

export type Category = {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
  parentName: string | null;
  children?: Category[];
  active: boolean;
  productCount: number;
  isTopLevel?: boolean;
  coverImageUrl: string | null;
};

export type CategoryForm = {
  name: string;
  description: string;
  parentId: number | null;
  active: boolean;
};

/** 取得所有分類（含子分類） */
export const getCategories = () => {
  return http.request<Category[]>("get", "/api/categories");
};

/** 取得單一分類 */
export const getCategory = (id: number) => {
  return http.request<Category>("get", `/api/categories/${id}`);
};

/** 新增分類 */
export const createCategory = (data: CategoryForm) => {
  return http.request<Category>("post", "/api/categories", { data });
};

/** 更新分類 */
export const updateCategory = (id: number, data: CategoryForm) => {
  return http.request<Category>("put", `/api/categories/${id}`, { data });
};

/** 刪除分類 */
export const deleteCategory = (id: number) => {
  return http.request<void>("delete", `/api/categories/${id}`);
};

/** 設定分類封面圖 */
export const setCategoryCoverImage = (id: number, mediaAssetId: number) => {
  return http.request<void>(
    "patch",
    `/api/admin/categories/${id}/cover-image`,
    {
      data: { mediaAssetId }
    }
  );
};

/** 移除分類封面圖 */
export const removeCategoryCoverImage = (id: number) => {
  return http.request<void>(
    "delete",
    `/api/admin/categories/${id}/cover-image`
  );
};
