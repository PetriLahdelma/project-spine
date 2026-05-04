import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getWebSessionUser } from "@/lib/web-auth";
import { SiteHeader } from "../../components/site-header";
import { SiteFooter } from "../../components/site-footer";
import { CreateWorkspaceForm } from "./create-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create a workspace · Project Spine",
  robots: { index: false, follow: false },
};

export default async function NewWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await getWebSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/workspaces/new")}`);
  const sp = await searchParams;
  const isWelcome = sp.welcome === "1";

  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px 96px" }}>
        <header style={{ marginBottom: 40 }}>
          <p
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12,
              letterSpacing: "0.06em",
              color: "var(--ink-muted)",
              margin: "0 0 10px",
            }}
          >
            {isWelcome ? `signed in as ${user.githubLogin}` : "new workspace"}
          </p>
          <h1
            style={{
              fontSize: 32,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              fontWeight: 600,
              margin: "0 0 12px",
            }}
          >
            {isWelcome ? "Welcome. Let\u2019s set up your workspace." : "Create a workspace"}
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 16, lineHeight: 1.55, margin: 0, maxWidth: 560 }}>
            Hosted workspaces are an experimental surface and are not part of
            the public OSS CLI launch path. For now, teams should share
            project-local templates in git and keep drift reports as CI
            artifacts.
          </p>
        </header>

        <CreateWorkspaceForm />

        <section style={{ marginTop: 56, paddingTop: 32, borderTop: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-muted)", margin: "0 0 16px", fontWeight: 600 }}>
            What happens next
          </h2>
          <ol style={{ margin: 0, paddingLeft: 20, color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.65 }}>
            <li>You land on your workspace dashboard as the owner.</li>
            <li>
              You install the CLI (<code>npm install -g project-spine@next</code>) and
              use the local <code>init</code>, <code>compile</code>, template, and drift commands.
            </li>
            <li>
              Run <code>spine template save --location project --name ...</code> to
              commit a shared template with the repo, or invite teammates to review
              the generated outputs in git.
            </li>
            <li>
              Share <code>.project-spine/exports/rationale.md</code> with clients
              and upload <code>.project-spine/drift-report.md</code> from CI when
              reviewer visibility is needed.
            </li>
          </ol>
          <p style={{ marginTop: 20, fontSize: 14, color: "var(--ink-muted)" }}>
            Already have a workspace created via the CLI? <Link href="/">Back to home</Link>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
