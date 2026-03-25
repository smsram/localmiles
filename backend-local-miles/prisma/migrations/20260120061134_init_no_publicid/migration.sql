/*
  Warnings:

  - You are about to drop the column `publicId` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `publicId` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "packages_publicId_key";

-- DropIndex
DROP INDEX "users_publicId_key";

-- AlterTable
ALTER TABLE "packages" DROP COLUMN "publicId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "publicId";
