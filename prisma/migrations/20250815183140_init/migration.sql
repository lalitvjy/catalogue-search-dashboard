-- CreateTable
CREATE TABLE "public"."Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "qdrantCollection" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleSub" TEXT,
    "brandId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sku" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "skuCode" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SkuAttr" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "attrs" JSONB NOT NULL,

    CONSTRAINT "SkuAttr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SearchLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "queryType" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "topK" INTEGER NOT NULL,
    "tookMs" INTEGER NOT NULL,
    "filters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "public"."Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "brand_sku" ON "public"."Sku"("brandId", "skuCode");

-- CreateIndex
CREATE UNIQUE INDEX "SkuAttr_skuId_key" ON "public"."SkuAttr"("skuId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sku" ADD CONSTRAINT "Sku_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SkuAttr" ADD CONSTRAINT "SkuAttr_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "public"."Sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
