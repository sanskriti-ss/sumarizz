'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Sparkles, BookOpen } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
              Sumarizz
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform Nature paper summaries into interactive Storybook stories for frontend developers and designers
          </p>
        </header>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 mb-12">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Import Summary</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Paste your Nature paper summary with optional DOI and tags
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Enhancement</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Get contextual snippets and configure your story type
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Export Storybook</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Download ready-to-use MDX and CSF files for Storybook
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link href="/new">
                <Button size="lg" className="px-8 py-3 text-lg">
                  Create New Project
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-3">Story Types</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Explainer stories with sections</li>
                <li>• Claim-Evidence analysis</li>
                <li>• Timeline visualization</li>
                <li>• Comparison tables</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-3">Output Formats</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Storybook MDX files</li>
                <li>• Component Story Format (CSF)</li>
                <li>• Complete project scaffold</li>
                <li>• Ready-to-run setup</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
