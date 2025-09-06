import { http, HttpResponse } from 'msw'
import { EnrichmentSnippet, StorySchema, StoryType, PaperSummary } from '@/types'

// Mock data for enrichment snippets
const mockSnippets: EnrichmentSnippet[] = [
  {
    id: 's1',
    title: 'Breakthrough in Genomic Analysis Methods',
    excerpt: 'Recent advances in machine learning have significantly improved the accuracy of genomic variant detection, showing 12% improvement over traditional methods.',
    source: 'nature.com',
    publishedAt: '2024-11-15',
    included: true
  },
  {
    id: 's2',
    title: 'Large-scale Genomic Data Processing',
    excerpt: 'New computational frameworks demonstrate the ability to process millions of genomic samples efficiently, enabling population-scale studies.',
    source: 'science.org',
    publishedAt: '2024-10-22',
    included: true
  },
  {
    id: 's3',
    title: 'Clinical Applications of AI in Medicine',
    excerpt: 'AI-driven diagnostic tools are being validated in clinical settings, showing promising results for early disease detection.',
    source: 'cell.com',
    publishedAt: '2024-09-30',
    included: false
  },
  {
    id: 's4',
    title: 'Ethical Considerations in Genomic Research',
    excerpt: 'The scientific community discusses the importance of ethical frameworks when dealing with large-scale genetic data.',
    source: 'nejm.org',
    publishedAt: '2024-08-14',
    included: true
  },
  {
    id: 's5',
    title: 'Future Directions in Precision Medicine',
    excerpt: 'Emerging technologies promise to revolutionize personalized treatment approaches based on individual genetic profiles.',
    source: 'thelancet.com',
    publishedAt: '2024-07-03',
    included: false
  },
  {
    id: 's6',
    title: 'Regulatory Framework for AI in Healthcare',
    excerpt: 'Government agencies are developing new guidelines for the approval and monitoring of AI-based medical devices.',
    source: 'fda.gov',
    publishedAt: '2024-06-18',
    included: true
  }
]

// Mock story generation based on story type
function generateMockStory(
  storyType: StoryType,
  paper: PaperSummary,
  snippets: EnrichmentSnippet[]
): StorySchema {
  const baseStory = {
    paper,
    snippets: snippets.filter(s => s.included),
    storyType
  }

  switch (storyType) {
    case 'explainer':
      return {
        ...baseStory,
        sections: [
          {
            heading: 'Introduction',
            body: 'This research introduces a novel approach to genomic analysis using advanced machine learning techniques. The study addresses the growing need for more accurate and efficient methods in processing large-scale genomic data.'
          },
          {
            heading: 'Methodology',
            body: 'The researchers developed a new algorithm that combines deep learning with traditional statistical methods. The approach was validated on a dataset of over 10 million genetic variants across diverse populations.'
          },
          {
            heading: 'Key Findings',
            body: 'The results demonstrate a 12% improvement in accuracy compared to existing methods. The algorithm successfully identified rare variants that were previously missed by conventional approaches.'
          },
          {
            heading: 'Clinical Implications',
            body: 'These findings have significant implications for precision medicine and personalized treatment strategies. The improved accuracy could lead to better diagnosis and treatment of genetic disorders.'
          }
        ]
      }

    case 'claim_evidence':
      return {
        ...baseStory,
        claims: [
          {
            id: 'c1',
            text: 'The new method improves genomic variant detection accuracy by 12%',
            evidence: 'Validated on 10M+ variants across diverse populations (Methods section)',
            confidence: 0.85
          },
          {
            id: 'c2',
            text: 'The algorithm scales efficiently to population-level studies',
            evidence: 'Processed datasets of unprecedented size (Figure 2)',
            confidence: 0.78
          },
          {
            id: 'c3',
            text: 'Clinical validation shows promise for rare disease diagnosis',
            evidence: 'Pilot study with 1,000 patients (Supplementary Materials)',
            confidence: 0.72
          }
        ],
        glossary: [
          { term: 'Genomic variant', definition: 'A difference in DNA sequence between individuals' },
          { term: 'Population-scale', definition: 'Studies involving large groups of people (thousands to millions)' },
          { term: 'Precision medicine', definition: 'Medical care tailored to individual characteristics' }
        ]
      }

    case 'timeline':
      return {
        ...baseStory,
        events: [
          {
            date: '2020-2022',
            label: 'Initial Development',
            detail: 'Research team developed the core algorithm and conducted preliminary testing'
          },
          {
            date: '2023',
            label: 'Large-scale Validation',
            detail: 'Validation study conducted on 10+ million genomic variants'
          },
          {
            date: 'Early 2024',
            label: 'Clinical Pilot',
            detail: 'First clinical application in rare disease diagnosis'
          },
          {
            date: 'Current',
            label: 'Publication & Review',
            detail: 'Results published and undergoing peer review process'
          }
        ]
      }

    case 'comparison':
      return {
        ...baseStory,
        axes: ['Method', 'Accuracy', 'Speed', 'Scalability'],
        items: [
          {
            name: 'Traditional Methods',
            values: {
              'Method': 'Statistical analysis',
              'Accuracy': 'Baseline (100%)',
              'Speed': 'Moderate',
              'Scalability': 'Limited'
            }
          },
          {
            name: 'New AI Approach',
            values: {
              'Method': 'Deep learning + statistics',
              'Accuracy': '112% of baseline',
              'Speed': 'Fast',
              'Scalability': 'Population-scale'
            }
          }
        ]
      }

    default:
      throw new Error(`Unknown story type: ${storyType}`)
  }
}

