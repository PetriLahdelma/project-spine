# GA4 Observability

Project Spine publishes public Google Analytics stream metadata for agents at:

- `https://projectspine.dev/.well-known/site-analytics.json`
- `https://projectspine.dev/schemas/public-site-analytics.v1.json`

Those values identify the website tag and stream:

| Field | Value | Security classification |
|---|---:|---|
| Stream name | `Project Spine` | Public identifier |
| Stream URL | `https://projectspine.dev` | Public identifier |
| Stream ID | `15010753552` | Public identifier |
| Measurement ID | `G-PGVBQ7SHQC` | Public identifier |

These identifiers are not API keys, bearer tokens, client secrets, or refresh
tokens. They are safe for agents to read and cite. They are not sufficient to
query Google Analytics reporting data.

## Recommended MCP path

Use Google's official experimental Google Analytics MCP server for read-only
GA4 observability:

- Docs: <https://developers.google.com/analytics/devguides/MCP>
- Source: <https://github.com/googleanalytics/google-analytics-mcp>
- Package command: `pipx run analytics-mcp`

The server exposes read tools backed by the Google Analytics Admin API and
Google Analytics Data API, including:

- `get_account_summaries`
- `get_property_details`
- `run_report`
- `run_realtime_report`
- `run_funnel_report`
- `get_custom_dimensions_and_metrics`

Google documents the MCP server as read-only: it can answer reporting and
configuration questions but cannot edit Analytics settings.

## Private configuration still required

Do not commit any of these values. Store them in the user's MCP client config,
local shell profile, password manager, or another secret manager.

| Required value | Suggested env var | Why |
|---|---|---|
| Numeric GA4 property ID | `GA4_PROPERTY_ID` | `run_report`, `run_realtime_report`, and funnel tools require `property_id`. This is not the `G-...` measurement ID and not the stream ID. |
| Application Default Credentials path | `GOOGLE_APPLICATION_CREDENTIALS` | Local path to Google credentials with `https://www.googleapis.com/auth/analytics.readonly`. |
| Google Cloud project ID | `GOOGLE_PROJECT_ID` | Project where Google Analytics Admin API and Google Analytics Data API are enabled. |

The easiest discovery flow is:

1. Configure ADC with the Analytics read-only scope.
2. Start `analytics-mcp`.
3. Ask the MCP server to run `get_account_summaries`.
4. Pick the Project Spine GA4 property from the returned account/property list.
5. Save the numeric property ID privately as `GA4_PROPERTY_ID`.

## Example MCP client config

Replace the placeholder values before use. Do not commit this file if it
contains local credential paths.

```json
{
  "mcpServers": {
    "analytics-mcp": {
      "command": "pipx",
      "args": ["run", "analytics-mcp"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/absolute/path/to/application_default_credentials.json",
        "GOOGLE_PROJECT_ID": "your-google-cloud-project-id"
      }
    }
  }
}
```

## Useful agent prompts

- "Use `get_account_summaries` to find the Project Spine GA4 property ID."
- "Run a realtime report for `activeUsers` by `eventName` for the Project Spine property."
- "Run a 7-day report for `activeUsers`, `sessions`, `screenPageViews`, and `eventCount` by `pagePath`."
- "Filter reports to stream ID `15010753552` when validating the projectspine.dev web stream."

## Direct API path

If an MCP client is unavailable, use the Google Analytics Data API directly.
The reporting endpoint uses the numeric property resource form
`properties/GA_PROPERTY_ID`, for example:

```text
POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
```

The public stream ID can be used as a report dimension/filter when you need to
limit observability to the `projectspine.dev` web stream, but the request still
needs the numeric GA4 property ID and authenticated read-only credentials.
