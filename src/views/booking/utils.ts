import type { EventInput } from "@fullcalendar/core";
import {
  BOOKING_STATUS,
  type Booking,
  type BookingStatusValue
} from "@/api/booking";

/** Get event date based on booking type (COMPLETION → completionTime, TIME_SLOT → performanceStart) */
export const getEventDate = (booking: Booking): string | null => {
  if (booking.bookingType === "COMPLETION") {
    return booking.completionTime;
  }
  return booking.performanceStart;
};

/** Element Plus color palette mapped to booking statuses */
export const STATUS_COLORS: Record<BookingStatusValue, string> = {
  INQUIRY: "#e6a23c",
  QUOTED: "#409eff",
  DEPOSIT_PAID: "#67c23a",
  CONFIRMED: "#529b2e",
  COMPLETED: "#909399",
  CANCELLED: "#f56c6c"
};

/** Transform a Booking object into a FullCalendar EventInput */
export const transformBookingToEvent = (
  booking: Booking
): EventInput | null => {
  const eventDate = getEventDate(booking);
  if (!eventDate) return null;

  const statusConfig = BOOKING_STATUS[booking.status];
  const title = `${booking.customerName} — ${booking.serviceName}`;

  return {
    id: String(booking.id),
    title,
    start: eventDate,
    end: booking.performanceEnd ? booking.performanceEnd : undefined,
    backgroundColor: STATUS_COLORS[booking.status],
    borderColor: STATUS_COLORS[booking.status],
    extendedProps: {
      booking,
      statusLabel: statusConfig.label
    }
  };
};
