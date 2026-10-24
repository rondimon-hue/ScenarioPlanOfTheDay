# Scenario Plan of the Day

A daily strategic exercise for business teams. Each entry is a business scenario — a hypothetical disruption or decision point — meant to be discussed and worked through as a team, organized as a browsable archive by industry.

Static site, no backend. Domain: `scenarioplanoftheday.com` (Cloudflare DNS → Vercel hosting), source on GitHub.

## Structure

- `index.html` — single page app shell; `how-to-use.html` — the guide
- `assets/tufte/` — [Tufte CSS](https://github.com/edwardtufte/tufte-css) (MIT, see `assets/tufte/LICENSE`) and its ET Book fonts, vendored unmodified. It supplies the typography, page layout and dark mode (it follows the visitor's system setting).
- `assets/style.css` — the site's own components (controls, entries, 2x2, scenario sheet), written in Tufte's idiom and loaded after `tufte.css`. Tufte CSS assumes the default box model, so don't add a global `box-sizing: border-box`.
- `assets/app.js` — filter, search, Perspective and modal logic
- `data/scenarios.js` — all scenario content (the `window.SPOD_SCENARIOS` array)
- `data/perspectives.js` — per-industry "better / worse" statements for each PESTLE force, used to build the Perspective 2x2 (`window.SPOD_PERSPECTIVES`)
- `data/drivers.js` — suggested line items and % changes behind the Copy Claude prompt button (`window.SPOD_DRIVERS`)

## Adding scenarios

Append entries to the array in `data/scenarios.js` using this shape:

```json
{
  "id": "industry-###",
  "industry": "Retail",
  "title": "Short scenario title",
  "setup": "2-4 sentence description of the situation.",
  "questions": ["Discussion question 1", "Discussion question 2", "Discussion question 3"]
}
```

No rebuild step needed. The data files are loaded with plain `<script>` tags rather than `fetch`, so the site also works when `index.html` is opened straight from disk (Safari blocks `fetch` of local files).

## Perspective (2x2 generator)

Pick an industry, then pick 2 PESTLE forces (or "Random"). For each pair the page builds four scenarios: both forces better, both worse, and the two mixed worlds. A new industry needs an entry in `data/perspectives.js` with a "better" and "worse" sentence for all six forces, or the 2x2 will not appear for it.

## Deploy

1. Push this repo to GitHub.
2. Import into Vercel as a new project (framework preset: "Other" / static).
3. In Vercel → Domains, add `scenarioplanoftheday.com`.
4. In Cloudflare DNS, add the records Vercel provides, set to **DNS only** (grey cloud) so Vercel can issue SSL.
