-- AlterTable: add source column to orders (defaults to existing web orders)
ALTER TABLE "orders" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'WEB';

-- CreateTable: WhatsApp conversation sessions
CREATE TABLE "whatsapp_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'GREETING',
    "contextJson" TEXT NOT NULL DEFAULT '{}',
    "cartJson" TEXT NOT NULL DEFAULT '[]',
    "customerName" TEXT,
    "lastIntentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable: idempotent log of inbound/outbound WhatsApp messages
CREATE TABLE "whatsapp_event_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waMessageId" TEXT NOT NULL,
    "fromPhone" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "whatsapp_sessions_phone_idx" ON "whatsapp_sessions"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_event_log_waMessageId_key" ON "whatsapp_event_log"("waMessageId");

-- CreateIndex
CREATE INDEX "whatsapp_event_log_fromPhone_idx" ON "whatsapp_event_log"("fromPhone");
