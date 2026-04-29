-- Modulo Integracao ERP: chassi local-first e tabelas base.

CREATE TABLE "integracao_connector" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "supported_auth_methods" TEXT NOT NULL,
  "supported_entities" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL
);

CREATE TABLE "integracao_profile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "empresa_id" TEXT NOT NULL,
  "unidade_id" TEXT,
  "connector_id" TEXT NOT NULL,
  "environment" TEXT NOT NULL,
  "base_url" TEXT,
  "auth_method" TEXT NOT NULL,
  "secret_ref" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sync_direction" TEXT NOT NULL,
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "integracao_profile_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "integracao_profile_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "integracao_profile_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidade" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "integracao_profile_connector_id_fkey" FOREIGN KEY ("connector_id") REFERENCES "integracao_connector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "integracao_profile_secret" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profile_id" TEXT NOT NULL,
  "secret_key" TEXT NOT NULL,
  "encrypted_value" TEXT NOT NULL,
  "encryption_version" INTEGER NOT NULL DEFAULT 1,
  "rotated_at" DATETIME,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "integracao_profile_secret_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "integracao_profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "integracao_mapping" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profile_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "local_field" TEXT NOT NULL,
  "remote_field" TEXT NOT NULL,
  "transformation_type" TEXT NOT NULL,
  "transformation_expression" TEXT,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "default_value" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "integracao_mapping_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "integracao_profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "integracao_equivalence_table" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profile_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "integracao_equivalence_table_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "integracao_profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "integracao_equivalence_item" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "table_id" TEXT NOT NULL,
  "local_value" TEXT NOT NULL,
  "remote_value" TEXT NOT NULL,
  "metadata" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "integracao_equivalence_item_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "integracao_equivalence_table" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "integracao_external_link" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profile_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "local_id" TEXT NOT NULL,
  "external_id" TEXT NOT NULL,
  "external_code" TEXT,
  "external_version" TEXT,
  "last_synced_at" DATETIME,
  "checksum" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "integracao_external_link_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "integracao_profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "integracao_outbox" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profile_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "payload_canonical" TEXT NOT NULL,
  "payload_remote" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "next_retry_at" DATETIME,
  "last_error" TEXT,
  "last_error_category" TEXT,
  "correlation_id" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" DATETIME,
  CONSTRAINT "integracao_outbox_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "integracao_profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "integracao_inbox" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profile_id" TEXT NOT NULL,
  "source_event_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "external_id" TEXT NOT NULL,
  "payload_remote" TEXT NOT NULL,
  "payload_canonical" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "idempotency_key" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" DATETIME,
  CONSTRAINT "integracao_inbox_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "integracao_profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "integracao_checkpoint" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profile_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "last_token" TEXT,
  "last_date" DATETIME,
  "last_page" INTEGER,
  "last_sequence" BIGINT,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "integracao_checkpoint_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "integracao_profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "integracao_log" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profile_id" TEXT,
  "direction" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "correlation_id" TEXT NOT NULL,
  "request_payload_masked" TEXT,
  "response_payload_masked" TEXT,
  "http_status" INTEGER,
  "duration_ms" INTEGER,
  "error_code" TEXT,
  "error_message" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "integracao_log_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "integracao_profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "integracao_reconciliation_run" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profile_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'running',
  "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" DATETIME,
  "summary" TEXT,
  "triggered_by" TEXT,
  CONSTRAINT "integracao_reconciliation_run_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "integracao_profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "integracao_reconciliation_item" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "run_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "local_id" TEXT,
  "external_id" TEXT,
  "issue_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "details" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "integracao_reconciliation_item_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "integracao_reconciliation_run" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "integracao_connector_code_version_unique" ON "integracao_connector"("code", "version");
CREATE INDEX "integracao_profile_tenant_id_idx" ON "integracao_profile"("tenant_id");
CREATE INDEX "integracao_profile_empresa_id_idx" ON "integracao_profile"("empresa_id");
CREATE INDEX "integracao_profile_unidade_id_idx" ON "integracao_profile"("unidade_id");
CREATE INDEX "integracao_profile_connector_id_idx" ON "integracao_profile"("connector_id");
CREATE UNIQUE INDEX "integracao_secret_profile_key_unique" ON "integracao_profile_secret"("profile_id", "secret_key");
CREATE INDEX "integracao_mapping_profile_id_entity_type_idx" ON "integracao_mapping"("profile_id", "entity_type");
CREATE UNIQUE INDEX "integracao_equivalence_table_unique" ON "integracao_equivalence_table"("profile_id", "entity_type", "name");
CREATE UNIQUE INDEX "integracao_equivalence_item_local_unique" ON "integracao_equivalence_item"("table_id", "local_value");
CREATE UNIQUE INDEX "integracao_external_link_local_unique" ON "integracao_external_link"("profile_id", "entity_type", "local_id");
CREATE UNIQUE INDEX "integracao_external_link_remote_unique" ON "integracao_external_link"("profile_id", "entity_type", "external_id");
CREATE UNIQUE INDEX "integracao_outbox_idempotency_key_key" ON "integracao_outbox"("idempotency_key");
CREATE INDEX "integracao_outbox_profile_id_status_next_retry_at_idx" ON "integracao_outbox"("profile_id", "status", "next_retry_at");
CREATE INDEX "integracao_outbox_correlation_id_idx" ON "integracao_outbox"("correlation_id");
CREATE UNIQUE INDEX "integracao_inbox_idempotency_key_key" ON "integracao_inbox"("idempotency_key");
CREATE INDEX "integracao_inbox_profile_id_status_idx" ON "integracao_inbox"("profile_id", "status");
CREATE UNIQUE INDEX "integracao_checkpoint_profile_entity_unique" ON "integracao_checkpoint"("profile_id", "entity_type");
CREATE INDEX "integracao_log_profile_id_created_at_idx" ON "integracao_log"("profile_id", "created_at");
CREATE INDEX "integracao_log_correlation_id_idx" ON "integracao_log"("correlation_id");
CREATE INDEX "integracao_reconciliation_run_profile_id_started_at_idx" ON "integracao_reconciliation_run"("profile_id", "started_at");
CREATE INDEX "integracao_reconciliation_item_run_id_status_idx" ON "integracao_reconciliation_item"("run_id", "status");
