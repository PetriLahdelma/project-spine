# Product Hunt launch kit

Working doc for the Project Spine launch on Product Hunt. Not canonical — pick from the options, strike the rest.

## 1. Tagline

PH caps the tagline at 60 characters. Shorter reads faster on the feed. Current site tagline ("the missing context layer for software delivery") is 48 chars and works, but it describes what Spine *is*, not what it *does*. For PH, saying what it does converts better.

**Candidates (character count in parens):**

1. `Compile briefs, repos, and design into AI-agent context` (56)
2. `The context compiler for AI-assisted software projects` (54)
3. `Make any repo AI-agent native in one command` (45)
4. `Stop re-briefing AI agents. Compile your context once.` (54)
5. `The missing context layer for software delivery` (48) — current site
6. `From brief to AGENTS.md to sprint-1 — in one compile` (53)

**Recommendation:** #4 or #1. #4 reads as a verb the audience recognises (the re-briefing pain is real). #1 is boring but accurate and uses the category word "compile" that makes the shape obvious.

**Decision (2026-04-23):** **#5, "The missing context layer for software delivery."** Matches the site tagline; same voice across surfaces beats marginal optimisation on PH alone.

## 2. Maker first comment

Posted within ~15 min of launch. Goals: honest framing, invite replies, surface the two things that aren't obvious from the preview (drift detection + repo-native).

### Draft A — short, inviting

> Hi PH — Petri here, solo maintainer.
>
> I built Spine because every agency kickoff I've run ended the same way: the brief said one thing, the design said another, the repo said a third, and the coding agent saw whichever slice fit in its context. Spine is a CLI that compiles those inputs into a single machine-readable layer your repo and your agents both read — AGENTS.md, CLAUDE.md, copilot-instructions, a scaffold plan, QA guardrails, a sprint-1 backlog. Plus `spine drift check`, which is the part I use most: it tells me when the compiled output has diverged from reality so I don't ship agent instructions that lie.
>
> It's OSS, MIT, `npm i -g project-spine`. No signup, no hosted tier, no telemetry. Happy to answer anything — what you'd hate, what you'd want next, which template we should ship after the six that are in there today.

Length: ~155 words. Feels right.

### Draft B — opinionated, polarising

> Most "AGENTS.md generators" produce the same boilerplate for every repo. That's the thing Addy Osmani warned about in March, and it's the thing I wanted to avoid.
>
> Spine reads your actual brief, your actual `package.json`, your actual design tokens if you have them, and compiles a repo-specific operating layer — with drift detection so the output doesn't silently rot. No signup. No hosted tier. One CLI, six templates, 19 generated files per compile.
>
> This is v0.9.x. It runs end-to-end, 121 tests green, dogfooded on its own repo. I'd rather hear "here's what I'd change" than "nice launch" — so fire away.

Length: ~110 words. Sharper, might split the room.

**Recommendation:** A. B is more distinctive but risks a "too cool for PH" read on a platform where warmth converts.

**Decision (2026-04-23):** **Draft A.** Post within 15 min of launch. Don't edit it once it's up — threaded replies are where the work happens.

## 3. Gallery — 5 slots

PH allows 5 images in the gallery (plus one optional video). Image spec: 1270×760, PNG/JPG. First image is the hero and shows in the feed preview — it carries the most weight.

### Shipped — 6 assets for 5 slots

All 1270×760. Terminal slots captured in real Ghostty (not simulated) via `screencapture -l <windowId>`; hero and changelog via headless Chromium on the live production site. Pick the 5 strongest for the PH upload.

