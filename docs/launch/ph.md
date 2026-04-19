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

### Plan

| # | Asset | Source | Notes |
|---|-------|--------|-------|
| 1 | Hero: site wordmark + tagline | Screenshot of `https://projectspine.dev` above-the-fold at 1270×760 | Already the cleanest brand shot we have. |
| 2 | Demo in motion | Convert `docs/demo/demo.gif` to a 1270×760 still OR upload the GIF directly (PH accepts animated GIFs in gallery) | Show the compile + drift sequence. |
| 3 | Drift diff terminal | New terminal screenshot: run `spine drift diff` after a hand-edit to `AGENTS.md` | This is the "oh, that's different" moment. |
| 4 | Generated file tree | Terminal screenshot: `tree .project-spine` or `ls AGENTS.md CLAUDE.md .github/copilot-instructions.md .project-spine/` | Makes the "19 files in one compile" claim concrete. |
| 5 | AGENTS.md rendered in Claude Code / Cursor | Real screenshot from an editor, showing the compiled AGENTS.md being used | Closes the loop: input (brief) → output (agent actually uses it). |

### Capture commands

Run these at your own terminal (Tokyo Night theme matches the demo GIF, but any dark theme works). Capture at 2x retina, crop to 1270×760.

```bash
# Frame 3 — drift diff
cd $(mktemp -d) && spine init --template saas-marketing
printf '{"name":"acme","dependencies":{"next":"14.0.0"}}' > package.json
spine compile --brief ./brief.md --repo . --template saas-marketing > /dev/null
echo '# hand edit' >> AGENTS.md
clear && spine drift diff

# Frame 4 — generated tree
cd $(mktemp -d) && spine init --template saas-marketing
printf '{"name":"acme","dependencies":{"next":"14.0.0"}}' > package.json
spine compile --brief ./brief.md --repo . --template saas-marketing > /dev/null
clear && ls -la AGENTS.md CLAUDE.md .github/ .project-spine/
```

For frame 5: open the generated `AGENTS.md` in Claude Code or Cursor, take a screenshot of the editor with the file open and the agent panel visible — shows the downstream surface.

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
- [ ] Gallery 5 images captured + cropped to 1270×760
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
