DROP TABLE IF EXISTS "PostComment" CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "AdoptionRequest_postId_applicantUserId_key"
ON "AdoptionRequest"("postId", "applicantUserId");
