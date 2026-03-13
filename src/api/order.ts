import { http } from "@/utils/http";

export type OrderItem = {
  id: number;
  productId: number | null;
  productName: string;
  productImage: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type OrderStatusValue =
  | "ORDER_PENDING"
  | "ORDER_PAID"
  | "ORDER_PROCESSING"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ORDER_COMPLETED"
  | "ORDER_CANCELLED";

export type PaymentMethodValue = "CREDIT_CARD" | "CASH_ON_DELIVERY";

export type Order = {
  id: number;
  orderNumber: string;
  status: OrderStatusValue;
  totalAmount: number;
  shippingFee: number;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string | null;
  city: string;
  district: string;
  postalCode: string;
  addressLine: string;
  note: string | null;
  paymentMethod: PaymentMethodValue;
  paidAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export const ORDER_STATUS: Record<
  OrderStatusValue,
  { label: string; type: "warning" | "success" | "primary" | "info" | "danger" }
> = {
  ORDER_PENDING: { label: "待付款", type: "warning" },
  ORDER_PAID: { label: "已付款", type: "success" },
  ORDER_PROCESSING: { label: "處理中", type: "primary" },
  ORDER_SHIPPED: { label: "已出貨", type: "primary" },
  ORDER_DELIVERED: { label: "已送達", type: "success" },
  ORDER_COMPLETED: { label: "已完成", type: "info" },
  ORDER_CANCELLED: { label: "已取消", type: "danger" }
};

export const PAYMENT_METHOD: Record<PaymentMethodValue, string> = {
  CREDIT_CARD: "信用卡",
  CASH_ON_DELIVERY: "貨到付款"
};

/** 取得所有訂單（管理員） */
export const getAllOrders = () => {
  return http.request<Order[]>("get", "/api/orders/admin/all");
};

/** 取得單一訂單詳情（管理員） */
export const getOrderDetail = (id: number) => {
  return http.request<Order>("get", `/api/orders/admin/${id}`);
};

/** 更新訂單狀態（管理員） */
export const updateOrderStatus = (id: number, status: OrderStatusValue) => {
  return http.request<Order>("patch", `/api/orders/admin/${id}/status`, {
    params: { status }
  });
};
