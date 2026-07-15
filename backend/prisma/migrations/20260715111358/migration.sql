/*
  Warnings:

  - Changed the type of `reason` on the `Report` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('HARASSMENT', 'HATE_SPEECH', 'SPAM', 'IMPERSONATION', 'NSFW', 'VIOLENCE', 'MISINFORMATION', 'ACADEMIC_DISHONESTY', 'OTHER');

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "hiddenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "hiddenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "reason",
ADD COLUMN     "reason" "ReportReason" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspensionReason" TEXT;
