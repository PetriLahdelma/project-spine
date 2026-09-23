# Project Spine website design direction

The incumbent identity remains authoritative: bright cyan fields, pink accents, near-black ink, off-white reading surfaces, the italic Project Spine wordmark, strong rules, and dark terminal artifacts.

The redesign gives the product workflow visual priority. The homepage opens with the existing poster identity and follows with an interactive four-stage evidence → guardrail → replay → enforce demo. The demo is explicitly labelled illustrative. Editorial explanation uses large headlines and dense, inspectable terminal output rather than generic feature-card decoration.

Interaction rules:

- Tabs work with click, Left Arrow, and Right Arrow.
- Selected state, focus state, and panel relationships use native ARIA tab semantics.
- All controls meet a 44px touch target where practical.
- Content and commands wrap on narrow screens instead of forcing page overflow.
- Motion is restrained and disabled through `prefers-reduced-motion`.
- Color never carries state alone; text, borders, and symbols reinforce it.

Responsive layout collapses the demo, replay proof, and capability grid before 900px. At 600px the four stages become a two-by-two control, capability cards become a single column, and the source command uses a stacked copy control.

Copy stays concrete and bounded. It says what the current beta can read, write, and verify. It does not describe future hosted services or use biological immunity metaphors as product guarantees.

