-- F-029: jti do JWT da licenca para suportar revogacao via CRL offline.
ALTER TABLE "licenca_instalacao" ADD COLUMN "chave_jti" TEXT;
