/*
  Warnings:

  - A unique constraint covering the columns `[airDid]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[airUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "airDid" TEXT,
ADD COLUMN     "airUserId" TEXT,
ALTER COLUMN "githubId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_airDid_key" ON "User"("airDid");

-- CreateIndex
CREATE UNIQUE INDEX "User_airUserId_key" ON "User"("airUserId");
