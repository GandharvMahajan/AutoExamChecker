/*
  Warnings:

  - Added the required column `class` to the `ExamTest` table without a default value. This is not possible if the table is not empty.

*/
-- First add the column as nullable
ALTER TABLE "ExamTest" ADD COLUMN "class" INTEGER;

-- Update existing records with a default value of 10 (assuming high school level)
UPDATE "ExamTest" SET "class" = 10 WHERE "class" IS NULL;

-- Now make the column required
ALTER TABLE "ExamTest" ALTER COLUMN "class" SET NOT NULL;
