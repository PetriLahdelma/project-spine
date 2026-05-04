"use client";

import { useState } from "react";

const COMMAND = "npm install -g project-spine@beta";

function CopyIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5l3.5 3L13 4.5" />
    </svg>
  );
}

export function InstallCommand() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard denied — no-op; users can still select the text manually.
    }
  }
  return (
    <div className="install-block" role="group" aria-label="Install the CLI">
      <div className="install-block__rail">
        <span className="install-block__dot install-block__dot--r" aria-hidden="true" />
        <span className="install-block__dot install-block__dot--y" aria-hidden="true" />
        <span className="install-block__dot install-block__dot--g" aria-hidden="true" />
        <span className="install-block__caption">install the CLI</span>
      </div>
      <div className="install-block__row">
        <code className="install-block__command" tabIndex={0}>
          <span className="install-block__prompt">$ </span>
          {COMMAND}
        </code>
        <button
          type="button"
          onClick={copy}
          className="install-block__copy"
          aria-label={copied ? "Copied" : "Copy install command"}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
    </div>
  );
}
