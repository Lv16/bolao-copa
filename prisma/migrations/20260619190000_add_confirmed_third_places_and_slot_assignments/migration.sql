-- CreateEnum
CREATE TYPE "KnockoutSlotSide" AS ENUM ('HOME', 'AWAY');

-- CreateTable
CREATE TABLE "ConfirmedThirdPlace" (
    "id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfirmedThirdPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnockoutThirdSlotAssignment" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "side" "KnockoutSlotSide" NOT NULL,
    "selectedGroupName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnockoutThirdSlotAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfirmedThirdPlace_groupName_key" ON "ConfirmedThirdPlace"("groupName");

-- CreateIndex
CREATE UNIQUE INDEX "KnockoutThirdSlotAssignment_matchId_side_key" ON "KnockoutThirdSlotAssignment"("matchId", "side");

-- AddForeignKey
ALTER TABLE "KnockoutThirdSlotAssignment" ADD CONSTRAINT "KnockoutThirdSlotAssignment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
