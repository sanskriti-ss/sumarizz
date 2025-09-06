# Product Requirements Document (PRD)

## 1) Product name

**Sumarizz** — turn Nature paper summaries into interactive Storybook stories for frontend devs/designers.

---

## 2) Background & problem

Researchers and product teams often summarize cutting‑edge Nature articles and want to turn them into shareable, interactive UI “stories” (e.g., explorable abstracts, claim/evidence viewers). Today, that requires manual copy/paste and design work. We want a front‑end app that takes paper **summaries**, enriches context with an LLM‑assisted web sweep, then **calls Gemini** to generate a structured story that exports to **Storybook** (MDX/CSF). For the hackathon, we’ll build the **frontend only**, with mocked/stubbed APIs.

---

## 3) Goals (V1 hackathon)

1. Let a user paste one or more **Nature paper summaries** (+ optional DOI/URL/keywords).
2. Show an **LLM enrichment preview** (simulated web snippets + metadata) the user can curate.
3. Let the user **choose a story type** (Explainer, Claim‑Evidence, Timeline, Comparison).
4. Call **GPT** (via mock) to generate a **normalized story schema**.
5. Preview the story as interactive components.
6. **Export** to Storybook format (MDX/CSF files) and downloadable zip.

### Non‑goals (V1)

* Real scraping/citation verification, paywalled access, or legal clearance.
* Backend persistence, auth, or team collaboration.
* Fine‑tuned model work; we’ll assume generic LLM behavior via mocks.

---

## 4) Users & personas

* **Research PM / Designer**: Wants quick explorable summaries for reviews.
* **Frontend Engineer**: Wants ready‑to‑drop Storybook stories to start building UI.
* **Scientist/Student** (stretch): Wants an interactive, accurate abstract.

Success criteria: a user can go **from summary → curated context → story preview → Storybook zip** in <10 minutes, with no backend.

---

## 5) Core user stories & acceptance criteria

1. **Import** a Nature summary

   * *As a user*, I can paste a summary and optional DOI/URL and tags.
   * **AC:** Empty state explains format; paste → parsed preview; validation for min length (≥ 400 chars) and language (EN only V1).

2. **Enrich** with web context (mock)

   * *As a user*, I see LLM‑suggested related snippets (title, 1‑2 sentences, source domain, date). I can include/exclude each.
   * **AC:** Show 6–10 mock snippets, toggles for include/exclude, select all/none, and quick “re‑roll” (regenerate mock).

3. **Configure** story generation

   * *As a user*, I choose a **Story Type** and options (e.g., number of claims, include figures, tone).
   * **AC:** Defaults are sensible; form validation; inline help tooltips.

4. **Generate** story (Gemini via mock)

   * *As a user*, I click Generate and see a spinner → then a structured story preview with sections.
   * **AC:** Progress states (Generating → Ready), error toasts on failure (with Retry), deterministic seeded mock for demoability.

5. **Preview & edit**

   * *As a user*, I can reorder sections, rename headers, toggle footnotes, and edit claim text inline.
   * **AC:** Undo/redo (local only), keyboard shortcuts, autosave to localStorage.

6. **Export** to Storybook

   * *As a user*, I export to **MDX** and **CSF**; download as **zip** with basic Storybook project scaffold.
   * **AC:** Zip contains `/stories/` with `*.stories.mdx` and `*.stories.tsx`, README.md, and instructions to `npm run storybook`.

---

## 6) Information architecture & navigation

* **/ (Home/Projects)** — list of local projects, New Project CTA.
* **/new** — paste summary, optional DOI/URL, tags → Continue.
* **/enrich** — mock “web sweep” results with curation toggles.
* **/configure** — story type + options.
* **/preview** — interactive story preview with editable fields.
* **/export** — choose MDX/CSF; generate zip; success screen.

---

## 7) Key screens & components

**Top‑level components**

* `Header` (app title, theme switch, link to GitHub)
* `Stepper` (New → Enrich → Configure → Preview → Export)
* `Toast` (errors/success)
* `EmptyState`

**New Project**

* `SummaryPasteCard` (textarea, char count, language detect, DOI field)
* `TagInput` (chips)
* `ValidationHint`

**Enrich**

* `SnippetCard` (title, excerpt, domain, date, include toggle)
* `SnippetListControls` (Select all/none, Re‑roll, Filter by domain)

**Configure**

