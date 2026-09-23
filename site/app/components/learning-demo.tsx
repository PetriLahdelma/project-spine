"use client";

import { useState } from "react";

const stages = [
  {
    id: "evidence",
    label: "01 · Evidence",
    command: "spine learn --case failure.json",
    status: "case tenant-query imported",
    lines: [
      ["source", "manual review evidence"],
      ["failure", "invoice query omitted its tenant filter"],
      ["scope", "src/invoices.js"],
    ],
  },
  {
    id: "rule",
    label: "02 · Guardrail",
    command: "spine learn --case failure.json",
    status: "candidate rule recorded",
    lines: [
      ["kind", "require-text"],
      ["literal", "WHERE tenant_id = ?"],
      ["files", "src/invoices.js"],
    ],
  },
  {
    id: "replay",
    label: "03 · Replay",
    command: "spine replay tenant-query",
    status: "historical replay verified",
    lines: [
      ["broken", "demo commit · required literal missing"],
      ["corrected", "demo commit · required literal present"],
      ["mode", "read-only Git objects; no agent rerun"],
    ],
  },
  {
    id: "enforce",
    label: "04 · Enforce",
    command: "spine guard --diff HEAD~1",
    status: "0 violations · 1 verified rule checked",
    lines: [
      ["rule", "tenant-filter"],
      ["result", "pass"],
      ["context", "available to every agent through MCP"],
    ],
  },
] as const;

export function LearningDemo() {
  const [active, setActive] = useState(0);

  function focusTab(index: number) {
    const item = stages[index];
    if (!item) return;
    setActive(index);
    document.getElementById(`learning-tab-${item.id}`)?.focus();
  }

  return (
    <div className="learning-demo" aria-label="Illustrative Project Spine workflow preview">
      <div className="learning-demo__topline">
        <span>Illustrative preview</span>
        <span>v0.10 beta workflow</span>
      </div>
      <div className="learning-demo__tabs" role="tablist" aria-label="Learning workflow stages">
        {stages.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`learning-tab-${item.id}`}
            aria-controls={`learning-panel-${item.id}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              if (event.key === "Home") return focusTab(0);
              if (event.key === "End") return focusTab(stages.length - 1);
              const direction = event.key === "ArrowRight" ? 1 : -1;
              focusTab((index + direction + stages.length) % stages.length);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {stages.map((stage, index) => (
        <div
          key={stage.id}
          className="learning-demo__panel"
          role="tabpanel"
          id={`learning-panel-${stage.id}`}
          aria-labelledby={`learning-tab-${stage.id}`}
          hidden={active !== index}
          tabIndex={0}
        >
          <p className="learning-demo__command"><span>$</span> {stage.command}</p>
          <p className="learning-demo__status"><span>✓</span> {stage.status}</p>
          <dl>
            {stage.lines.map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      <p className="learning-demo__note">
        The preview uses a seeded example. Spine stores local evidence and checks literal rules; it does not claim to infer every architectural mistake.
      </p>
    </div>
  );
}