export const handlers = [
  // Enrich endpoint
  http.post('/api/enrich', async ({ request }) => {
    const body = await request.json() as {
      summary: string
      doi?: string
      url?: string
      maxSnippets?: number
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    const maxSnippets = body.maxSnippets || 6
    const selectedSnippets = mockSnippets.slice(0, maxSnippets)

    return HttpResponse.json({
      snippets: selectedSnippets
    })
  }),

  // Generate story endpoint
  http.post('/api/generate', async ({ request }) => {
    const body = await request.json() as {
      storyType: StoryType
      paper: PaperSummary
      snippets: EnrichmentSnippet[]
      options?: Record<string, any>
    }

    // Simulate longer API delay for story generation
    await new Promise(resolve => setTimeout(resolve, 2000))

    const story = generateMockStory(body.storyType, body.paper, body.snippets)

    return HttpResponse.json({
      story
    })
  }),

  // Export endpoint
  http.post('/api/export', async ({ request }) => {
    const body = await request.json() as {
      story: StorySchema
      formats: ('mdx' | 'csf')[]
    }

    // Simulate export processing
    await new Promise(resolve => setTimeout(resolve, 1500))

    const files: { path: string; content: string }[] = []

    if (body.formats.includes('mdx')) {
      files.push({
        path: 'stories/Example.stories.mdx',
        content: generateMDXContent(body.story)
      })
    }

    if (body.formats.includes('csf')) {
      files.push({
        path: 'stories/Example.stories.tsx',
        content: generateCSFContent(body.story)
      })
    }

    // Add component files
    files.push({
      path: 'src/components/Explainer.tsx',
      content: generateComponentContent('Explainer')
    })

    // Create a mock blob URL (in real implementation, would use JSZip)
    const zipUrl = 'blob:mock-zip-url'

    return HttpResponse.json({
      zipUrl,
      files
    })
  })
]

function generateMDXContent(story: StorySchema): string {
  const paperSlug = story.paper.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Paper'
  
  return `import { Meta, Story, Canvas } from '@storybook/blocks';
import { ${story.storyType === 'explainer' ? 'Explainer' : 'ClaimEvidence'} } from '../src/components/${story.storyType === 'explainer' ? 'Explainer' : 'ClaimEvidence'}';

<Meta title="Papers/${paperSlug}/${story.storyType}" />

# ${story.paper.title || 'Research Paper'}

${story.paper.summary.substring(0, 200)}...

<Canvas>
  <Story name="Default">
    <${story.storyType === 'explainer' ? 'Explainer' : 'ClaimEvidence'} 
      ${story.storyType === 'explainer' 
        ? `sections={${JSON.stringify((story as any).sections, null, 2)}}` 
        : `claims={${JSON.stringify((story as any).claims, null, 2)}}`
      } 
    />
  </Story>
</Canvas>
`
}

function generateCSFContent(story: StorySchema): string {
  const componentName = story.storyType === 'explainer' ? 'Explainer' : 'ClaimEvidence'
  const paperSlug = story.paper.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Paper'
  
  return `import type { Meta, StoryObj } from '@storybook/react';
import { ${componentName} } from '../src/components/${componentName}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Papers/${paperSlug}/${componentName}',
  component: ${componentName},
};
export default meta;

export const Default: StoryObj<typeof ${componentName}> = {
  args: {
    ${story.storyType === 'explainer' 
      ? `sections: ${JSON.stringify((story as any).sections, null, 4)}`
      : `claims: ${JSON.stringify((story as any).claims, null, 4)}`
    }
  },
};
`
}

function generateComponentContent(componentName: string): string {
  return `import React from 'react';

interface ${componentName}Props {
  sections: { heading: string; body: string; }[];
}

export const ${componentName}: React.FC<${componentName}Props> = ({ sections }) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {sections.map((section, index) => (
        <div key={index} className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>
          <p className="text-gray-700 leading-relaxed">{section.body}</p>
        </div>
      ))}
    </div>
  );
};
`
}
