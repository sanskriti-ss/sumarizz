# Sumarizz - Nature Paper Stories (Work in progress)

Transform Nature paper summaries into interactive Storybook stories for frontend developers and designers.

## 🚀 Features

- **Import Summary**: Paste Nature paper summaries with optional DOI and tags
- **AI Enhancement**: Get contextual snippets and curate before generation  
- **Story Types**: 
  - Explainer stories with sections
  - Claim-Evidence analysis with confidence scores
  - Timeline visualization of research progression
  - Comparison tables for methods/results
- **Export Formats**: Generate MDX and CSF files for Storybook
- **Complete Project**: Download ready-to-run Storybook scaffold

## 🛠 Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for styling
- **Zustand** for state management
- **MSW** for API mocking
- **React Hook Form** + **Zod** for validation
- **JSZip** for file generation

## 📋 User Flow

1. **New Project** (`/new`) - Paste paper summary, add tags
2. **Enrich** (`/enrich`) - Review AI-suggested context snippets
3. **Configure** (`/configure`) - Choose story type and options
4. **Preview** (`/preview`) - Edit and review generated story
5. **Export** (`/export`) - Download Storybook files

## 🏃‍♂️ Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── new/               # Import summary
│   ├── enrich/            # Curate snippets
│   ├── configure/         # Story configuration
│   ├── preview/           # Story preview & editing
│   └── export/            # Export to Storybook
├── components/
│   ├── ui/                # Reusable UI components
│   └── providers/         # Context providers
├── mocks/                 # MSW API handlers
├── store/                 # Zustand state management
├── types/                 # TypeScript definitions
└── lib/                   # Utilities
```

## 🎯 Demo Flow

Try this sample Nature paper summary:

```
This study presents a novel machine learning approach for genomic variant detection that achieves 12% improvement in accuracy over traditional methods. The algorithm combines deep learning with statistical analysis to process datasets of over 10 million genetic variants across diverse populations. Clinical validation shows promising results for rare disease diagnosis, with potential applications in precision medicine and personalized treatment strategies.
```

## 🔧 Configuration

The app uses mock APIs by default. Key configurations:

- **Story Types**: Explainer, Claim-Evidence, Timeline, Comparison
- **Export Formats**: MDX (recommended), CSF, or both
- **Options**: Claim count, figures, glossary, tone

## 📦 Export Output

Generated Storybook files include:

- `stories/*.stories.mdx` - MDX story files
- `stories/*.stories.tsx` - CSF story files  
- `src/components/*.tsx` - React components
- `README.md` - Setup instructions
- `package.json` - Dependencies

## 🚧 Development Notes

- All APIs are mocked using MSW for hackathon demo
- State persists in localStorage during development
- Responsive design with dark mode support
- Accessibility features (WCAG 2.1 AA target)

## 📝 Next Steps

1. Replace mock APIs with real services
2. Add authentication and team collaboration
3. Implement actual web scraping for enrichment
4. Add more story types and export formats
5. Integrate with Citation APIs for verification