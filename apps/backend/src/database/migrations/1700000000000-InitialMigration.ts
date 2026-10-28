import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enable uuid-ossp or pgcrypto if needed, though gen_random_uuid() is built-in in Postgres 13+
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 2. Table: users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) NOT NULL,
        "passwordHash" VARCHAR(255) NOT NULL,
        "fullName" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(20) NOT NULL,
        "address" TEXT,
        "role" VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      );
    `);
    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email");`);
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users" ("role");`);

    // 3. Table: refresh_sessions
    await queryRunner.query(`
      CREATE TABLE "refresh_sessions" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "tokenHash" VARCHAR(255) NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "isRevoked" BOOLEAN NOT NULL DEFAULT false,
        "userAgent" VARCHAR(255),
        "ipAddress" VARCHAR(50),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_refresh_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_sessions_tokenHash" UNIQUE ("tokenHash"),
        CONSTRAINT "FK_refresh_sessions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "idx_refresh_sessions_user" ON "refresh_sessions" ("userId");`);

    // 4. Table: categories
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL,
        "slug" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "displayOrder" INT NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug")
      );
    `);

    // 5. Table: costumes
    await queryRunner.query(`
      CREATE TABLE "costumes" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "categoryId" UUID NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(255) NOT NULL,
        "characterName" VARCHAR(255),
        "seriesName" VARCHAR(255),
        "description" TEXT NOT NULL,
        "dailyPrice" INT NOT NULL,
        "depositAmount" INT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_costumes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_costumes_slug" UNIQUE ("slug"),
        CONSTRAINT "CHK_costumes_dailyPrice" CHECK ("dailyPrice" >= 0),
        CONSTRAINT "CHK_costumes_depositAmount" CHECK ("depositAmount" >= 0),
        CONSTRAINT "FK_costumes_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT
      );
    `);
    await queryRunner.query(`CREATE INDEX "idx_costumes_category_id" ON "costumes" ("categoryId");`);
    await queryRunner.query(`CREATE INDEX "idx_costumes_daily_price" ON "costumes" ("dailyPrice");`);
    await queryRunner.query(`CREATE INDEX "idx_costumes_is_active" ON "costumes" ("isActive");`);

    // 6. Table: costume_images
    await queryRunner.query(`
      CREATE TABLE "costume_images" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "costumeId" UUID NOT NULL,
        "imageUrl" VARCHAR(500) NOT NULL,
        "altText" VARCHAR(255) NOT NULL DEFAULT 'Hình ảnh trang phục',
        "isPrimary" BOOLEAN NOT NULL DEFAULT false,
        "displayOrder" INT NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_costume_images_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_costume_images_costume" FOREIGN KEY ("costumeId") REFERENCES "costumes"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "idx_costume_images_costume_id" ON "costume_images" ("costumeId");`);

    // 7. Table: costume_variants
    await queryRunner.query(`
      CREATE TABLE "costume_variants" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "costumeId" UUID NOT NULL,
        "size" VARCHAR(50) NOT NULL,
        "sku" VARCHAR(100) NOT NULL,
        "totalQuantity" INT NOT NULL DEFAULT 1,
        "outOfServiceQuantity" INT NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_costume_variants_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_costume_variants_sku" UNIQUE ("sku"),
        CONSTRAINT "CHK_variants_totalQuantity" CHECK ("totalQuantity" >= 0),
        CONSTRAINT "CHK_variants_outOfService" CHECK ("outOfServiceQuantity" >= 0),
        CONSTRAINT "CHK_variants_balance" CHECK ("totalQuantity" >= "outOfServiceQuantity"),
        CONSTRAINT "FK_costume_variants_costume" FOREIGN KEY ("costumeId") REFERENCES "costumes"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "idx_costume_variants_costume_id" ON "costume_variants" ("costumeId");`);

    // 8. Table: rental_orders
    await queryRunner.query(`
      CREATE TABLE "rental_orders" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "orderCode" VARCHAR(50) NOT NULL,
        "userId" UUID NOT NULL,
        "customerName" VARCHAR(255) NOT NULL,
        "customerPhone" VARCHAR(20) NOT NULL,
        "note" TEXT,
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "startDate" DATE NOT NULL,
        "endDate" DATE NOT NULL,
        "rentalDays" INT NOT NULL,
        "totalRentalFee" INT NOT NULL,
        "totalDeposit" INT NOT NULL,
        "actualDepositReturned" INT NOT NULL DEFAULT 0,
        "deliveredAt" TIMESTAMPTZ,
        "returnedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_rental_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_rental_orders_orderCode" UNIQUE ("orderCode"),
        CONSTRAINT "CHK_rental_orders_dates" CHECK ("endDate" >= "startDate"),
        CONSTRAINT "CHK_rental_orders_days" CHECK ("rentalDays" >= 1),
        CONSTRAINT "CHK_rental_orders_fee" CHECK ("totalRentalFee" >= 0),
        CONSTRAINT "CHK_rental_orders_deposit" CHECK ("totalDeposit" >= 0),
        CONSTRAINT "FK_rental_orders_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT
      );
    `);
    await queryRunner.query(`CREATE INDEX "idx_rental_orders_user_id" ON "rental_orders" ("userId");`);
    await queryRunner.query(`CREATE INDEX "idx_rental_orders_status" ON "rental_orders" ("status");`);
    await queryRunner.query(`CREATE INDEX "idx_rental_orders_order_code" ON "rental_orders" ("orderCode");`);
    await queryRunner.query(`CREATE INDEX "idx_rental_orders_dates" ON "rental_orders" ("startDate", "endDate");`);

    // 9. Table: rental_order_items
    await queryRunner.query(`
      CREATE TABLE "rental_order_items" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "rentalOrderId" UUID NOT NULL,
        "costumeVariantId" UUID NOT NULL,
        "costumeNameSnapshot" VARCHAR(255) NOT NULL,
        "sizeSnapshot" VARCHAR(50) NOT NULL,
        "dailyPriceSnapshot" INT NOT NULL,
        "depositSnapshot" INT NOT NULL,
        "quantity" INT NOT NULL DEFAULT 1,
        "lineRentalFee" INT NOT NULL,
        "lineDeposit" INT NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_rental_order_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_rental_order_items_qty" CHECK ("quantity" >= 1),
        CONSTRAINT "FK_rental_order_items_order" FOREIGN KEY ("rentalOrderId") REFERENCES "rental_orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_rental_order_items_variant" FOREIGN KEY ("costumeVariantId") REFERENCES "costume_variants"("id") ON DELETE RESTRICT
      );
    `);
    await queryRunner.query(`CREATE INDEX "idx_order_items_rental_order_id" ON "rental_order_items" ("rentalOrderId");`);
    await queryRunner.query(`CREATE INDEX "idx_order_items_variant_id" ON "rental_order_items" ("costumeVariantId");`);

    // 10. Table: rental_status_histories
    await queryRunner.query(`
      CREATE TABLE "rental_status_histories" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "rentalOrderId" UUID NOT NULL,
        "fromStatus" VARCHAR(20),
        "toStatus" VARCHAR(20) NOT NULL,
        "changedById" UUID NOT NULL,
        "changedByName" VARCHAR(255) NOT NULL,
        "note" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_rental_status_histories_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_status_histories_order" FOREIGN KEY ("rentalOrderId") REFERENCES "rental_orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_status_histories_user" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT
      );
    `);
    await queryRunner.query(`CREATE INDEX "idx_status_histories_order_id" ON "rental_status_histories" ("rentalOrderId");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "rental_status_histories";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rental_order_items";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rental_orders";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "costume_variants";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "costume_images";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "costumes";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_sessions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
  }
}

