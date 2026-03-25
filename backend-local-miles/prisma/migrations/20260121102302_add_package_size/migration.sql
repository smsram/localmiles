/*
  Warnings:

  - You are about to drop the column `dimensionType` on the `packages` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PackageSize" AS ENUM ('ENVELOPE', 'SMALL_BOX', 'MEDIUM_BOX', 'LARGE_BOX', 'OVERSIZED');

-- AlterTable
ALTER TABLE "packages" DROP COLUMN "dimensionType",
ADD COLUMN     "size" "PackageSize" NOT NULL DEFAULT 'SMALL_BOX';
