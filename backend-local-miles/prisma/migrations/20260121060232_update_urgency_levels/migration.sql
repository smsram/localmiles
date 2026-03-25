-- AlterEnum
ALTER TYPE "UrgencyLevel" ADD VALUE 'SCHEDULED';

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "scheduledDate" TIMESTAMP(3);
