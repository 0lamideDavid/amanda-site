-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "inviteTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_inviteToken_key" ON "AdminUser"("inviteToken");
