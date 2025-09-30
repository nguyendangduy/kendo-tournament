-- CreateEnum
CREATE TYPE "public"."TournamentStatus" AS ENUM ('DRAFT', 'REGISTRATION', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."MatchStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'PAUSED', 'FINISHED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."ParticipantType" AS ENUM ('PLAYER', 'TEAM');

-- CreateEnum
CREATE TYPE "public"."ScoreKind" AS ENUM ('MEN', 'KOTE', 'DO', 'TSUKI', 'PENALTY');

-- CreateEnum
CREATE TYPE "public"."Side" AS ENUM ('RED', 'WHITE');

-- CreateEnum
CREATE TYPE "public"."BracketType" AS ENUM ('SINGLE_ELIMINATION', 'ROUND_ROBIN');

-- CreateTable
CREATE TABLE "public"."Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Division" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bracketType" "public"."BracketType" NOT NULL,
    "targetPoints" INTEGER NOT NULL DEFAULT 2,
    "matchDurationSec" INTEGER NOT NULL DEFAULT 180,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "club" TEXT,
    "rank" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "club" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamMember" (
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("teamId","playerId")
);

-- CreateTable
CREATE TABLE "public"."Participant" (
    "id" TEXT NOT NULL,
    "type" "public"."ParticipantType" NOT NULL,
    "playerId" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DivisionParticipant" (
    "divisionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "seed" INTEGER,

    CONSTRAINT "DivisionParticipant_pkey" PRIMARY KEY ("divisionId","participantId")
);

-- CreateTable
CREATE TABLE "public"."Match" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "divisionId" TEXT,
    "round" INTEGER,
    "order" INTEGER,
    "status" "public"."MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "targetPoints" INTEGER,
    "winnerParticipantId" TEXT,
    "parentMatchId" TEXT,
    "bracketData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MatchParticipant" (
    "matchId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "side" "public"."Side" NOT NULL,

    CONSTRAINT "MatchParticipant_pkey" PRIMARY KEY ("matchId","side")
);

-- CreateTable
CREATE TABLE "public"."ScoreEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "kind" "public"."ScoreKind" NOT NULL,
    "point" INTEGER NOT NULL DEFAULT 1,
    "timeSec" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Division_tournamentId_idx" ON "public"."Division"("tournamentId");

-- CreateIndex
CREATE INDEX "Participant_playerId_idx" ON "public"."Participant"("playerId");

-- CreateIndex
CREATE INDEX "Participant_teamId_idx" ON "public"."Participant"("teamId");

-- CreateIndex
CREATE INDEX "Match_tournamentId_idx" ON "public"."Match"("tournamentId");

-- CreateIndex
CREATE INDEX "Match_divisionId_idx" ON "public"."Match"("divisionId");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "public"."Match"("status");

-- CreateIndex
CREATE INDEX "Match_parentMatchId_idx" ON "public"."Match"("parentMatchId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchParticipant_matchId_participantId_key" ON "public"."MatchParticipant"("matchId", "participantId");

-- CreateIndex
CREATE INDEX "ScoreEvent_matchId_idx" ON "public"."ScoreEvent"("matchId");

-- CreateIndex
CREATE INDEX "ScoreEvent_participantId_idx" ON "public"."ScoreEvent"("participantId");

-- AddForeignKey
ALTER TABLE "public"."Division" ADD CONSTRAINT "Division_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Participant" ADD CONSTRAINT "Participant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Participant" ADD CONSTRAINT "Participant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DivisionParticipant" ADD CONSTRAINT "DivisionParticipant_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "public"."Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DivisionParticipant" ADD CONSTRAINT "DivisionParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "public"."Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_winnerParticipantId_fkey" FOREIGN KEY ("winnerParticipantId") REFERENCES "public"."Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_parentMatchId_fkey" FOREIGN KEY ("parentMatchId") REFERENCES "public"."Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchParticipant" ADD CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchParticipant" ADD CONSTRAINT "MatchParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScoreEvent" ADD CONSTRAINT "ScoreEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScoreEvent" ADD CONSTRAINT "ScoreEvent_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
