-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "priceSnapshot" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Booking_status_scheduledStartAt_scheduledEndAt_idx" ON "Booking"("status", "scheduledStartAt", "scheduledEndAt");

