-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('PENDING', 'ISSUED', 'VERIFIED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DataStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "githubId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastFetchedAt" TIMESTAMP(3),
    "dataStatus" "DataStatus",
    "email" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chainType" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userInfo" JSONB NOT NULL,
    "repos" JSONB NOT NULL,
    "orgs" JSONB NOT NULL,
    "languagesData" JSONB NOT NULL,
    "status" "DataStatus" NOT NULL DEFAULT 'PENDING',
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GithubData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractsData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contracts" JSONB NOT NULL,
    "status" "DataStatus" NOT NULL DEFAULT 'PENDING',
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractsData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnchainData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "history" JSONB NOT NULL,
    "status" "DataStatus" NOT NULL DEFAULT 'PENDING',
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contractStats" JSONB NOT NULL,
    "transactionStats" JSONB NOT NULL,
    "hackathonData" JSONB,

    CONSTRAINT "OnchainData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metrics" JSONB NOT NULL,
    "status" "DataStatus" NOT NULL DEFAULT 'PENDING',
    "lastScore" DOUBLE PRECISION DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thresholds" JSONB NOT NULL,
    "weights" JSONB NOT NULL,
    "enabledChains" JSONB NOT NULL,
    "developerWorthMultipliers" JSONB NOT NULL,
    "cryptoRepos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperWorth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalWorth" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "details" JSONB NOT NULL,
    "lastWorth" DOUBLE PRECISION DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperWorth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "klyro_gates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowSelfVerify" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "maxVerifications" INTEGER,
    "bannerUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#6366f1',
    "customMessage" TEXT,
    "actionType" TEXT,
    "actionUrl" TEXT,
    "actionMethod" TEXT DEFAULT 'POST',
    "actionHeaders" TEXT,
    "actionPayload" TEXT,
    "successMessage" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "klyro_gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "klyro_gate_credential_requirements" (
    "id" TEXT NOT NULL,
    "klyroGateId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "stringValue" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "klyro_gate_credential_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "klyro_gate_verifications" (
    "id" TEXT NOT NULL,
    "klyroGateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "credentialResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "klyro_gate_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT,
    "issuerDid" TEXT,
    "credentialHash" TEXT,
    "status" "CredentialStatus" NOT NULL DEFAULT 'PENDING',
    "credentialSubject" JSONB,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "GithubData_userId_key" ON "GithubData"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractsData_userId_key" ON "ContractsData"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OnchainData_userId_key" ON "OnchainData"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserScore_userId_key" ON "UserScore"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformConfig_name_key" ON "PlatformConfig"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperWorth_userId_key" ON "DeveloperWorth"("userId");

-- CreateIndex
CREATE INDEX "DeveloperWorth_userId_idx" ON "DeveloperWorth"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "klyro_gates_slug_key" ON "klyro_gates"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "klyro_gate_verifications_klyroGateId_userId_key" ON "klyro_gate_verifications"("klyroGateId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_credentials_userId_key" ON "user_credentials"("userId");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubData" ADD CONSTRAINT "GithubData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractsData" ADD CONSTRAINT "ContractsData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnchainData" ADD CONSTRAINT "OnchainData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserScore" ADD CONSTRAINT "UserScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperWorth" ADD CONSTRAINT "DeveloperWorth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "klyro_gates" ADD CONSTRAINT "klyro_gates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "klyro_gate_credential_requirements" ADD CONSTRAINT "klyro_gate_credential_requirements_klyroGateId_fkey" FOREIGN KEY ("klyroGateId") REFERENCES "klyro_gates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "klyro_gate_verifications" ADD CONSTRAINT "klyro_gate_verifications_klyroGateId_fkey" FOREIGN KEY ("klyroGateId") REFERENCES "klyro_gates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "klyro_gate_verifications" ADD CONSTRAINT "klyro_gate_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
