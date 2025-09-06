"use client";
import React, { useState, useEffect } from 'react';

// Types
interface StoryPage {
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null;
  imageLoading?: boolean;
}
// Spinner Component for loading states
const Spinner = () => (
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
);

// Main App Component
const App = () => {
  const [topic, setTopic] = useState('');
  const [step, setStep] = useState(1);
  const [proficiency, setProficiency] = useState('');
  const [source, setSource] = useState('');
  const [textLength, setTextLength] = useState('');
  const [scrollDirection, setScrollDirection] = useState('');
  const [summary, setSummary] = useState('');
  const [storybook, setStorybook] = useState<StoryPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset error message whenever the step changes
  useEffect(() => {
    setErrorMessage('');
  }, [step]);

  const generateSummary = async () => {
    if (!proficiency || !source || !textLength || !scrollDirection) {
      setErrorMessage("Please select all options.");
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setStep(3); // Move to loading step

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          proficiency,
          source,
          type: 'summary'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setErrorMessage(`Rate limit exceeded. ${data.message}`);
        } else {
          setErrorMessage(data.error || 'Failed to generate summary');
        }
        setStep(2);
        return;
      }

      if (data.success && data.content) {
        setSummary(data.content);
        setStep(4);
      } else {
        throw new Error("Invalid response from API");
      }
    } catch (error) {
      console.error("Summary generation failed:", error);
      setErrorMessage("Failed to generate summary. Please try again.");
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const generateStorybook = async () => {
    setLoading(true);
    setErrorMessage('');
    setStep(5); // Go directly to the storybook view

    // Determine number of pages based on text length selection
    const pageCount = textLength === 'Full Chapter' ? 30 : 5;

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          proficiency,
          source,
          type: 'storybook',
          pageCount
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setErrorMessage(`Rate limit exceeded. ${data.message}`);
        } else {
          setErrorMessage(data.error || 'Failed to generate storybook');
        }
        setStep(4);
        return;
      }

      if (data.success && data.content) {
        try {
          // Clean the JSON response - remove any markdown formatting or extra text
          let cleanedContent = data.content;
          
          // If the content is wrapped in markdown code blocks, extract the JSON
          const jsonMatch = cleanedContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
          if (jsonMatch) {
            cleanedContent = jsonMatch[1];
          }
          
          // Parse the JSON response
          const storyPages = JSON.parse(cleanedContent);
          
          // Handle both direct array format and object with pages property
          const pagesArray = Array.isArray(storyPages) ? storyPages : storyPages.pages;
          
          if (!pagesArray || !Array.isArray(pagesArray)) {
            throw new Error("Invalid storybook format - expected array of pages");
          }
          
          const initialStorybookState = pagesArray.map((page: any) => ({
            ...page,
            imageUrl: null,
            imageLoading: true
          }));
          
          setStorybook(initialStorybookState);
          setLoading(false); // Main loading is done, now load images individually

          // Fetch images for each page
          pagesArray.forEach(async (page: any) => {
            generateImageForPage(page.id, page.imageDescription || page.content);
          });
        } catch (parseError) {
          console.error("JSON parsing error:", parseError);
          console.log("Raw content:", data.content);
          setErrorMessage("Failed to parse the generated story. The AI returned invalid data.");
          setStep(4);
        }
      } else {
        throw new Error("Invalid response from API");
      }
    } catch (error) {
      console.error("Storybook generation failed:", error);
      setErrorMessage("Failed to generate the story. Please try again.");
      setStep(4);
    }
  };

  const generateImageForPage = async (pageId: number, imagePrompt: string) => {
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          pageId: pageId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.success && data.imageUrl) {
        setStorybook(prev => prev.map(p => 
          p.id === pageId ? { ...p, imageUrl: data.imageUrl, imageLoading: false } : p
        ));
      } else {
        throw new Error("Invalid response from image API");
      }
    } catch (error) {
      console.error(`Failed to generate image for page ${pageId}:`, error);
      // Set a placeholder on failure
      setStorybook(prev => prev.map(p => 
        p.id === pageId ? { 
          ...p, 
          imageUrl: `https://placehold.co/600x400/FF0000/FFFFFF?text=Image+Failed`, 
          imageLoading: false 
        } : p
      ));
    }
  };


  // --- Render Logic ---

  const renderStep = () => {
    if (loading && (step === 3 || (step === 5 && storybook.length === 0))) {
        return (
          <div className="text-center flex flex-col items-center justify-center text-white">
            <h2 className="text-2xl font-bold mb-4">
                {step === 3 ? "Generating Text Summary..." : "Crafting your story..."}
            </h2>
            <Spinner />
          </div>
        );
    }
    
    switch (step) {
      case 1:
        return (
          <div className="w-full max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">What topic are you interested in?</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (topic) setStep(2); }}>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900"
                placeholder="e.g., Quantum Computing, Stoic Philosophy..."
              />
              <button
                type="submit"
                disabled={!topic}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105"
              >
                Next
              </button>
            </form>
          </div>
        );
      case 2:
        return (
          <div className="w-full max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Scope of your Topic</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">Proficiency Level</label>
                    <select value={proficiency} onChange={(e) => setProficiency(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                      <option value="">Select a level...</option>
                      <option value="Beginner">Beginner (New to the topic)</option>
                      <option value="Intermediate">Intermediate (Somewhat proficient)</option>
                      <option value="Expert">Expert (Deep knowledge)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">Preferred Source</label>
                    <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                      <option value="">Select a source type...</option>
                      <option value="Academic Papers">Academic Papers (e.g., Nature)</option>
                      <option value="Existing Newsletters">Existing Newsletters (e.g., Lenny's Newsletter)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">Text Output Length</label>
                    <select value={textLength} onChange={(e) => setTextLength(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                      <option value="">Select length...</option>
                      <option value="Short (5 pages with Detailed Paragraphs)">Short (5 pages with Detailed Paragraphs)</option>
                      <option value="Short (5 Pages with Quick Sentences)">Short (5 Pages with Quick Sentences)</option>
                      <option value="Full Chapter">Full Chapter (30 pages)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">Scroll Direction</label>
                    <select value={scrollDirection} onChange={(e) => setScrollDirection(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                      <option value="">Select a direction...</option>
                      <option value="sidescroll">Side Scroll</option>
                      <option value="downscroll">Down Scroll</option>
                    </select>
                </div>
            </div>
            {errorMessage && <p className="text-red-500 text-center mt-4">{errorMessage}</p>}
            <button onClick={generateSummary} className="w-full mt-8 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105">
                Generate Summary
            </button>
          </div>
        );
      case 4:
        return (
          <div className="w-full max-w-2xl mx-auto bg-gray-800 text-white p-8 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Generated Text Summary</h2>
            <p className="bg-gray-900 text-gray-200 p-6 rounded-lg mb-6 text-left">{summary}</p>
            {errorMessage && <p className="text-red-500 text-center mb-4">{errorMessage}</p>}
            <button onClick={generateStorybook} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105">
              Generate {textLength === 'Full Chapter' ? '30-page' : '5-page'} Storybook
            </button>
          </div>
        );
      case 5:
        const scrollClasses = scrollDirection === 'sidescroll' 
          ? 'flex overflow-x-auto space-x-6 p-4 rounded-xl' 
          : 'flex flex-col space-y-6 p-4 rounded-xl';
        
        return (
          <div className="w-full">
            <h2 className="text-3xl font-bold mb-2 text-center text-white">Your Story: {topic}</h2>
            <p className="text-center text-gray-300 mb-6">
                {scrollDirection === 'sidescroll' ? 'Scroll horizontally to view your comic book.' : 'Scroll down to view your comic book.'}
            </p>
            <div className={`${scrollClasses} bg-gray-900/20 backdrop-blur-sm`}>
              {storybook.map((page, index) => (
                <div 
                  key={page.id || index} 
                  className={`bg-white rounded-lg shadow-2xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-blue-300 ${scrollDirection === 'sidescroll' ? 'flex-shrink-0 w-80 md:w-96' : 'w-full'}`}
                >
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                        {page.imageLoading ? <Spinner /> : <img src={page.imageUrl || ''} alt={page.title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-800">{index + 1}. {page.title}</h3>
                        <p className="text-gray-600 mt-2 text-sm">{page.content}</p>
                    </div>
                </div>
              ))}
            </div>
             <button onClick={() => { setStep(1); setTopic(''); setProficiency(''); setSource(''); setStorybook([]); }} className="block mx-auto mt-8 bg-gray-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
              Start Over
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen font-sans flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <div className="w-full max-w-5xl">
        {step !== 5 && <h1 className="text-4xl font-bold text-center mb-8">Interactive Story Generator</h1>}
        {renderStep()}
      </div>
    </div>
  );
};

export default App;