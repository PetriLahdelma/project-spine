"use client";

import { useState, useTransition } from "react";
import { updateWorkspaceAction } from "./actions";

type Props = {
  slug: string;
  initial: {
    name: string;
    description: string | null;
    brandColor: string | null;
    logoUrl: string | null;
  };
};

const ERROR_MESSAGES: Record<string, string> = {
  not_signed_in: "You need to sign in again.",
  not_found: "Workspace not found.",
  forbidden: "Only the workspace owner can change these settings.",
  name_required: "Name is required.",
  name_too_short: "Name must be at least 2 characters.",
  name_too_long: "Name must be 80 characters or fewer.",
  description_too_long: "Description must be 400 characters or fewer.",
  description_invalid: "Description must be text.",
  brand_color_invalid: "Brand color must be a 6-digit hex like #ff4fb4.",
  logo_url_invalid: "Logo URL must be a valid URL.",
  logo_url_must_be_https: "Logo URL must use https://.",
  logo_url_too_long: "Logo URL is too long.",
};

export function SettingsForm({ slug, initial }: Props) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [brandColor, setBrandColor] = useState(initial.brandColor ?? "");
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const preview = /^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : "#ff4fb4";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("idle");
    setErrorKey(null);
    startTransition(async () => {
      const res = await updateWorkspaceAction(slug, {
        name,
        description: description.trim() || null,
        brandColor: brandColor.trim() || null,
        logoUrl: logoUrl.trim() || null,
      });
      if ("ok" in res) {
        setStatus("saved");
      } else {
        setStatus("error");
        setErrorKey(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Field label="Name" hint="Shown at the top of the workspace page and on rationale URLs.">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={80}
          style={inputStyle}
        />
      </Field>

      <Field label="Description" hint="Optional. One-liner shown under the workspace name.">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={400}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" as const, minHeight: 72 }}
        />
      </Field>

      <Field
        label="Brand color"
        hint="6-digit hex. Used as the accent on workspace + rationale pages."
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            type="text"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            placeholder="#ff4fb4"
            pattern="^#[0-9a-fA-F]{6}$"
            style={{ ...inputStyle, flex: 1, fontFamily: "ui-monospace, monospace" }}
          />
          <span
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: preview,
              border: "1px solid var(--line)",
            }}
          />
        </div>
      </Field>

      <Field
        label="Logo URL"
        hint="Optional. Must be https://. File upload arrives in a later release; paste a hosted URL for now."
      >
        <input
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://…"
          maxLength={500}
          style={inputStyle}
        />
      </Field>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            background: preview,
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "saving…" : "save changes"}
        </button>

        {status === "saved" ? (
          <span style={{ fontSize: 13, color: "#16a34a" }}>saved</span>
        ) : null}

        {status === "error" && errorKey ? (
          <span style={{ fontSize: 13, color: "#b91c1c" }}>
            {ERROR_MESSAGES[errorKey] ?? `error: ${errorKey}`}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      {children}
      {hint ? (
        <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{hint}</span>
      ) : null}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  fontFamily: "inherit",
  background: "#fff",
};
