/*
  Warnings:

  - You are about to drop the column `attachmentType` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "attachmentType",
ADD COLUMN     "attachmentMimeType" TEXT;
