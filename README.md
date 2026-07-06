# Scenario Plan of the Day

A daily strategic exercise for business teams. Each entry is a business scenario — a hypothetical disruption or decision point — meant to be discussed and worked through as a team, organized as a browsable archive by industry.

Static site, no backend. Domain: `scenarioplanoftheday.com` (Cloudflare DNS → Vercel hosting), source on GitHub.

## Structure

- `index.html` — single page app shell
- `assets/style.css`, `assets/app.js` — styling and filter/search/modal logic
- `data/scenarios.json` — all scenario content

## Adding scenarios

Append entries to `data/scenarios.json` using this shape:

```json
{
  "id": "industry-###",
  "industry": "Retail",
  "title": "Short scenario title",
  "setup": "2-4 sentence description of the situation.",
  "questions": ["Discussion question 1", "Discussion question 2", "Discussion question 3"]
}
```

No rebuild step needed — the page fetches `data/scenarios.json` at runtime.

## Deploy

1. Push this repo to GitHub.
2. Import into Vercel as a new project (framework preset: "Other" / static).
3. In Vercel → Domains, add `scenarioplanoftheday.com`.
4. In Cloudflare DNS, add the records Vercel provides, set to **DNS only** (grey cloud) so Vercel can issue SSL.
