-- AlterTable
ALTER TABLE "orders" ADD COLUMN "deliveredAt" DATETIME;
ALTER TABLE "orders" ADD COLUMN "estimatedDeliveryAt" DATETIME;
ALTER TABLE "orders" ADD COLUMN "paidAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_serviceable_zones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pincode" TEXT NOT NULL,
    "deliveryStartTime" TEXT NOT NULL,
    "deliveryEndTime" TEXT NOT NULL,
    "deliveryWindowMins" INTEGER NOT NULL DEFAULT 90,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_serviceable_zones" ("createdAt", "deliveryEndTime", "deliveryStartTime", "id", "isActive", "pincode", "updatedAt") SELECT "createdAt", "deliveryEndTime", "deliveryStartTime", "id", "isActive", "pincode", "updatedAt" FROM "serviceable_zones";
DROP TABLE "serviceable_zones";
ALTER TABLE "new_serviceable_zones" RENAME TO "serviceable_zones";
CREATE UNIQUE INDEX "serviceable_zones_pincode_key" ON "serviceable_zones"("pincode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_paymentStatus_idx" ON "orders"("paymentStatus");
