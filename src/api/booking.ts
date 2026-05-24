import { http } from "@/utils/http";

// ── Types ───────────────────────────────────────────────────────

export type BookingStatusValue =
  | "INQUIRY"
  | "QUOTED"
  | "DEPOSIT_PAID"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type BookingTypeValue = "COMPLETION" | "TIME_SLOT";

export type BookingPaymentMethodValue = "ONLINE" | "ONSITE";

export type Booking = {
  id: number;
  bookingReference: string;
  status: BookingStatusValue;
  createdAt: string;
  updatedAt: string;

  // Service
  serviceName: string;
  servicePrice: number | null;
  performerName: string | null;
  bookingType: BookingTypeValue;
  completionTime: string | null;
  performanceStart: string | null;
  performanceEnd: string | null;
  selectedDuration: number | null;

  // Customer
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerNotes: string | null;
  budget: number | null;

  // Payment
  paymentMethod: BookingPaymentMethodValue | null;
  totalPrice: number | null;

  // Quote
  quoteAmount: number | null;
  depositAmount: number | null;
  depositPaid: boolean;
  balanceAmount: number | null;
  balancePaid: boolean;

  // Cost & profit
  materialCost: number | null;
  grossProfit: number | null;
};

// ── Display Config ──────────────────────────────────────────────

export const BOOKING_STATUS: Record<
  BookingStatusValue,
  { label: string; type: "warning" | "success" | "primary" | "info" | "danger" }
> = {
  INQUIRY: { label: "詢問中", type: "warning" },
  QUOTED: { label: "已報價", type: "primary" },
  DEPOSIT_PAID: { label: "已付訂金", type: "success" },
  CONFIRMED: { label: "已確認", type: "success" },
  COMPLETED: { label: "已完成", type: "info" },
  CANCELLED: { label: "已取消", type: "danger" }
};

/** Valid next statuses for each status (mirrors backend canTransitionTo) */
export const BOOKING_STATUS_TRANSITIONS: Record<
  BookingStatusValue,
  BookingStatusValue[]
> = {
  INQUIRY: ["QUOTED", "CANCELLED"],
  QUOTED: ["DEPOSIT_PAID", "CANCELLED"],
  DEPOSIT_PAID: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: []
};

export const BOOKING_TYPE: Record<BookingTypeValue, string> = {
  COMPLETION: "佈置",
  TIME_SLOT: "表演"
};

export const BOOKING_PAYMENT_METHOD: Record<BookingPaymentMethodValue, string> =
  {
    ONLINE: "線上轉帳",
    ONSITE: "現場付現"
  };

// ── Sub-resource Types ──────────────────────────────────────────

export type BookingNote = {
  id: number;
  content: string;
  createdBy: string;
  createdAt: string;
};

export type BookingMaterial = {
  id: number;
  itemName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  note: string | null;
};

export type BookingPhoto = {
  id: number;
  mediaId: number;
  url: string;
  originalName: string | null;
  altText: string | null;
  displayOrder: number;
  createdAt: string;
};

export type QuoteForm = {
  quoteAmount: number;
  depositAmount: number;
};

export type MaterialForm = {
  itemName: string;
  quantity: number;
  unitCost: number;
  note?: string;
};

// ── API Functions ───────────────────────────────────────────────

/** Get all bookings (admin) */
export const getAllBookings = () => {
  return http.request<Booking[]>("get", "/api/admin/bookings");
};

/** Get single booking detail */
export const getBookingDetail = (id: number) => {
  return http.request<Booking>("get", `/api/admin/bookings/${id}`);
};

/** Update booking status (admin) */
export const updateBookingStatus = (id: number, status: BookingStatusValue) => {
  return http.request<Booking>("patch", `/api/admin/bookings/${id}/status`, {
    params: { status }
  });
};

/** Submit quote for a booking (INQUIRY → QUOTED) */
export const submitQuote = (id: number, data: QuoteForm) => {
  return http.request<Booking>("patch", `/api/admin/bookings/${id}/quote`, {
    data
  });
};

// ── Notes ───────────────────────────────────────────────────────

export const getBookingNotes = (id: number) => {
  return http.request<BookingNote[]>("get", `/api/admin/bookings/${id}/notes`);
};

export const addBookingNote = (id: number, content: string) => {
  return http.request<BookingNote>("post", `/api/admin/bookings/${id}/notes`, {
    data: { content }
  });
};

// ── Materials ───────────────────────────────────────────────────

export const getBookingMaterials = (id: number) => {
  return http.request<BookingMaterial[]>(
    "get",
    `/api/admin/bookings/${id}/materials`
  );
};

export const addBookingMaterial = (id: number, data: MaterialForm) => {
  return http.request<BookingMaterial>(
    "post",
    `/api/admin/bookings/${id}/materials`,
    { data }
  );
};

export const updateBookingMaterial = (
  bookingId: number,
  materialId: number,
  data: MaterialForm
) => {
  return http.request<BookingMaterial>(
    "put",
    `/api/admin/bookings/${bookingId}/materials/${materialId}`,
    { data }
  );
};

export const deleteBookingMaterial = (
  bookingId: number,
  materialId: number
) => {
  return http.request<void>(
    "delete",
    `/api/admin/bookings/${bookingId}/materials/${materialId}`
  );
};

// ── Photos ──────────────────────────────────────────────────────

export const getBookingPhotos = (id: number) => {
  return http.request<BookingPhoto[]>(
    "get",
    `/api/admin/bookings/${id}/photos`
  );
};

export const addBookingPhoto = (id: number, mediaId: number) => {
  return http.request<BookingPhoto>(
    "post",
    `/api/admin/bookings/${id}/photos`,
    { data: { mediaId } }
  );
};

export const deleteBookingPhoto = (bookingId: number, photoId: number) => {
  return http.request<void>(
    "delete",
    `/api/admin/bookings/${bookingId}/photos/${photoId}`
  );
};
