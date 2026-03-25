-- CreateEnum
CREATE TYPE "UserIntent" AS ENUM ('SENDER', 'COURIER', 'BOTH');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "primaryGoal" "UserIntent";
