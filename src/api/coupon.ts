import { http } from "@/utils/http";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type Coupon = {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  affiliateId: number | null;
  affiliateName: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCouponRequest = {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  affiliateId: number | null;
  description: string | null;
};

export const DISCOUNT_TYPE: Record<DiscountType, string> = {
  PERCENTAGE: "百分比折扣",
  FIXED_AMOUNT: "固定金額折抵"
};

export const getAllCoupons = () =>
  http.request<Coupon[]>("get", "/api/admin/coupons");

export const createCoupon = (data: CreateCouponRequest) =>
  http.request<Coupon>("post", "/api/admin/coupons", { data });

export const updateCoupon = (id: number, data: CreateCouponRequest) =>
  http.request<Coupon>("put", `/api/admin/coupons/${id}`, { data });

export const deactivateCoupon = (id: number) =>
  http.request<void>("delete", `/api/admin/coupons/${id}`);
