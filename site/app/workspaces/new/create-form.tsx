"use client";

import { useState, useTransition } from "react";
import { createWorkspaceAndRedirect } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  not_signed_in: "Your session expired. Sign in again.",
  name_required: "Give your workspace a name.",
  name_too_long: "Name must be 120 characters or fewer.",
  slug_too_short: "URL slug must be at least 2 characters.",
  slug_must_be_kebab: "URL slug must be lowercase letters, digits, and hyphens.",
  slug_taken: "That slug is already taken. Try another.",
  description_too_long: "Description must be 280 characters or fewer.",
  brand_color_invalid: "Brand colour must be a 6-digit hex like #ff4fb4.",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function CreateWorkspaceForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }
  function onSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(slugify(value));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createWorkspaceAndRedirect({
        name,
        slug,
        description: description.trim() || undefined,
        brandColor: brandColor.trim() || undefined,
      });
      if (res && "error" in res) setError(res.error);
    });
  }

  const preview = /^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : "#11151a";

  return (
    <form onSubmit={onSubmit} className="ws-form">
      <label className="ws-field">
        <span>Workspace name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="My Agency"
          required
          minLength={1}
          maxLength={120}
          autoFocus
        />
        <small>Shown at the top of the workspace page and on public rationale URLs.</small>
      </label>

      <label className="ws-field">
        <span>URL slug</span>
        <div className="ws-field__prefix">
          <span className="ws-field__prefix-text">projectspine.dev/w/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="my-agency"
            required
            minLength={2}
            maxLength={48}
            pattern="^[a-z][a-z0-9-]{1,47}$"
          />
        </div>
        <small>Lowercase letters, digits, and hyphens. Used in CLI commands too.</small>
      </label>

      <label className="ws-field">
        <span>Description <em>(optional)</em></span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={280}
          rows={2}
          placeholder="Shared templates and rationales for our client projects."
        />
      </label>

      <label className="ws-field">
        <span>Brand colour <em>(optional)</em></span>
        <div className="ws-field__color">
          <input
            type="text"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            placeholder="#ff4fb4"
            pattern="^#[0-9a-fA-F]{6}$"
            maxLength={7}
          />
          <span
            aria-hidden="true"
            className="ws-field__swatch"
            style={{ background: preview }}
          />
        </div>
        <small>6-digit hex. Used as the accent on your workspace and rationale pages.</small>
      </label>

      <div className="ws-form__actions">
        <button type="submit" className="btn-primary" disabled={pending || !name || !slug}>
          {pending ? "Creating…" : "Create workspace"}
        </button>
        {error ? (
          <span className="ws-form__error">{ERROR_MESSAGES[error] ?? `error: ${error}`}</span>
        ) : null}
      </div>
    </form>
  );
}
