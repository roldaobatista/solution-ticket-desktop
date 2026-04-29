ALTER TABLE "balanca" ADD COLUMN "modbus_unit_id" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "modbus_register" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "modbus_function" TEXT;
ALTER TABLE "balanca" ADD COLUMN "modbus_byte_order" TEXT;
ALTER TABLE "balanca" ADD COLUMN "modbus_word_order" TEXT;
ALTER TABLE "balanca" ADD COLUMN "modbus_signed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "balanca" ADD COLUMN "modbus_scale" DECIMAL;
ALTER TABLE "balanca" ADD COLUMN "modbus_offset" DECIMAL;
