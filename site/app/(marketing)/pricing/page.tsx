import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing · Project Spine",
  description: "Free CLI. Free hosted workspace during alpha. Clear pricing honestly.",
};

export default function PricingPage() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Pricing</p>
        <h1>Free while we&apos;re figuring it out.</h1>
        <p className="lede">
          Project Spine is pre-alpha. The CLI is and will remain free and open
          source under MIT. The hosted workspace is free during alpha. We&apos;ll
          tell you before that changes, and any paid tier will only
          exist for features that cost us money to run (hosted sync, fleet
          drift telemetry, rationale branding).
        </p>
      </header>

      <div className="pricing-grid">
        <div className="pricing-card">
          <h3>CLI</h3>
          <p className="price">
            $0<small>/forever</small>
          </p>
          <p style={{ color: "var(--ink-muted)", margin: 0 }}>
            Open source, MIT. Runs offline. No account required.
          </p>
          <ul>
            <li>
              Compile brief + repo → <code>spine.json</code> + 18 exports
            </li>
            <li>
              Drift check with CI-friendly <code>--fail-on</code>
            </li>
            <li>Four bundled templates + save your own locally</li>
            <li>
              <code>AGENTS.md</code> / <code>CLAUDE.md</code> /{" "}
              <code>copilot-instructions.md</code>
            </li>
            <li>Design tokens import (DTCG / Tokens Studio)</li>
          </ul>
        </div>

        <div className="pricing-card pricing-card--featured">
          <h3>Hosted workspace</h3>
          <p className="price">
            $0<small>/during alpha</small>
          </p>
          <p style={{ color: "var(--ink-muted)", margin: 0 }}>
            For teams. GitHub OAuth, bearer tokens hashed, rate limited.
          </p>
          <ul>
            <li>Shared templates across client projects</li>
            <li>
              Branded rationale URLs at <code>/r/&lt;slug&gt;</code>
            </li>
            <li>Drift push from CI into a fleet view</li>
            <li>Invites, owner/admin/member roles</li>
            <li>Brand colour, logo URL, workspace settings</li>
          </ul>
        </div>

        <div className="pricing-card">
          <h3>Beyond alpha</h3>
          <p className="price">
            TBD<small>/transparently announced</small>
          </p>
          <p style={{ color: "var(--ink-muted)", margin: 0 }}>
            When the workspace leaves alpha, pricing will go here. Our
            commitments:
          </p>
          <ul>
            <li>CLI stays free forever</li>
            <li>Existing workspaces get 90 days&apos; notice before any change</li>
            <li>A permanently free tier for solo users</li>
            <li>No surprise billing. No trial-credit games.</li>
          </ul>
        </div>
      </div>

      <h2>What we won&apos;t do</h2>
      <ul className="features">
        <li>
          <strong>No telemetry on the CLI.</strong>
          <span>
            <code>spine compile</code> and <code>spine drift check</code> make
            zero network calls. You can verify by reading{" "}
            <code>src/compiler/compile.ts</code>.
          </span>
        </li>
        <li>
          <strong>No data sold.</strong>
          <span>
            Ever. If that ever changes we&apos;ll tell you in advance and give
            you an opt-out migration path.
          </span>
        </li>
        <li>
          <strong>No feature gating of the open-source CLI.</strong>
          <span>
            Compile, drift, templates, exports, tokens: all free. Paid tiers
            only touch shared infrastructure, never the core pipeline.
          </span>
        </li>
      </ul>

      <div className="cta-row">
        <a href="https://www.npmjs.com/package/project-spine">Install free →</a>
        <Link href="/product">Product tour →</Link>
        <a href="mailto:support@projectspine.dev">Questions? Email →</a>
      </div>
    </main>
  );
}
