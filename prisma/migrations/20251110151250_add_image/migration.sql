-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "imagePath" TEXT;

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "Post"("userId");