| File | What it shows | Size | Source |
|---|---|---|---|
| [`hero.png`](gallery/hero.png) | Site hero: wordmark + "The context layer your coding agents are missing." | 108 KB | Headless Chromium on `projectspine.dev` |
| [`demo.gif`](gallery/demo.gif) | 60-s CLI demo: init → compile → drift check → drift diff | 1.1 MB, 1100×700 | `docs/demo/demo.tape` (VHS) |
| [`drift-diff.png`](gallery/drift-diff.png) | `spine drift diff` showing the `+# hand edit` that slipped in | 60 KB | Ghostty, `capture-drift-diff.sh` |
| [`tree.png`](gallery/tree.png) | The 3 tool-discovery files + 11 compiled exports (the "19 files per compile" proof) | 128 KB | Ghostty, `capture-tree.sh` |
| [`templates.png`](gallery/templates.png) | `spine template list` — all 6 bundled templates with descriptions | 136 KB | Ghostty, `capture-templates.sh` |
| [`changelog.png`](gallery/changelog.png) | `/changelog` page: "What shipped, when, and what changed" with the 0.9.x-beta aside | 112 KB | Headless Chromium |
| [`claude.png`](gallery/claude.png) | **The money shot.** `claude -p "Read AGENTS.md and summarise…"` answering with a 3-bullet summary pulled from the Spine-generated AGENTS.md. Closes the loop: brief → compile → AGENTS.md → real Claude consumes it. | 128 KB | Ghostty + claude CLI, `capture-claude.sh` |

**Recommended 5-slot order for the PH upload:**

1. `hero.png` — brand, sets the feed preview
2. `claude.png` — the downstream proof, answers "what do I actually get"
3. `drift-diff.png` — shows the distinctive capability (determinism + drift detection)
4. `tree.png` — concrete output, 19 files
5. `demo.gif` — the motion asset

`templates.png` and `changelog.png` are held back as swap options if you want to replace any of the above.

### Regenerating

Every capture script lives alongside its output in `gallery/`. `spine` must be on PATH (`npm i -g project-spine@beta`). Scripts assume Ghostty is your terminal — they print into whichever window is frontmost when run from your shell. For terminal slots:

```bash
bash docs/launch/gallery/capture-drift-diff.sh   # writes drift-diff content; screenshot the window
bash docs/launch/gallery/capture-tree.sh
bash docs/launch/gallery/capture-templates.sh
bash docs/launch/gallery/capture-claude.sh       # takes ~30 s, calls claude -p
```

To capture the Ghostty window deterministically at 2540×1560 retina (then downscale to 1270×760):

```bash
WID=$(swift - <<'SW' 2>/dev/null
import Cocoa
import CoreGraphics
if let arr = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: AnyObject]] {
  for w in arr {
    if let o = w[kCGWindowOwnerName as String] as? String, o.lowercased().contains("ghostty") {
      if let id = w[kCGWindowNumber as String] as? Int { print(id); break }
    }
  }
}
SW
)
screencapture -l "$WID" -o /tmp/raw.png
magick /tmp/raw.png -resize 1270x760^ -gravity north -extent 1270x760 docs/launch/gallery/<slot>.png
```

Hero + changelog (production site):

```bash
CHROMIUM='/Users/petrilahdelma/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
"$CHROMIUM" --headless --disable-gpu --hide-scrollbars --window-size=1270,760 --virtual-time-budget=8000 --screenshot=docs/launch/gallery/hero.png https://projectspine.dev
"$CHROMIUM" --headless --disable-gpu --hide-scrollbars --window-size=1270,760 --virtual-time-budget=10000 --screenshot=docs/launch/gallery/changelog.png https://projectspine.dev/changelog
```

## 4. Version signal — beta

PH audience expects a usable public product. The readiness work moved Spine
past early-preview framing: the compiler, drift checks, Cursor export, MCP,
GitHub Action, package-surface checks, docs, and generated launch assets are
all present and verified.

| Option | Version | Signal | Honest? |
|--------|---------|--------|---------|
| A | `0.9.2-beta.0` | "Public beta, ready to try" | Yes — the feature set matches PRD v0.1 targets, tests are green, APIs are not changing day to day. |
| B | `0.10.0-beta.0` | "Public beta with a minor line bump" | Yes, but unnecessary unless the release needs a larger semantic marker. |
| C | `1.0.0-beta.0` | "MVP done, hardening" | Borderline. Jumps the 0.x line early. PRD explicitly targets v0.1 first. |

**Recommendation:** A. Cut `0.9.2-beta.0` as the launch release. It promotes the
actual public signal without pretending the project has crossed the 1.0
stability bar. The reason to keep 0.x is that the hosted tier and several
templates in the roadmap are 1.0 gates; shipping those and then cutting 1.0 is
truer than shipping now and calling it 1.0.