* `StoryTypePicker` (Explainer, Claim‑Evidence, Timeline, Comparison)
* `OptionsPanel` (claim count, include figures, include glossary, tone: neutral/teaching)

**Preview**

* `StoryPreview` (renders selected story type)
* `SectionToolbar` (reorder, rename, add/remove section)
* `InlineEditor` (rich‑text minimal: bold/italic/link)

**Export**

* `ExportOptions` (MDX, CSF, both)
* `GenerateZipButton`
* `ExportSummary` (file list, size)

Accessibility: keyboard focus order, labels, announce state changes; target WCAG 2.1 AA.

---

## 8) Data model (frontend only)

```ts
export type StoryType = 'explainer' | 'claim_evidence' | 'timeline' | 'comparison';

export interface PaperSummary {
  id: string;              // uuid
  title?: string;          // optional user title
  summary: string;         // pasted content
  doi?: string;
  url?: string;
  tags: string[];
}

export interface EnrichmentSnippet {
  id: string;
  title: string;
  excerpt: string;
  source: string;          // domain
  publishedAt?: string;    // ISO date
  included: boolean;       // user toggle
}

export interface Claim {
  id: string;
  text: string;
  evidence?: string;       // citation-esque text
  confidence?: number;     // 0..1
}

export interface StorySchemaBase {
  paper: PaperSummary;
  snippets: EnrichmentSnippet[]; // included only
  storyType: StoryType;
}

export interface ExplainerStory extends StorySchemaBase {
  sections: { heading: string; body: string; }[];
}

export interface ClaimEvidenceStory extends StorySchemaBase {
  claims: Claim[];
  glossary?: { term: string; definition: string; }[];
}

export interface TimelineStory extends StorySchemaBase {
  events: { date?: string; label: string; detail: string; }[];
}

export interface ComparisonStory extends StorySchemaBase {
  axes: string[]; // e.g., methods, data, results
  items: { name: string; values: Record<string, string>; }[];
}

export type StorySchema = ExplainerStory | ClaimEvidenceStory | TimelineStory | ComparisonStory;
```

---

## 9) API contracts (mocked)

> All endpoints are **stubbed** in the frontend using MSW (Mock Service Worker) or local modules. Replace with real services later.

1. **POST** `/api/enrich`
   **Req:** `{ summary: string, doi?: string, url?: string, maxSnippets?: number }`
   **Res (mock):** `{ snippets: EnrichmentSnippet[] }`

2. **POST** `/api/generate` ("call gemini")
   **Req:** `{ storyType: StoryType, paper: PaperSummary, snippets: EnrichmentSnippet[], options?: Record<string, any> }`
   **Res (mock):** `{ story: StorySchema }`

3. **POST** `/api/export`
   **Req:** `{ story: StorySchema, formats: ('mdx'|'csf')[] }`
   **Res:** `{ zipUrl: string, files: { path: string, content: string }[] }` (in mock we create an object URL)

Error shape: `{ error: { code: string, message: string, details?: any } }`

---

## 10) Storybook output specs

We support **MDX** and **CSF (v3)**. Files land in `/stories/`.

### A) MDX template (Explainer)

```mdx
import { Meta, Story, ArgsTable, Canvas } from '@storybook/blocks';
import { Explainer } from '../src/components/Explainer';

<Meta title="Papers/${paperSlug}/Explainer" />

# {paperTitle}

{intro}

<Canvas>
  <Story name="Default">
    <Explainer sections={${JSON.stringify(sectionsPlaceholder)}} />
  </Story>
</Canvas>

## Sections
<ArgsTable of={Explainer} />
```

### B) CSF template (Claim‑Evidence)

```ts
import type { Meta, StoryObj } from '@storybook/react';
import { ClaimEvidence } from '../src/components/ClaimEvidence';

const meta: Meta<typeof ClaimEvidence> = {
  title: 'Papers/${paperSlug}/ClaimEvidence',
  component: ClaimEvidence,
};
export default meta;

export const Default: StoryObj<typeof ClaimEvidence> = {
  args: {
    claims: ${'/* array of { text, evidence, confidence } */'},
  },
};
```

### C) Project scaffold in zip

```
/README.md
/package.json (scripts: storybook, build-storybook)
/.storybook/main.ts
/.storybook/preview.ts
/src/components/Explainer.tsx
/src/components/ClaimEvidence.tsx
/stories/Explainer.stories.mdx
/stories/ClaimEvidence.stories.tsx
```

