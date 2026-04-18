import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <strong>Project Spine</strong>
          <span>
            Context compiler for software projects. Deterministic, drift-aware,
            portable across coding agents.
          </span>
        </div>

        <div className="site-footer__col">
          <h4>Product</h4>
          <ul>
            <li><Link href="/product">Overview</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/changelog">Changelog</Link></li>
            <li><Link href="/security">Security</Link></li>
            <li><Link href="/docs">Documentation</Link></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h4>Resources</h4>
          <ul>
            <li><a href="https://github.com/PetriLahdelma/project-spine/blob/main/PRD.md">PRD</a></li>
            <li><a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/positioning.md">Positioning</a></li>
            <li><a href="https://github.com/PetriLahdelma/project-spine/tree/main/docs/sample-output">Sample output</a></li>
            <li><a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/research-citations.md">Research</a></li>
            <li><a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/field-notes.md">Field notes</a></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h4>Company</h4>
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><a href="mailto:support@projectspine.dev">Contact</a></li>
            <li><a href="https://github.com/PetriLahdelma/project-spine">GitHub</a></li>
            <li><a href="https://www.npmjs.com/package/project-spine">npm</a></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h4>Legal</h4>
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
        <span>Built in the open. No tracking on this site.</span>
      </div>
    </footer>
  );
}