Ship a CHANGELOG entry that names the surface area this covers (CLI end-to-end, drift, tokens, six templates, spine-mcp stdio server, GitHub Action for drift check, 124 tests). No hype.

**Decision (2026-04-23):** **Cut `0.10.0` on launch day, not before.** Sequence:

1. Day -1: merge the readiness PRs from this branch to `main`. Site + CLI at `0.9.2-beta.0`, no user-visible mismatch.
2. Launch day, ~2 h before go-time: push the `v0.9.2-beta.0` tag. The existing release workflow publishes to npm with the `beta` tag.
3. Day 0, 00:01 PT: submit PH. Maker comment within 15 min. HN Show HN at +1 h. X/LinkedIn at 08:00 PT.
4. If anyone reports a smell in the first hour, `npm publish project-spine@0.10.1` is faster than debating it.

## 5. Launch-day checklist

**Target launch date: Wednesday 2026-04-29, 00:01 PT.** 6 days from lock-in. Gives a Tue/Wed slot (the highest-converting window on PH), enough buffer to merge the readiness PRs and cut `0.10.0`, and no calendar conflicts with large launches in the hunter community this week.

Day -3:
- [x] Tagline chosen — **#5: "The missing context layer for software delivery"** (48 chars). Same as the site tagline; keep the brand voice consistent across surfaces.
- [x] Maker comment chosen — **Draft A** (warm, ~155 words). Post within 15 min of PH going live.
- [x] Gallery — 6 assets captured, all 1270×760, real Ghostty for terminal slots (see `docs/launch/gallery/`); pick 5 for upload
- [x] Version decision — **cut `0.9.2-beta.0` for launch** (see §4 sequence). Promotes the public signal without inflating to 1.0.
- [x] Mobile LCP reconfirmed — **2.6 s** on 2026-04-23 (was 3.5 s before PRs #39 / #41). Marginally over the 2.5 s "Good" cutoff but overall Performance score 97 (A11y 96, Best Practices 96, SEO 100). Shipping without the mobile WebP fallback; revisit if a hunter calls it out.

Day -1:
- [ ] Draft PH submission saved (title, tagline, description, gallery, maker comment ready to paste)
- [ ] HN "Show HN" post drafted (separate from PH, different audience)
- [ ] Twitter/X post drafted
- [ ] Any direct messages queued (three friends, max — don't spam)

Launch day (Tue/Wed, 00:01 PT is the standard sweet spot):
- [ ] Submit on PH at 00:01 PT
- [ ] Post maker comment within 15 min
- [ ] Post HN "Show HN" ~1 hour after PH goes live
- [ ] Post X/Twitter at 08:00 PT
- [ ] Check the thread every 30 min for the first 4 hours; reply to every substantive comment
- [ ] Do not upvote yourself from alt accounts; do not ask anyone to upvote. Ask people to try it and leave honest feedback.

Day +1:
- [ ] Post a short "what I learned" follow-up comment on the PH thread
- [ ] Tag the launch in the CHANGELOG
- [ ] File issues for anything broken that came up during the thread

## 6. Seed audience

Cold launch = sub-optimal placement. Warm it enough that the first hour has activity, but don't astroturf. Reasonable:

- Personal X/Twitter, LinkedIn (one post each)
- Show HN, ~1 hour after PH goes live
- r/programming (title must be plain, link to repo not site)
- Any Discord where you're already a regular — devtools, Claude Code community, Cursor community
- Direct message: 3-5 people who'd actually use this. Not "upvote please" — "launching this today, curious what you think."

Do not: mass-DM, LinkedIn-spam, post in 10 Discords you don't belong to, use a "upvote exchange" service. PH will catch this and it tanks the launch.

## 7. Open questions (resolved)

- ~~Do we cut `0.10.0` as the launch release?~~ **Yes — cut on launch day morning, not before.** See §4.
- ~~Is mobile LCP ≤ 2.5 s on the latest production deploy?~~ **2.6 s. Ship anyway; Performance score 97 carries it.**
- ~~Do we self-hunt or approach a PH hunter with a devtools audience?~~ **Self-hunt.** Matches the OSS-only posture; the voice stays intact.
- ~~Target launch date?~~ **Wed 2026-04-29, 00:01 PT.**
