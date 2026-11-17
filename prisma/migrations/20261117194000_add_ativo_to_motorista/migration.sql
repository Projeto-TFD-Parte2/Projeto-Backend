-- AlterTable
ALTER TABLE "veiculos" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "motoristas" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "cidades" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "pessoas" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "viagens" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;
