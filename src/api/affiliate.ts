import { http } from "@/utils/http";

export type CommissionStatus = "PENDING" | "APPROVED" | "PAID";

export type Affiliate = {
  id: number;
  name: string;
  email: string | null;
  referralCode: string;
  commissionRate: number;
  isActive: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AffiliateStats = {
  affiliateId: number;
  affiliateName: string;
  totalClicks: number;
  totalConversions: number;
  totalCommission: number;
};

export type Commission = {
  id: number;
  affiliateId: number;
  affiliateName: string;
  orderId: number;
  orderNumber: string;
  commissionAmount: number;
  status: CommissionStatus;
  paidAt: string | null;
  createdAt: string;
};

export type CreateAffiliateRequest = {
  name: string;
  email: string | null;
  referralCode: string;
  commissionRate: number;
  isActive: boolean;
  note: string | null;
};

export const COMMISSION_STATUS: Record<
  CommissionStatus,
  { label: string; type: "warning" | "success" | "primary" | "info" | "danger" }
> = {
  PENDING: { label: "待審核", type: "warning" },
  APPROVED: { label: "已核准", type: "success" },
  PAID: { label: "已付款", type: "info" }
};

export const getAllAffiliates = () =>
  http.request<Affiliate[]>("get", "/api/admin/affiliates");

export const createAffiliate = (data: CreateAffiliateRequest) =>
  http.request<Affiliate>("post", "/api/admin/affiliates", { data });

export const updateAffiliate = (id: number, data: CreateAffiliateRequest) =>
  http.request<Affiliate>("put", `/api/admin/affiliates/${id}`, { data });

export const getAffiliateStats = (id: number) =>
  http.request<AffiliateStats>("get", `/api/admin/affiliates/${id}/stats`);

export const getAllCommissions = () =>
  http.request<Commission[]>("get", "/api/admin/affiliates/commissions");

export const updateCommissionStatus = (
  commissionId: number,
  status: CommissionStatus
) =>
  http.request<Commission>(
    "patch",
    `/api/admin/affiliates/commissions/${commissionId}/status`,
    { params: { status } }
  );
