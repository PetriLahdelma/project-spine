import { z } from "zod";

export const FileFingerprint = z.object({
  path: z.string(),
  sha256: z.string(),
  bytes: z.number().int().nonnegative(),
});
export type FileFingerprint = z.infer<typeof FileFingerprint>;

export const InputFingerprint = z.object({
  briefPath: z.string(),
  briefSha256: z.string(),
  designPath: z.string().nullable(),
  designSha256: z.string().nullable(),
  templateName: z.string().nullable(),
  templateSha256: z.string().nullable(),
  repoProfileSha256: z.string(),
});
export type InputFingerprint = z.infer<typeof InputFingerprint>;

export const ExportManifest = z.object({
  schemaVersion: z.literal(1),
  compiledAt: z.string(),
  spineHash: z.string(),
  inputs: InputFingerprint,
  exports: z.array(FileFingerprint),
});
export type ExportManifest = z.infer<typeof ExportManifest>;