---

## 11) UX copy (samples)

* Empty state: “Paste a Nature paper summary to begin. Add a DOI for better enrichment.”
* Enrich tip: “These are LLM‑suggested context snippets — curate before generation.”
* Export success: “Your Storybook files are ready. Unzip and run `npm install && npm run storybook`.”

---

## 12) Non‑functional requirements (frontend)

* **Performance:** Generate/preview updates in <1.5s for typical payloads; zip creation <3s with <1MB of content.
* **A11y:** Semantic HTML, ARIA live for progress, focus traps in dialogs.
* **Internationalization:** English‑only; strings centralized for future i18n.
* **Theming:** Light/dark via CSS variables; system default.
* **Telemetry (optional mock):** `p2s_generate_clicked`, `p2s_export_completed`.

---

## 13) Risks & mitigations

* **Accuracy/attribution:** Enrichment is mock → clearly label as non‑verified. Future: citations and source links.
* **Licensing:** Avoid displaying full paywalled content; only show short excerpts in demo.
* **Model drift:** Provide manual edits in Preview to fix outputs.
* **Over‑scope:** Keep to 5 screens, MSW mocks, single‑user local state.

---

## 15) Definition of Done

* Run through demo: paste sample summary → select snippets → pick story → generate → edit → export → unzip → `npm run storybook` shows at least **two** working stories.
* No console errors; Lighthouse a11y ≥ 90; keyboard flow works.

---

## 16) Open questions

* Should we support multiple papers in one Comparison story for V1?
* Preferred Storybook version and framework (React/Next)? (Default React + Vite.)
* Do we include a minimal component library (e.g., shadcn/ui) in the zip?

---

## 17) Appendices

### A) Component inventory & props (TS)

```ts
export interface ExplainerProps { sections: { heading: string; body: string; }[] }
export interface ClaimEvidenceProps { claims: { text: string; evidence?: string; confidence?: number }[] }
export interface TimelineProps { events: { date?: string; label: string; detail: string }[] }
export interface ComparisonProps { axes: string[]; items: { name: string; values: Record<string, string> }[] }
```

### B) Example payloads

**/api/enrich (res)**

```json
{ "snippets": [
  { "id":"s1","title":"Contextual review of X","excerpt":"…","source":"nature.com","publishedAt":"2024-11-05","included":true },
  { "id":"s2","title":"Press summary","excerpt":"…","source":"science.org","publishedAt":"2025-01-10","included":false }
]}
```

**/api/generate (res)**

```json
{ "story": {
  "storyType":"claim_evidence",
  "paper": {"id":"p1","summary":"…","doi":"10.1038/...","tags":["genomics"]},
  "snippets": [{"id":"s1","title":"…","excerpt":"…","source":"nature.com","included":true}],
  "claims": [
    {"id":"c1","text":"Model improves accuracy by 12%","evidence":"Nature 2024, Fig.2","confidence":0.7},
    {"id":"c2","text":"Scales to 10M samples","evidence":"Methods section","confidence":0.5}
  ],
  "glossary": [{"term":"GWAS","definition":"Genome‑wide association study"}]
}}
```

### C) Example MDX output (generated)

```mdx
import { Meta, Story, Canvas } from '@storybook/blocks';
import { ClaimEvidence } from '../src/components/ClaimEvidence';

<Meta title="Papers/Genomics_2025/ClaimEvidence" />

# Key Claims

<Canvas>
  <Story name="Default">
    <ClaimEvidence claims={[
      { text: 'Model improves accuracy by 12%', evidence: 'Nature 2024', confidence: 0.7 },
      { text: 'Scales to 10M samples', evidence: 'Methods section', confidence: 0.5 }
    ]} />
  </Story>
</Canvas>
```

### D) Handoff notes for **Lovable** app generation

* Prefer **React + Vite + TypeScript**; Tailwind for styling; shadcn/ui for primitives.
* Routing: `react-router-dom` with paths listed in §6.
* State: `zustand` or `redux-toolkit`; persist preview state to `localStorage`.
* Mocks: **MSW** with handlers for `/api/enrich`, `/api/generate`, `/api/export`.
* Zip creation: `jszip` + `file-saver`.
* Markdown/MDX: `@mdx-js/react` for preview; Storybook output uses standard file emit.

---

*End of PRD*
