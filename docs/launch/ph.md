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

## 3. Gallery — 5 slots

PH allows 5 images in the gallery (plus one optional video). Image spec: 1270×760, PNG/JPG. First image is the hero and shows in the feed preview — it carries the most weight.

### Plan (4 of 5 captured — slot 5 still needs your editor)

| # | File | Source | Size | Status |
|---|------|--------|------|--------|
| 1 | [`hero.png`](gallery/hero.png) | Headless-Chromium capture of `https://projectspine.dev` at 1270×760 | 108 KB | ✅ |
| 2 | [`demo.gif`](gallery/demo.gif) | Copy of `docs/demo/demo.gif` (animated; PH accepts GIF in gallery) | 1.1 MB, 1100×700 | ✅ |
| 3 | [`drift-diff.png`](gallery/drift-diff.png) | VHS tape `gallery/drift-diff.tape`, Tomorrow Night palette (Ghostty default) | 42 KB, 1270×760 | ✅ |
| 4 | [`tree.png`](gallery/tree.png) | VHS tape `gallery/tree.tape`, same palette | 51 KB, 1270×760 | ✅ |
| 5 | `editor.png` | Real screenshot of `AGENTS.md` open in Claude Code or Cursor with the agent panel visible | — | ⏳ your machine |

### Regenerating

The terminal slots are VHS-driven, so they re-render deterministically. `spine` must be on PATH (`npm i -g project-spine@next`):

```bash
vhs docs/launch/gallery/drift-diff.tape
vhs docs/launch/gallery/tree.tape
# then extract the last frame of each GIF as a PNG
magick docs/launch/gallery/drift-diff.gif -coalesce /tmp/d-%03d.png && cp "$(ls /tmp/d-*.png | tail -1)" docs/launch/gallery/drift-diff.png && rm /tmp/d-*.png
magick docs/launch/gallery/tree.gif -coalesce /tmp/t-%03d.png && cp "$(ls /tmp/t-*.png | tail -1)" docs/launch/gallery/tree.png && rm /tmp/t-*.png
```

Hero (production site) — requires the Playwright Chromium you already have cached at `~/Library/Caches/ms-playwright/chromium-1217/`:

```bash
CHROMIUM='/Users/petrilahdelma/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
"$CHROMIUM" --headless --disable-gpu --hide-scrollbars --window-size=1270,760 --virtual-time-budget=8000 --screenshot=docs/launch/gallery/hero.png https://projectspine.dev
```

### Slot 5 — what to capture

Open the generated `AGENTS.md` in whichever editor you actually use. Claude Code or Cursor are both fine — whichever one a hunter would recognise fastest is best. Frame it so:

- The file is clearly `AGENTS.md` (filename visible in the tab/breadcrumb).
- A recognisable section heading shows (e.g. "Conventions", "Quality bars") — proves it's real content, not a stub.
- The agent panel is open with a short conversation visible, or a recent command referencing the file. Don't stage a fake convo — if there's nothing real, just show the file open.

Save at `docs/launch/gallery/editor.png`, 1270×760 (retina-crop down to that if needed).

## 4. Version signal — alpha vs beta vs drop-tag

PH audience splits on "alpha". Some reflex-downvote. Three options:

| Option | Version | Signal | Honest? |
|--------|---------|--------|---------|
| A | `0.9.2-alpha.0` (current) | "Early, expect rough edges" | Yes, but the tests + dogfood + sample outputs say otherwise. |
| B | `0.9.3` or `0.10.0` (drop alpha tag) | "Pre-1.0 stable, ready to try" | Yes — the feature set matches PRD v0.1 targets, tests are green, APIs aren't changing day to day. |
| C | `1.0.0-beta.0` | "MVP done, hardening" | Borderline. Jumps the 0.x line early. PRD explicitly targets v0.1 first. |

**Recommendation:** B. Cut `0.10.0` as the launch-day release. Drops the "alpha" drag without inflating to 1.0 — matches CONTRIBUTING.md's posture of staying honest about pre-1.0 status. The reason to keep 0.x is that the hosted tier and several templates in the roadmap are 1.0 gates; shipping those and then cutting 1.0 is truer than shipping now and calling it 1.0-beta.

Ship a CHANGELOG entry that names the surface area this covers (CLI end-to-end, drift, tokens, six templates, 121 tests). No hype.

## 5. Launch-day checklist

Day -3:
- [ ] Tagline chosen (§1)
- [ ] Maker comment chosen + committed to a local scratch file (not the repo)
- [x] Gallery slots 1–4 captured at 1270×760 (see `docs/launch/gallery/`)
- [ ] Gallery slot 5 (editor screenshot) captured
- [ ] Version decision made (§4); if cutting `0.10.0`, PR + merge + `npm publish` before launch day
- [ ] Mobile LCP reconfirmed ≤ 2.5 s on production (if not, ship mobile WebP fallback)

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

## 7. Open questions

- Do we cut `0.10.0` as the launch release? (see §4 — recommend yes)
- Is mobile LCP ≤ 2.5 s on the latest production deploy? (pending PSI rerun; was ~3.5 s before the font trim in #41)
- Do we self-hunt or approach a PH hunter with a devtools audience? (previous session concluded: self-hunt)
- Target launch date — Tue or Wed in the next two weeks?
