import { http } from "@/utils/http";
import type { BookingStatusValue, BookingTypeValue } from "./booking";
import type { OrderStatusValue } from "./order";

// ── Types ───────────────────────────────────────────────────────

export type BookingPipeline = {
  inquiryCount: number;
  quotedCount: number;
  depositPaidCount: number;
  confirmedCount: number;
};

export type DashboardStats = {
  bookingPipeline: BookingPipeline;
  monthlyServiceRevenue: number;
  pendingOrderCount: number;
  monthlyProductRevenue: number;
};

export type UpcomingBooking = {
  id: number;
  bookingReference: string;
  serviceName: string;
  customerName: string;
  status: BookingStatusValue;
  bookingType: BookingTypeValue;
  eventTime: string;
  eventEnd: string | null;
};

export type ActionItemBooking = {
  id: number;
  bookingReference: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  status: BookingStatusValue;
  eventTime: string | null;
  quoteAmount: number | null;
  createdAt: string;
};

export type LowStockProduct = {
  id: number;
  name: string;
  price: number;
  stock: number;
};

export type LatestOrder = {
  id: number;
  orderNumber: string;
  status: OrderStatusValue;
  totalAmount: number;
  recipientName: string;
  createdAt: string;
};

export type ActionItems = {
  pendingQuotes: ActionItemBooking[];
  pendingDeposits: ActionItemBooking[];
  expiringSoon: ActionItemBooking[];
  lowStockProducts: LowStockProduct[];
  latestOrders: LatestOrder[];
};

// ── API Functions ───────────────────────────────────────────────

export const getDashboardStats = () => {
  return http.request<DashboardStats>("get", "/api/admin/dashboard/stats");
};

export const getUpcomingBookings = () => {
  return http.request<UpcomingBooking[]>(
    "get",
    "/api/admin/dashboard/upcoming-bookings"
  );
};

export const getActionItems = () => {
  return http.request<ActionItems>("get", "/api/admin/dashboard/action-items");
};
