/*
  Warnings:

  - You are about to drop the column `city` on the `PetPost` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `PetPost` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `PetPost` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `User` table. All the data in the column will be lost.
  - Added the required column `cityId` to the `PetPost` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PetPost_city_district_idx";

-- DropIndex
DROP INDEX "User_city_district_idx";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "requestId" TEXT;

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "isVaccinated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PetPost" DROP COLUMN "city",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "cityId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "city",
ADD COLUMN     "cityId" TEXT,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "showLastSeen" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showReadReceipts" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "Notification_requestId_idx" ON "Notification"("requestId");

-- CreateIndex
CREATE INDEX "PetPost_cityId_district_idx" ON "PetPost"("cityId", "district");

-- CreateIndex
CREATE INDEX "User_cityId_district_idx" ON "User"("cityId", "district");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetPost" ADD CONSTRAINT "PetPost_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AdoptionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
