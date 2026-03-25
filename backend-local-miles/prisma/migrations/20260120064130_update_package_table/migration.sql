/*
  Warnings:

  - The `category` column on the `packages` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `distanceKm` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverName` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverPhone` to the `packages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PackageCategory" AS ENUM ('DOCUMENTS', 'ELECTRONICS', 'FOOD', 'CLOTHING', 'FURNITURE', 'OTHER');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('STANDARD', 'URGENT');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('PREPAID', 'COD');

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "dimensionType" TEXT,
ADD COLUMN     "distanceKm" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "isFragile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLiquid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "keepUpright" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMode" "PaymentMode" NOT NULL DEFAULT 'PREPAID',
ADD COLUMN     "receiverEmail" TEXT,
ADD COLUMN     "receiverName" TEXT NOT NULL,
ADD COLUMN     "receiverPhone" TEXT NOT NULL,
ADD COLUMN     "safetyConfirmed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "urgency" "UrgencyLevel" NOT NULL DEFAULT 'STANDARD',
DROP COLUMN "category",
ADD COLUMN     "category" "PackageCategory" NOT NULL DEFAULT 'DOCUMENTS';

-- CreateTable
CREATE TABLE "package_images" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "package_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "package_images" ADD CONSTRAINT "package_images_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
