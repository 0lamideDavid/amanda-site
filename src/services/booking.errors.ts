export class BookingConflictError extends Error {
  constructor(message = "The requested time overlaps an existing confirmed booking.") {
    super(message);
    this.name = "BookingConflictError";
  }
}

export class InvalidBookingTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBookingTransitionError";
  }
}
