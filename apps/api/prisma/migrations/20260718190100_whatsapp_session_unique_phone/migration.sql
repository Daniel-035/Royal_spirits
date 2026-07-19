-- CreateIndex: unique phone so one active WhatsApp session per number
CREATE UNIQUE INDEX "whatsapp_sessions_phone_key" ON "whatsapp_sessions"("phone");
