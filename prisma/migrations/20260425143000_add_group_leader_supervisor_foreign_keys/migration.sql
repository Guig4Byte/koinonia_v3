-- Ensure existing optional group leadership fields point to existing users before adding FKs.
UPDATE "Group"
SET "leaderId" = NULL
WHERE "leaderId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "User"
    WHERE "User"."id" = "Group"."leaderId"
  );

UPDATE "Group"
SET "supervisorId" = NULL
WHERE "supervisorId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "User"
    WHERE "User"."id" = "Group"."supervisorId"
  );

-- Add explicit database-level integrity between groups and users.
ALTER TABLE "Group"
ADD CONSTRAINT "Group_leaderId_fkey"
FOREIGN KEY ("leaderId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Group"
ADD CONSTRAINT "Group_supervisorId_fkey"
FOREIGN KEY ("supervisorId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
