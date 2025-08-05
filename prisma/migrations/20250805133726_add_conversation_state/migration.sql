-- CreateTable
CREATE TABLE "conversation_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'greeting',
    "context" JSONB NOT NULL DEFAULT '{}',
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_states_userId_conversationId_key" ON "conversation_states"("userId", "conversationId");

-- AddForeignKey
ALTER TABLE "conversation_states" ADD CONSTRAINT "conversation_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
