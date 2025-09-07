# AI Storybook & Meme Generator

*Transform any topic into engaging visual stories and witty memes powered by Google's Gemini AI*

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-5.0.8-orange)](https://zustand-demo.pmnd.rs/)

## What Makes This Special

This isn't just another content generator. It's an **intelligent storytelling companion** that creates:

- **Interactive Storybooks** (5, 11, or 30 pages) with AI-generated illustrations
- **Sarcastic Memes** with intelligent humor selection 
- **Visual Narratives** tailored to any proficiency level
- **Persistent Library** with bookshelf management
- **Smart Regeneration** with automatic image restoration

## Core Features

### Adaptive Content Generation
- **Multi-Source Learning**: Academic papers, books, videos, and more
- **Proficiency Scaling**: Beginner to Expert level content adaptation
- **Format Flexibility**: Short stories to full chapters

### Visual Storytelling
- **AI-Powered Illustrations**: Context-aware image generation via Imagen 3.0
- **Auto-Recovery**: Smart image regeneration on page reload
- **Responsive Design**: Beautiful on any device

### Intelligent Meme Creation
- **3-Option Generation**: AI creates multiple meme texts with sarcasm levels
- **Automatic Selection**: System picks the wittiest option
- **Visual Humor**: Perfect image-text combinations
- **Regeneration**: Text and images can be updated independently

### Smart Persistence
- **Session Continuity**: Never lose your work during browser refreshes
- **Bookshelf Library**: Save and organize your creations
- **Cross-Session Recovery**: Automatically restore incomplete work
- **SSR-Safe Storage**: Robust localStorage/sessionStorage handling

## Technology Stack

### Frontend Powerhouse
```typescript
Next.js 15.5.2 + Turbopack  // Blazing fast development
React 19.1.0               // Latest concurrent features
TypeScript 5               // Full type safety
Tailwind CSS 4             //  Utility-first styling
Zustand 5.0.8              // Lightweight state management
```

### AI Integration
```typescript
Google Generative AI        // 🧠 Gemini 2.0-flash-exp for text
Imagen 3.0                 // 🖼️ High-quality image generation
Custom Rate Limiting        // 🛡️ API protection (20 text / 30 image per minute)
```

## Quick Start

### Prerequisites
```bash
Node.js 18+ 
Google AI API Key (Get one at: https://ai.google.dev/)
```

### Installation
```bash
# Clone the repository
git clone [your-repo-url]
cd nameinprogress

# Install dependencies
npm install

# Set up environment variables
echo "GOOGLE_API_KEY=your_google_ai_api_key_here" > .env.local
```

### Development
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit `http://localhost:3000` and start creating!

## How to Use

### Creating Storybooks

1. **Choose Your Topic**: Enter any subject you want to learn about
2. **Set Parameters**:
   - **Proficiency Level**: Beginner → Expert
   - **Content Source**: Academic papers, books, videos, etc.
   - **Length**: 5, 11, or 30 pages
3. **Generate**: Watch AI create your personalized storybook
4. **Save**: Add to your persistent bookshelf library

### Making Memes

1. **Select "Meme" Format**: Choose meme from the length options
2. **Enter Topic**: Any concept you want turned into humor
3. **AI Magic**: System generates 3 sarcasm options and picks the best
4. **Regenerate**: Update text or images independently

### Managing Your Library

- **Bookshelf View**: Browse all saved stories and memes
- **One-Click Access**: Instant reopening of saved content
- **Smart Recovery**: Automatic restoration after browser refreshes
- **Regeneration Controls**: Update any saved content anytime

## Project Architecture

```
src/
├── app/
│   ├── explore.tsx           # Main app component (1135+ lines)
│   ├── page.tsx             # Next.js entry point
│   ├── layout.tsx           # App layout and metadata
│   ├── globals.css          # Global styles
│   └── api/
│       ├── generate-content/ # Content generation endpoint
│       │   └── route.ts     # Gemini AI integration (217 lines)
│       └── generate-image/   # Image generation endpoint
│           └── route.ts     # Imagen 3.0 integration (223 lines)
└── store/
    ├── bookshelfStore.ts    # Persistent library management (163 lines)
    └── sessionStore.ts      # Session state management (131 lines)
```

## Key Technical Features

### AI Content Engine
- **Multi-Type Generation**: Summaries, storybooks, meme text
- **Intelligent Prompting**: Context-aware prompt engineering
- **3-Option Meme Selection**: Automatic sarcasm level analysis
- **Error Recovery**: Graceful fallbacks and retry mechanisms

### Smart Image Generation
- **Contextual Imagery**: Category-based image selection
- **Auto-Regeneration**: Missing image detection and restoration
- **Fallback Strategies**: Placeholder generation on API failures
- **Optimized Prompts**: Context-specific image generation

### State Management
- **Zustand Integration**: Lightweight, type-safe state
- **SSR Safety**: Browser environment detection
- **Dual Persistence**: localStorage + sessionStorage
- **Auto-Sync**: Cross-component state synchronization

## Performance Optimizations

- **Progressive Loading**: Individual page image generation
- **Background Processing**: Non-blocking image generation
- **Stable Dependencies**: Optimized useEffect dependencies
- **Compressed Storage**: Minimal storage footprint
- **Smart Caching**: Efficient content retrieval

## UI/UX Highlights

- **Responsive Design**: Mobile-first approach
- **Loading States**: Smooth user experience during generation
- **Error Handling**: Graceful failure recovery
- **Accessibility**: Keyboard navigation support
- **Dark Theme**: Elegant visual design

## Contributing

We welcome contributions! Here's how:

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Follow Standards**: TypeScript, proper error handling
4. **Add Tests**: Ensure functionality works
5. **Submit PR**: Detailed description of changes

## Future Enhancements

### Planned Features
- [ ] **Voice Narration**: Text-to-speech integration
- [ ] **Social Sharing**: Direct social media export
- [ ] **Custom Themes**: Personalized visual styles
- [ ] **Advanced Memes**: GIF and video support
- [ ] **Collaborative Stories**: Multi-user creation

### Technical Roadmap
- [ ] **Offline Support**: PWA implementation
- [ ] **Real-time Collaboration**: WebSocket integration
- [ ] **Advanced AI**: Multi-model support
- [ ] **Analytics**: Usage insights and optimization

## Troubleshooting

### Common Issues

**Rate Limiting**
- Text API: 20 requests/minute
- Image API: 30 requests/minute
- Clear error messages with retry timers

**Storage Issues**
- SSR-safe wrappers handle browser compatibility
- Automatic corruption recovery
- Session restoration on page reload

**Image Generation**
- Auto-retry on failures
- Fallback placeholder generation
- Manual regeneration controls

## Environment Variables

```bash
# Required
GOOGLE_API_KEY=your_google_ai_api_key

# Optional (defaults shown)
NEXT_PUBLIC_APP_NAME=AI Storybook Generator
```

## Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel --prod

# Add environment variables in Vercel dashboard
```

### Other Platforms
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Stats

- **Lines of Code**: 1500+ TypeScript/TSX
- **Components**: 15+ React components
- **API Routes**: 2 robust endpoints
- **State Stores**: 2 Zustand stores
- **Type Coverage**: 100% TypeScript
- **Performance**: <2s initial load

## 👥 Contributors

This project was built by an amazing team during the Man vs AI Hackathon:

- **Clyde Villacrusis** - State Management & AI Integration
- **Simon Zhang** - Frontend Architecture & UI/UX Design  
- **Sanskriti Shindadkar** - Core Development & API Development
- **Rana** - Testing & Performance Optimization

## 🙏 Acknowledgments

- **Google AI** for Gemini and Imagen APIs
- **Tailwind Labs** for beautiful utility CSS
- **Poimandres** for Zustand state management

---

<div align="center">

**Made with ❤️ and 🤖 for the Man vs AI Hackathon**

*Transform ideas into stories, one AI generation at a time*

[🌟 Star this repo](https://github.com/yourusername/nameinprogress) • [🐛 Report Bug](https://github.com/yourusername/nameinprogress/issues) • [💡 Request Feature](https://github.com/yourusername/nameinprogress/discussions)

</div>
