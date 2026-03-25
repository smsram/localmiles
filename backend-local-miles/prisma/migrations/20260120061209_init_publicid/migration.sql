/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `packages` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[publicId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicId` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "publicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "publicId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "packages_publicId_key" ON "packages"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "users_publicId_key" ON "users"("publicId");
