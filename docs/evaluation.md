# Evaluate a configured agent

`spine replay` proves literal rules against historical Git objects. `spine evaluate`
performs a different experiment: it runs a configured agent in separate baseline
and guided clones, then invokes the same outcome evaluator in each.

This is opt-in local execution, **not an operating-system sandbox**. Review both
commands and use a disposable development environment for untrusted repositories.
An agent can access resources available to its process and may use network services
or billable model APIs. Historical replay and the offline demo need none of this.

## Adapter contract

Save a JSON adapter outside the editable evaluation repository:

```json
{
  "version": 1,
  "agent": {
    "command": "node",
    "args": ["/absolute/path/to/your-agent-adapter.mjs"]
  },
  "verify": {
    "command": "node",
    "args": ["/absolute/path/to/your-independent-evaluator.mjs"]
  },
  "timeoutMs": 120000,
  "expectedFailureCodes": [1],
  "allowedEnv": []
}
```

Your wrapper invokes the agent you use. It receives:

- `SPINE_TASK`: the case title and summary. Write these as the original task; do not
  include the known corrected patch if testing whether guidance helps discovery.
- `SPINE_REPO_DIR`: the isolated clone, also the command's working directory.
- `SPINE_CONTEXT_FILE`: a file containing verified guidance, present only for the
  guided run. Your wrapper must explicitly read and supply it to the agent.

Spine does not assume every agent reads the same instruction filename. The wrapper
owns supplying the task/context and configuring a fixed model/version. Keep all
other inputs the same between the two conditions. Use an independent evaluator
outside the clone so the agent cannot pass by rewriting its own test assertions.

Only PATH, HOME and explicitly named `allowedEnv` variables are inherited. Add
specific model credentials only if the wrapper requires them. HOME still permits
programs to discover their own saved authentication; this is not credential isolation.
Spine does not print environment values or retain raw process output in its report.

Commands use executable/argument arrays, with no implicit shell interpolation.
There is a bounded timeout and output limit. Scripts referenced by absolute path
are your responsibility; no dependency installation is implicit.

`expectedFailureCodes` declares the normal evaluator exit codes that mean a broken
control failed its assertion; the default is `[1]`. Configure `[2]` for a TypeScript
compiler check or `[101]` for Cargo tests when appropriate. Signals, timeouts and
output overflows are inconclusive, not successful negative controls. A crashed
evaluator that happens to return a declared code still needs your review; prefer a
wrapper that separates assertion failures from environment/setup errors.

## Run a paired experiment

The learning case must already pass deterministic replay:

```sh
spine replay tenant-query
spine evaluate tenant-query --adapter /absolute/path/to/adapter.json --allow-execution --runs 3 --json
```

The evaluator must pass on the known corrected revision and fail on the pristine
broken revision. Each pair starts from separate clones of the same broken SHA.
Spine invokes the agent, evaluates the result and cleans up the temporary clones.
The caller's checkout and learning verification are not modified.

Reports include per-attempt outcome, elapsed time and output byte counts, plus
baseline/guided success totals. They do not invent token counts, model costs or a
statistical claim from a handful of runs. A valid experiment can show no benefit
or worse outcomes with guidance. Store JSON output explicitly if you want a durable
record; reports are not uploaded.

## Reproducibility and limits

Record the agent wrapper, model version, evaluator, configuration, case and Git
revisions with any published results. Test a meaningful suite of independent tasks
and counterexamples before claiming general improvement. The included tests use
simulated deterministic adapters to verify the plumbing; they are not model results.

Evaluation never activates rules. Historical verification remains the admission
gate for deterministic guardrails. Agent performance evidence is a separate signal.
