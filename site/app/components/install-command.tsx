"use client";

import { useState } from "react";

const COMMAND = "npx --yes --package=https://github.com/PetriLahdelma/project-spine/releases/download/v0.10.0-beta.3/project-spine-0.10.0-beta.3.tgz spine demo";

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
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(COMMAND);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1400);
    } catch {
      setCopyState("error");
    }
  }
  return (
    <div className="install-block" role="group" aria-label="Run the verified GitHub beta artifact demo">
      <div className="install-block__rail">
        <span className="install-block__dot install-block__dot--r" aria-hidden="true" />
        <span className="install-block__dot install-block__dot--y" aria-hidden="true" />
        <span className="install-block__dot install-block__dot--g" aria-hidden="true" />
        <span className="install-block__caption">run the verified GitHub beta artifact</span>
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
          aria-label={copyState === "copied" ? "Copied" : "Copy verified GitHub beta demo command"}
          data-ps-event="install_copy"
          data-ps-label="install block"
        >
          {copyState === "copied" ? <CheckIcon /> : <CopyIcon />}
          <span>{copyState === "copied" ? "Copied" : copyState === "error" ? "Select command" : "Copy"}</span>
        </button>
      </div>
      <p className="install-block__feedback" role="status" aria-live="polite">
        {copyState === "error" ? "Clipboard access failed. Select and copy the command manually." : ""}
      </p>
    </div>
  );
}
