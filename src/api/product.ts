import { http } from "@/utils/http";

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  active: boolean;
  featured: boolean;
  categoryId: number | null;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductForm = {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  active: boolean;
  featured: boolean;
  categoryId: number | null;
};

/** 取得所有商品 */
export const getProducts = () => {
  return http.request<Product[]>("get", "/api/products");
};

/** 取得單一商品 */
export const getProduct = (id: number) => {
  return http.request<Product>("get", `/api/products/${id}`);
};

/** 新增商品 */
export const createProduct = (data: ProductForm) => {
  return http.request<Product>("post", "/api/products", { data });
};

/** 更新商品 */
export const updateProduct = (id: number, data: ProductForm) => {
  return http.request<Product>("put", `/api/products/${id}`, { data });
};

/** 刪除商品 */
export const deleteProduct = (id: number) => {
  return http.request<void>("delete", `/api/products/${id}`);
};
