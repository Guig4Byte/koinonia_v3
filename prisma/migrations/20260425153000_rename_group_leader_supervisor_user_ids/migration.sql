-- Rename group leadership columns to make explicit that they reference User.id.
ALTER TABLE "Group" RENAME COLUMN "leaderId" TO "leaderUserId";
ALTER TABLE "Group" RENAME COLUMN "supervisorId" TO "supervisorUserId";

-- Keep database object names aligned with the new column names.
ALTER INDEX IF EXISTS "Group_leaderId_idx" RENAME TO "Group_leaderUserId_idx";
ALTER INDEX IF EXISTS "Group_supervisorId_idx" RENAME TO "Group_supervisorUserId_idx";

ALTER TABLE "Group" RENAME CONSTRAINT "Group_leaderId_fkey" TO "Group_leaderUserId_fkey";
ALTER TABLE "Group" RENAME CONSTRAINT "Group_supervisorId_fkey" TO "Group_supervisorUserId_fkey";
