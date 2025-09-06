export type StoryType = 'explainer' | 'claim_evidence' | 'timeline' | 'comparison';

export interface PaperSummary {
  id: string;
  title?: string;
  summary: string;
  doi?: string;
  url?: string;
  tags: string[];
}

export interface EnrichmentSnippet {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  publishedAt?: string;
  included: boolean;
}

export interface Claim {
  id: string;
  text: string;
  evidence?: string;
  confidence?: number;
}

export interface StorySchemaBase {
  paper: PaperSummary;
  snippets: EnrichmentSnippet[];
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
  axes: string[];
  items: { name: string; values: Record<string, string>; }[];
}

export type StorySchema = ExplainerStory | ClaimEvidenceStory | TimelineStory | ComparisonStory;

export interface StoryConfig {
  storyType: StoryType;
  options: {
    claimCount?: number;
    includeFigures?: boolean;
    includeGlossary?: boolean;
    tone?: 'neutral' | 'teaching';
  };
}

export interface ProjectState {
  paper?: PaperSummary;
  enrichmentSnippets: EnrichmentSnippet[];
  config?: StoryConfig;
  story?: StorySchema;
  currentStep: 'new' | 'enrich' | 'configure' | 'preview' | 'export';
}
