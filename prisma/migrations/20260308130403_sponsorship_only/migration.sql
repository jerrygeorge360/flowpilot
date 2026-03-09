/*
  Warnings:

  - You are about to drop the `ActivityEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlanExecution` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ActivityEvent" DROP CONSTRAINT "ActivityEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "PlanExecution" DROP CONSTRAINT "PlanExecution_userId_fkey";

-- DropTable
DROP TABLE "ActivityEvent";

-- DropTable
DROP TABLE "PlanExecution";

-- DropEnum
DROP TYPE "ActionType";

-- DropEnum
DROP TYPE "ActivityType";
