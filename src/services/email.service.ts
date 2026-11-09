import path from "node:path";
import ejs from "ejs";
import { Resend } from "resend";
import type { Booking, Customer, Service } from "@prisma/client";
import { env } from "../config/env";
import { BUSINESS_CONTACT } from "../config/business";
import { formatLocalDate, formatLocalTime } from "../utils/dateRange";

const TEMPLATE_PATH = path.join(__dirname, "..", "views", "emails", "notification.ejs");

let resendClient: Resend | null | undefined;

// Lazy and memoized: undefined means "not checked yet", null means "checked,
// not configured". Avoids constructing a Resend client (and erroring) when
// no API key is set, e.g. in dev/test.
function getResendClient(): Resend | null {
  if (resendClient === undefined) {
    resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  }
  return resendClient;
}

interface DetailRow {
  label: string;
  value: string;
}

interface NotificationEmailInput {
  to: string;
  subject: string;
  eyebrow: string;
  title: string;
  introHtml: string;
  introText: string;
  detailRows: DetailRow[];
  outroHtml?: string;
  outroText?: string;
  ctaText?: string;
  ctaUrl?: string;
}

function plainText(input: NotificationEmailInput): string {
  const lines = [input.title, "", input.introText, ""];
  input.detailRows.forEach((row) => lines.push(`${row.label}: ${row.value}`));
  if (input.outroText) lines.push("", input.outroText);
  if (input.ctaText && input.ctaUrl) lines.push("", `${input.ctaText}: ${input.ctaUrl}`);
  lines.push("", `${BUSINESS_CONTACT.brand} · ${BUSINESS_CONTACT.tagline} · ${BUSINESS_CONTACT.area}`);
  lines.push(`${BUSINESS_CONTACT.email} · ${BUSINESS_CONTACT.phone}`);
  return lines.join("\n");
}

// Never throws: a failed or unconfigured email send must not break the
// booking operation that triggered it. Logged either way so failures are
// at least visible server-side.
async function sendNotificationEmail(input: NotificationEmailInput): Promise<void> {
  const client = getResendClient();
  if (!client || !env.EMAIL_FROM) {
    console.log(`[email] skipped (not configured): "${input.subject}" to ${input.to}`);
    return;
  }

  try {
    const html = await ejs.renderFile(TEMPLATE_PATH, {
      title: input.title,
      preheader: input.introText,
      eyebrow: input.eyebrow,
      introHtml: input.introHtml,
      detailRows: input.detailRows,
      outroHtml: input.outroHtml ?? null,
      ctaText: input.ctaText ?? null,
      ctaUrl: input.ctaUrl ?? null,
      contact: BUSINESS_CONTACT,
    });

    const result = await client.emails.send({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html,
      text: plainText(input),
    });

    if (result.error) {
      console.error(`[email] Resend rejected "${input.subject}" to ${input.to}:`, result.error);
    }
  } catch (err) {
    console.error(`[email] failed to send "${input.subject}" to ${input.to}:`, err);
  }
}

function money(value: Booking["priceSnapshot"]): string {
  return value === null ? "To be confirmed" : `£${value.toString()}`;
}

function scheduledWhen(booking: Booking): string {
  if (!booking.scheduledStartAt || !booking.scheduledEndAt) return "To be confirmed";
  return `${formatLocalDate(booking.scheduledStartAt)}, ${formatLocalTime(booking.scheduledStartAt)}–${formatLocalTime(booking.scheduledEndAt)}`;
}

export async function sendBookingRequestReceivedEmail(customer: Customer, service: Service, booking: Booking) {
  if (!customer.email) return;
  await sendNotificationEmail({
    to: customer.email,
    subject: "We've received your booking request",
    eyebrow: "Request received",
    title: `Thanks, ${customer.name.split(" ")[0]} — we've got your request`,
    introHtml: "We'll review it and confirm the time, date and price as soon as we can. This is a request, not a confirmed booking yet.",
    introText: "We'll review it and confirm the time, date and price as soon as we can. This is a request, not a confirmed booking yet.",
    detailRows: [
      { label: "Service", value: service.name },
      { label: "Requested date", value: formatLocalDate(booking.requestedDate) },
      { label: "Requested time", value: booking.requestedTime },
      { label: "Estimated price", value: money(booking.priceSnapshot) },
    ],
  });
}

