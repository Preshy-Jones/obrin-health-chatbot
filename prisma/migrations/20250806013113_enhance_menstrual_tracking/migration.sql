-- AlterTable
ALTER TABLE "health_profiles" ADD COLUMN     "flowIntensity" TEXT,
ADD COLUMN     "periodHistory" JSONB,
ADD COLUMN     "periodLength" INTEGER,
ADD COLUMN     "reminderDays" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true;
