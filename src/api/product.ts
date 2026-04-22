import { http } from "@/utils/http";

export type ProductImage = {
  id: number;
  mediaAssetId: number;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

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
  images: ProductImage[];
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

/** 查詢商品所有圖片 */
export const getProductImages = (id: number) => {
  return http.request<ProductImage[]>("get", `/api/products/${id}/images`);
};

/** 為商品加圖 */
export const addProductImage = (productId: number, mediaAssetId: number) => {
  return http.request<ProductImage>(
    "post",
    `/api/admin/products/${productId}/images`,
    {
      data: { mediaAssetId }
    }
  );
};

/** 移除商品某張圖 */
export const removeProductImage = (productId: number, imageId: number) => {
  return http.request<void>(
    "delete",
    `/api/admin/products/${productId}/images/${imageId}`
  );
};

/** 設為主圖 */
export const setProductPrimaryImage = (productId: number, imageId: number) => {
  return http.request<ProductImage>(
    "patch",
    `/api/admin/products/${productId}/images/${imageId}/primary`
  );
};

/** 更新排序 */
export const reorderProductImages = (
  productId: number,
  orders: { imageId: number; sortOrder: number }[]
) => {
  return http.request<void>(
    "patch",
    `/api/admin/products/${productId}/images/reorder`,
    { data: orders }
  );
};