export async function sendBookingConfirmedEmail(customer: Customer, service: Service, booking: Booking) {
  if (!customer.email) return;
  await sendNotificationEmail({
    to: customer.email,
    subject: "Your booking is confirmed",
    eyebrow: "Booking confirmed",
    title: "You're booked in",
    introHtml: "Here's a summary of your confirmed appointment.",
    introText: "Here's a summary of your confirmed appointment.",
    detailRows: [
      { label: "Service", value: service.name },
      { label: "Scheduled for", value: scheduledWhen(booking) },
      { label: "Address", value: `${booking.address}, ${booking.postcode}` },
      { label: "Price", value: money(booking.priceSnapshot) },
    ],
    outroHtml: "If anything's changed, just reply to this email or give us a call.",
    outroText: "If anything's changed, just reply to this email or give us a call.",
  });
}

export async function sendBookingRescheduledEmail(customer: Customer, service: Service, booking: Booking) {
  if (!customer.email) return;
  await sendNotificationEmail({
    to: customer.email,
    subject: "Your booking has been rescheduled",
    eyebrow: "Booking rescheduled",
    title: "Your appointment has a new time",
    introHtml: "Here's the updated schedule for your booking.",
    introText: "Here's the updated schedule for your booking.",
    detailRows: [
      { label: "Service", value: service.name },
      { label: "New date & time", value: scheduledWhen(booking) },
      { label: "Address", value: `${booking.address}, ${booking.postcode}` },
    ],
    outroHtml: "If the new time doesn't work, just reply to this email or give us a call.",
    outroText: "If the new time doesn't work, just reply to this email or give us a call.",
  });
}

export async function sendBookingCancelledEmail(customer: Customer, service: Service, booking: Booking) {
  if (!customer.email) return;
  await sendNotificationEmail({
    to: customer.email,
    subject: "Your booking has been cancelled",
    eyebrow: "Booking cancelled",
    title: "Your booking has been cancelled",
    introHtml: "This appointment is no longer scheduled. You're welcome to request another booking any time.",
    introText: "This appointment is no longer scheduled. You're welcome to request another booking any time.",
    detailRows: [
      { label: "Service", value: service.name },
      { label: "Requested date", value: formatLocalDate(booking.requestedDate) },
    ],
  });
}

export async function sendBookingCompletedEmail(customer: Customer, service: Service, booking: Booking) {
  if (!customer.email) return;
  await sendNotificationEmail({
    to: customer.email,
    subject: "All done — thank you!",
    eyebrow: "Job complete",
    title: "Thanks for choosing Amanda's",
    introHtml: "Hope everything's left exactly how you wanted. If you noticed anything we should know about, just reply to this email.",
    introText: "Hope everything's left exactly how you wanted. If you noticed anything we should know about, just reply to this email.",
    detailRows: [
      { label: "Service", value: service.name },
      { label: "Completed", value: scheduledWhen(booking) },
      { label: "Price", value: money(booking.priceSnapshot) },
    ],
    outroHtml: "Ask about our Home Care Plan: a regular clean plus errand hours at a small discount.",
    outroText: "Ask about our Home Care Plan: a regular clean plus errand hours at a small discount.",
    ctaText: "Book your next visit",
    ctaUrl: env.APP_BASE_URL,
  });
}

export async function sendNewBookingRequestAdminEmail(customer: Customer, service: Service, booking: Booking) {
  const to = env.ADMIN_NOTIFICATION_EMAIL || env.SEED_ADMIN_EMAIL;
  if (!to) return;
  await sendNotificationEmail({
    to,
    subject: `New booking request: ${service.name}`,
    eyebrow: "New request",
    title: `New request from ${customer.name}`,
    introHtml: "A new booking request needs review.",
    introText: "A new booking request needs review.",
    detailRows: [
      { label: "Service", value: service.name },
      { label: "Requested date", value: formatLocalDate(booking.requestedDate) },
      { label: "Requested time", value: booking.requestedTime },
      { label: "Customer", value: customer.name },
      { label: "Phone", value: customer.phone },
      { label: "Email", value: customer.email ?? "—" },
      { label: "Address", value: `${booking.address}, ${booking.postcode}` },
      { label: "Notes", value: booking.instructions ?? "None" },
      { label: "Estimated price", value: money(booking.priceSnapshot) },
    ],
    ctaText: "Review in admin",
    ctaUrl: `${env.APP_BASE_URL}/admin/bookings/${booking.id}`,
  });
}
