/*
  Warnings:

  - The `housingType` column on the `AdoptionRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "HousingType" AS ENUM ('DETACHED', 'APARTMENT', 'SITE', 'OTHER');

-- AlterTable
ALTER TABLE "AdoptionRequest" DROP COLUMN "housingType",
ADD COLUMN     "housingType" "HousingType";
