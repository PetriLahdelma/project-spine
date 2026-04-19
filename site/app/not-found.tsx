import Link from "next/link";
import type { Metadata } from "next";
import { HeaderLogo } from "./components/header-logo";

export const metadata: Metadata = {
  title: "404 · Project Spine",
  description: "This page never compiled.",
};

export default function NotFound() {
  return (
    <main className="nf">
      <div className="nf__stars" aria-hidden />

      <Link href="/" className="nf__brand" aria-label="Project Spine home">
        <HeaderLogo />
        <span>Project Spine</span>
      </Link>

      <div className="nf__inner">
        <p className="nf__eyebrow">spine × compile error</p>

        <h1 className="nf__code" aria-label="404">
          4<span className="nf__code-null" aria-hidden>Ø</span>4
        </h1>

        <p className="nf__headline">This page never compiled.</p>
        <p className="nf__sub">
          Spine looked through every commit, every brief, every README — no context
          resolves to this URL. It may have been deleted, renamed, or simply
          hallucinated by a well-meaning agent.
        </p>

        <pre className="nf__term" aria-hidden>
          <span className="nf__term-line"><span className="nf__term-prompt">$</span> spine resolve <span className="nf__term-arg">{`<this page>`}</span></span>
          <span className="nf__term-line nf__term-line--err">✗ missing context · node not in graph</span>
          <span className="nf__term-line nf__term-line--dim">hint: try a link that exists</span>
        </pre>

        <div className="nf__ctas">
          <Link href="/" className="nf__btn nf__btn--primary">
            Back to home
          </Link>
          <Link href="/docs" className="nf__btn nf__btn--secondary">
            Read the docs
          </Link>
        </div>
      </div>

      <p className="nf__foot">
        <span>error code</span>
        <span className="nf__foot-sep">·</span>
        <code>ESPINE_404_NO_CONTEXT</code>
      </p>
    </main>
  );
}
