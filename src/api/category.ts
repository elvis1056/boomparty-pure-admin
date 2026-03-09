import { http } from "@/utils/http";

export type Category = {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
  parentName: string | null;
  children?: Category[];
  active?: boolean;
  productCount?: number;
};

/** 取得所有分類（含子分類） */
export const getCategories = () => {
  return http.request<Category[]>("get", "/api/categories");
};
