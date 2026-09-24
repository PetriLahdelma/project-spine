import Link from "next/link";
import { HeaderLogo } from "./header-logo";

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-labelledby="site-footer-heading">
      <h2 id="site-footer-heading" className="visually-hidden">Site navigation</h2>
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link href="/" className="site-footer__brand-lockup" aria-label="Project Spine home">
            <HeaderLogo />
            <strong>Project Spine</strong>
          </Link>
          <span>
            Keep reviewed fixes as verified repository guardrails for every
            coding agent.
          </span>
        </div>

        <div className="site-footer__col">
          <h3>Product</h3>
          <ul>
            <li><Link href="/product">Overview</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/changelog" data-ps-event="changelog_click" data-ps-label="footer product">Changelog</Link></li>
            <li><Link href="/security">Security</Link></li>
            <li><Link href="/docs" data-ps-event="docs_click" data-ps-label="footer product">Documentation</Link></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h3>Resources</h3>
          <ul>
            <li><a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/learning.md">Learning guide</a></li>
            <li><a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/evaluation.md">Evaluation guide</a></li>
            <li><a href="https://github.com/PetriLahdelma/project-spine#readme">Source quickstart</a></li>
            <li><a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/mcp.md">MCP setup</a></li>
            <li><a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/drift.md">Compile + drift</a></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h3>Company</h3>
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><a href="mailto:support@projectspine.dev">Contact</a></li>
            <li><a href="https://github.com/PetriLahdelma/project-spine" data-ps-event="github_click" data-ps-label="footer company">GitHub</a></li>
            <li><a href="https://www.npmjs.com/package/project-spine" data-ps-event="npm_click" data-ps-label="footer company">Current npm beta</a></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h3>Legal</h3>
          <ul>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><a href="https://github.com/PetriLahdelma/project-spine/blob/main/LICENSE">MIT License</a></li>
            <li><a href="https://github.com/PetriLahdelma/project-spine/blob/main/SECURITY.md">SECURITY.md</a></li>
          </ul>
        </div>
      </div>

      <div className="site-footer__legal">
        <span>© {new Date().getFullYear()} Petri Lahdelma · Project Spine</span>
        <span>Built in the open. Google Analytics measurement is disclosed in Privacy.</span>
      </div>
    </footer>
  );
}
