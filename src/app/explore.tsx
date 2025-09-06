"use client";
import React, { useState, useEffect } from 'react';
import { useBookshelfStore, type StoryPage, type BookshelfItem, clearCorruptedStorage } from '../store/bookshelfStore';
import { useSessionStore } from '../store/sessionStore';

// Types are now imported from the store
// Spinner Component for loading states
const Spinner = () => (
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
);

// Main App Component
const App = () => {
  const [topic, setTopic] = useState('');
  const [proficiency, setProficiency] = useState('Beginner');
  const [source, setSource] = useState('Academic Papers');
  const [textLength, setTextLength] = useState('Short (5 Pages with Quick Sentences)');
  const [scrollDirection, setScrollDirection] = useState('sidescroll');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [viewingBookId, setViewingBookId] = useState<number | null>(null);

  // Use Zustand stores
  const { bookshelf, addBook, removeBook, getBook, updateBookImages } = useBookshelfStore();
  const { 
    currentStorybook: storybook, 
    currentTopic: sessionTopic,
    currentSummary: sessionSummary,
    currentStep: step,
    setCurrentStorybook: setStorybook,
    setCurrentTopic: setSessionTopic,
    setCurrentSummary: setSessionSummary,
    setCurrentStep: setStep,
    updatePageImage,
    clearSession
  } = useSessionStore();

  // Sync local state with session store and update session store when local state changes
  useEffect(() => {
    if (sessionTopic) setTopic(sessionTopic);
    if (sessionSummary) setSummary(sessionSummary);
  }, [sessionTopic, sessionSummary]);

  // Update session store when topic or summary changes
  useEffect(() => {
    setSessionTopic(topic);
  }, [topic, setSessionTopic]);

  useEffect(() => {
    setSessionSummary(summary);
  }, [summary, setSessionSummary]);

  useEffect(() => {
    setStep(step);
  }, [step, setStep]);

  // Color palette for bookshelf
  const bookshelfColors = [
    '#0a174e', // dark blue
    '#1a237e', // indigo
    '#311b92', // deep purple
    '#283593', // blue
    '#512da8', // purple
    '#2c2c54', // dark indigo
    '#3f51b5', // blue
    '#4a148c', // purple
    '#120136', // very dark blue
    '#2d0b4a', // very dark purple
  ];

  // Reset error message whenever the step changes
  useEffect(() => {
    setErrorMessage('');
  }, [step]);

  // Initialize and handle corrupted storage
  useEffect(() => {
    try {
      // Test if we can access localStorage
      localStorage.getItem('test');
    } catch (error) {
      console.warn('localStorage issue detected, clearing corrupted data');
      clearCorruptedStorage();
    }
  }, []);

  const generateSummary = async () => {
    if (!proficiency || !source || !textLength || !scrollDirection) {
      setErrorMessage("Please select all options.");
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setStep(3); // Move to loading step

    // Add a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds

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
        signal: controller.signal
      });
      clearTimeout(timeoutId);

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
        // Clean summary of unwanted instructional/meta text
        let cleanedSummary = data.content;
        cleanedSummary = cleanedSummary.replace(/Generated Text Summary.*\n?/i, '');
        cleanedSummary = cleanedSummary.replace(/Okay, I\'m ready\..*\n?/i, '');
        cleanedSummary = cleanedSummary.replace(/\d+\. \*\*.*\*\*.*\n?/g, '');
        cleanedSummary = cleanedSummary.replace(/Once you provide this, I will deliver.*\n?/i, '');
        cleanedSummary = cleanedSummary.trim();
        setSummary(cleanedSummary);
        setStep(4);
      } else {
        throw new Error("Invalid response from API");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setErrorMessage('Request timed out. Please try again.');
      } else {
        console.error("Summary generation failed:", error);
        setErrorMessage("Failed to generate summary. Please try again.");
      }
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
    let pageCount;
    if (textLength === 'Full Chapter') {
      pageCount = 30;
    } else if (textLength === 'Medium (11 pages)') {
      pageCount = 11;
    } else {
      pageCount = 5; // Default for both short options
    }

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
        updatePageImage(pageId, data.imageUrl);
      } else {
        throw new Error("Invalid response from image API");
      }
    } catch (error) {
      console.error(`Failed to generate image for page ${pageId}:`, error);
      // Set a placeholder on failure
      updatePageImage(pageId, `https://placehold.co/600x400/FF0000/FFFFFF?text=Image+Failed`);
    }
  };

  // Save Story handler
  const saveStory = () => {
    addBook({
      topic: topic,
      summary: summary,
      storybook: storybook
    });
    
    // Clear session and reset to initial state
    clearSession();
    setStep(1);
    setTopic('');
    setProficiency('Beginner');
    setSource('Academic Papers');
    setTextLength('Short (5 Pages with Quick Sentences)');
    setScrollDirection('sidescroll');
    setSummary('');
  };

  // Regenerate images for a saved book
  const regenerateBookImages = async (bookId: number) => {
    const book = getBook(bookId);
    if (!book) return;

    // First, mark all pages as loading
    const updatedStorybook = book.storybook.map(page => ({
      ...page,
      imageLoading: true,
      imageUrl: null
    }));
    updateBookImages(bookId, updatedStorybook);

    // Generate images for each page
    for (const page of book.storybook) {
      try {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: page.content,
            pageId: page.id
          }),
        });

        const data = await response.json();

        if (response.ok && data.success && data.imageUrl) {
          // Update the specific page in the book
          const currentBook = getBook(bookId);
          if (currentBook) {
            const newStorybook = currentBook.storybook.map(p =>
              p.id === page.id ? { ...p, imageUrl: data.imageUrl, imageLoading: false } : p
            );
            updateBookImages(bookId, newStorybook);
          }
        } else {
          // Handle failure
          const currentBook = getBook(bookId);
          if (currentBook) {
            const newStorybook = currentBook.storybook.map(p =>
              p.id === page.id ? { 
                ...p, 
                imageUrl: `https://placehold.co/600x400/FF0000/FFFFFF?text=Image+Failed`, 
                imageLoading: false 
              } : p
            );
            updateBookImages(bookId, newStorybook);
          }
        }
      } catch (error) {
        console.error(`Failed to generate image for page ${page.id}:`, error);
        // Handle error case
        const currentBook = getBook(bookId);
        if (currentBook) {
          const newStorybook = currentBook.storybook.map(p =>
            p.id === page.id ? { 
              ...p, 
              imageUrl: `https://placehold.co/600x400/FF0000/FFFFFF?text=Image+Failed`, 
              imageLoading: false 
            } : p
          );
          updateBookImages(bookId, newStorybook);
        }
      }
    }
  };

  // Bookshelf click handler
  const openBook = (id: number) => {
    setViewingBookId(id);
    setStep(6);
  };

  // --- Render Logic ---
  const renderBookshelf = () => (
    <div className="flex flex-row space-x-4 mt-8 justify-center">
      {bookshelf.map(book => (
        <div
          key={book.id}
          className="bg-indigo-700 hover:bg-indigo-900 text-white rounded-lg shadow-lg cursor-pointer flex items-center justify-center h-24 w-8 text-xs font-bold"
          title={book.topic}
          onClick={() => openBook(book.id)}
        >
          {book.topic.slice(0, 15)}
        </div>
      ))}
    </div>
  );

  const renderBookshelfCard = () => (
    <div className="relative bg-gray-900/40 backdrop-blur-sm rounded-xl p-6 shadow-2xl overflow-hidden h-full flex flex-col justify-center">
      <div className="absolute inset-0 z-0">
        <div className="h-full w-full bg-gradient-to-t from-gray-900/60 to-transparent"></div>
      </div>
      <div className="relative z-10 mb-4">
        <h3 className="text-xl font-bold text-white text-center">
          Your Digital Bookshelf 
          {bookshelf.length > 0 && (
            <span className="text-blue-300"> ({bookshelf.length} {bookshelf.length === 1 ? 'story' : 'stories'})</span>
          )}
        </h3>
      </div>
      <div className="relative w-full h-64 flex-1 flex flex-col justify-center">
        {bookshelf.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4 relative z-10 items-center h-full">
            {bookshelf.map((book, idx) => (
              <div
                key={book.id}
                className="w-6 h-40 rounded-lg shadow-xl relative transform transition-transform hover:scale-105 cursor-pointer overflow-hidden group flex items-center justify-center"
                onClick={() => openBook(book.id)}
                title={book.topic}
                style={{ backgroundColor: bookshelfColors[idx % bookshelfColors.length] }}
              >
                {/* Top black band */}
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 0,
                    right: 0,
                    height: 8,
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: '4px',
                    zIndex: 2,
                  }}
                />
                {/* Bottom black band */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 0,
                    right: 0,
                    height: 8,
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: '4px',
                    zIndex: 2,
                  }}
                />
                <div className="flex items-center justify-center h-full w-full">
                  <span className="text-white text-xs font-semibold" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '0.05em' }}>
                    {book.topic.slice(0, 15)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-300 text-center relative z-10">
              Your bookshelf is empty. Create a story to fill it!
            </p>
          </div>
        )}
      </div>
    </div>
  );

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
          <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
            <div className="flex-1 flex items-stretch">
              <div className="w-full h-full flex flex-col justify-center">
                <div className="h-full">
                  {renderBookshelfCard()}
                </div>
              </div>
            </div>
            <div className="flex-1 w-full max-w-2xl mx-auto bg-gray-900 p-8 rounded-xl shadow-lg flex flex-col justify-center h-full">
              <h2 className="text-2xl font-bold mb-6 text-center text-white">What topic are you interested in?</h2>
              <form onSubmit={(e) => { e.preventDefault(); if (topic) setStep(2); }} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-gray-400"
                  placeholder="e.g., Quantum Computing, Stoic Philosophy..."
                />
                <button
                  type="submit"
                  disabled={!topic}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:bg-gray-700 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  Next
                </button>
              </form>
            </div>
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
                      <option value="Medium (11 pages)">Medium (11 pages)</option>
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
              Generate {textLength === 'Full Chapter' ? '30-page' : textLength === 'Medium (11 pages)' ? '11-page' : '5-page'} Storybook
            </button>
          </div>
        );
      case 5:
        const scrollClasses = scrollDirection === 'sidescroll' 
          ? 'flex overflow-x-auto space-x-6 p-4 rounded-xl' 
          : 'flex flex-col space-y-6 p-4 rounded-xl';
        const imageHeight = scrollDirection === 'sidescroll' ? 'h-64' : 'h-[32rem]'; // double height for vertical scroll
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
                    <div className={`w-full ${imageHeight} bg-gray-200 flex items-center justify-center`}>
                        {page.imageLoading ? <Spinner /> : <img src={page.imageUrl || ''} alt={page.title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-800">{index + 1}. {page.title}</h3>
                        <p className="text-gray-600 mt-2 text-sm">{page.content}</p>
                    </div>
                </div>
              ))}
            </div>
            <div className="flex flex-row justify-center gap-4 mt-8">
              <button onClick={() => { 
                clearSession();
                setStep(1); 
                setTopic(''); 
                setProficiency('Beginner'); 
                setSource('Academic Papers'); 
                setTextLength('Short (5 Pages with Quick Sentences)'); 
                setScrollDirection('sidescroll'); 
                setSummary('');
              }} className="bg-gray-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                Start Over
              </button>
              <button onClick={saveStory} className="bg-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Save Story
              </button>
            </div>
          </div>
        );
      case 6:
        // Viewing a saved book
        const book = getBook(viewingBookId!);
        if (!book) return null;
        return (
          <div className="w-full">
            <h2 className="text-3xl font-bold mb-2 text-center text-white">Your Story: {book.topic}</h2>
            <p className="text-center text-gray-300 mb-6">(Saved Story)</p>
            <div className={`${scrollDirection === 'sidescroll' ? 'flex overflow-x-auto space-x-6 p-4 rounded-xl' : 'flex flex-col space-y-6 p-4 rounded-xl'} bg-gray-900/20 backdrop-blur-sm`}>
              {book.storybook.map((page, index) => (
                <div 
                  key={page.id || index} 
                  className={`bg-white rounded-lg shadow-2xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-blue-300 ${scrollDirection === 'sidescroll' ? 'flex-shrink-0 w-80 md:w-96' : 'w-full'}`}
                >
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                        {page.imageLoading ? (
                          <Spinner />
                        ) : page.imageUrl ? (
                          <img src={page.imageUrl} alt={page.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <div className="text-4xl mb-2">📖</div>
                            <div className="text-sm">Saved Story</div>
                          </div>
                        )}
                    </div>
                    <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-800">{index + 1}. {page.title}</h3>
                        <p className="text-gray-600 mt-2 text-sm">{page.content}</p>
                    </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <button onClick={() => { setStep(1); setViewingBookId(null); }} className="bg-gray-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                Back to Home
              </button>
              <button 
                onClick={() => viewingBookId && regenerateBookImages(viewingBookId)} 
                className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Regenerate Images
              </button>
              <button 
                onClick={() => { 
                  if (viewingBookId) {
                    removeBook(viewingBookId);
                    setStep(1); 
                    setViewingBookId(null);
                  }
                }} 
                className="bg-red-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Delete Story
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen font-sans flex items-center justify-center p-4" style={{ backgroundImage: "url('https://wallpapers.com/images/hd/clear-view-of-blue-and-purple-galaxy-vqbu4jz7r0gwd616.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="w-full max-w-5xl">
        {step !== 5 && (
          <div className="w-full max-w-5xl mx-auto mb-8 bg-black/70 rounded-xl shadow-lg p-6">
            <h1 className="text-4xl font-bold text-center text-white">Learn anything. <br /> Generate your own comics for any topic.</h1>
          </div>
        )}
        {renderStep()}
      </div>
    </div>
  );
};

export default App;