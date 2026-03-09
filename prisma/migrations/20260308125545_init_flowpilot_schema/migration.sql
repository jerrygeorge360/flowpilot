-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('VAULT_INITIALIZED', 'DEPOSIT', 'RULE_CREATED', 'PLAN_EXECUTED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SCHEDULED_SAVE', 'AUTO_YIELD', 'DCA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "freeTxTotal" INTEGER NOT NULL DEFAULT 10,
    "freeTxUsed" INTEGER NOT NULL DEFAULT 0,
    "lastSponsoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanExecution" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "summary" TEXT,
    "actionType" "ActionType" NOT NULL,
    "amount" DECIMAL(18,8),
    "currency" TEXT DEFAULT 'FLOW',
    "intervalDays" INTEGER,
    "txId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "amount" DECIMAL(18,8),
    "currency" TEXT DEFAULT 'FLOW',
    "txId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Sponsorship_userId_key" ON "Sponsorship"("userId");

-- CreateIndex
CREATE INDEX "Sponsorship_userId_idx" ON "Sponsorship"("userId");

-- CreateIndex
CREATE INDEX "PlanExecution_userId_createdAt_idx" ON "PlanExecution"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PlanExecution_txId_idx" ON "PlanExecution"("txId");

-- CreateIndex
CREATE INDEX "ActivityEvent_userId_createdAt_idx" ON "ActivityEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_txId_idx" ON "ActivityEvent"("txId");

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanExecution" ADD CONSTRAINT "PlanExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
