/*
  Warnings:

  - Added the required column `programId` to the `klyro_gate_credential_requirements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "klyro_gate_credential_requirements" ADD COLUMN     "programId" TEXT NOT NULL;
