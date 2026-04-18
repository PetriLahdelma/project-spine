import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Enums mirror the canonical CLI model in src/model/spine.ts.
 * Keep them in sync — the workspace templates API validates
 * `projectType` against this set before writing.
 */
export const projectTypeEnum = pgEnum("project_type", [
  "saas-marketing",
  "app-dashboard",
  "design-system",
  "docs-portal",
  "extension",
  "other",
]);

export const membershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "admin",
  "member",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  githubId: bigint("github_id", { mode: "number" }).notNull().unique(),
  githubLogin: text("github_login").notNull(),
  email: text("email"),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  brandColor: text("brand_color"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })],
);

export const templates = pgTable(
  "templates",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /** lowercase-kebab, matches the bundled TemplateManifest.name regex */
    name: text("name").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    projectType: projectTypeEnum("project_type").notNull(),
    /** TemplateManifest.contributes block as JSON */
    manifestJson: jsonb("manifest_json").notNull(),
    briefMd: text("brief_md").notNull(),
    designRulesMd: text("design_rules_md"),
    /** sha256 of (manifest + brief + design) for sync comparisons */
    contentHash: text("content_hash").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("templates_workspace_name_idx").on(t.workspaceId, t.name)],
);

/**
 * Short-lived device-flow state. CLI calls POST /api/auth/device to create
 * a pair (device_code, user_code), user enters user_code at /device, the
 * code binds to their user_id, and the CLI polls /api/auth/device/poll
 * with the device_code to collect a bearer token.
 */
export const deviceCodes = pgTable("device_codes", {
  deviceCode: text("device_code").primaryKey(),
  userCode: text("user_code").notNull().unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Long-lived bearer tokens the CLI stores at ~/.project-spine/auth.json.
 * We store only the sha256 of the token; plaintext never hits the DB.
 */
export const authTokens = pgTable("auth_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  scopes: text("scopes").array().notNull().default(sql`'{}'::text[]`),
  label: text("label"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Client-facing rationale documents published from a workspace to a
 * public URL. The CLI's `spine publish rationale` uploads a compiled
 * rationale.md; the `/r/:slug` page renders it with workspace branding.
 * `publicSlug` is unguessable and the canonical public identifier.
 */
export const rationales = pgTable(
  "rationales",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    publicSlug: text("public_slug").notNull().unique(),
    projectName: text("project_name").notNull(),
    title: text("title").notNull(),
    spineHash: text("spine_hash").notNull(),
    contentMd: text("content_md").notNull(),
    /** sha256 of content_md + metadata for idempotent re-publish */
    contentHash: text("content_hash").notNull(),
    publishedBy: text("published_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("rationales_workspace_project_idx").on(t.workspaceId, t.projectName)],
);

/**
 * A project tracked inside a workspace. Populated the first time a member
 * pushes a drift report for a given projectSlug; identity key is
 * (workspaceId, slug). `lastSpineHash` is the most recent hash observed.
 */
export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    lastSpineHash: text("last_spine_hash"),
    lastDriftAt: timestamp("last_drift_at", { withTimezone: true }),
    lastClean: text("last_clean"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("projects_workspace_slug_idx").on(t.workspaceId, t.slug)],
);

/**
 * Time-series drift readings for a project. Each one is a compact snapshot
 * of the CLI's `spine drift check` output. Enough to rebuild the timeline
 * page without storing the full report text every time.
 */
export const driftSnapshots = pgTable("drift_snapshots", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  storedSpineHash: text("stored_spine_hash"),
  currentSpineHash: text("current_spine_hash"),
  clean: boolean("clean").notNull(),
  totalItems: bigint("total_items", { mode: "number" }).notNull().default(0),
  inputDriftCount: bigint("input_drift_count", { mode: "number" }).notNull().default(0),
  exportHandEditCount: bigint("export_hand_edit_count", { mode: "number" }).notNull().default(0),
  missingExportCount: bigint("missing_export_count", { mode: "number" }).notNull().default(0),
  items: jsonb("items").notNull().default(sql`'[]'::jsonb`),
  pushedBy: text("pushed_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Long-lived browser session for the web UI. Separate from the CLI's
 * bearer tokens — web sessions use cookies and have their own TTL.
 */
export const webSessions = pgTable("web_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  userAgent: text("user_agent"),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Short-lived invite code for a workspace. Owner/admin creates one, shares
 * the URL, recipient signs in and accepts — becomes a member with the
 * requested role. Single-use by default; expires in 7 days.
 */
export const workspaceInvites = pgTable(
  "workspace_invites",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    code: text("code").notNull().unique(),
    role: membershipRoleEnum("role").notNull().default("member"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedBy: text("accepted_by").references(() => users.id, { onDelete: "set null" }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("workspace_invites_workspace_idx").on(t.workspaceId, t.code)],
);

/**
 * Fixed-window rate limit counters. One row per (key, windowStart) tuple.
 * Keys are caller-defined strings like "auth:device:1.2.3.4" or "auth:poll:<device_code>".
 * Rows older than their window get GC'd opportunistically on write.
 */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type Membership = typeof memberships.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type DeviceCode = typeof deviceCodes.$inferSelect;
export type AuthToken = typeof authTokens.$inferSelect;
export type Rationale = typeof rationales.$inferSelect;
export type NewRationale = typeof rationales.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type DriftSnapshot = typeof driftSnapshots.$inferSelect;
export type NewDriftSnapshot = typeof driftSnapshots.$inferInsert;
export type WebSession = typeof webSessions.$inferSelect;
export type WorkspaceInvite = typeof workspaceInvites.$inferSelect;
export type RateLimit = typeof rateLimits.$inferSelect;
