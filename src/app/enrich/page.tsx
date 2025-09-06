'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { RefreshCw, CheckCircle2, Circle, Globe } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { EnrichmentSnippet } from '@/types'

export default function EnrichPage() {
  const router = useRouter()
  const { 
    paper, 
    enrichmentSnippets, 
    setEnrichmentSnippets, 
    toggleSnippetIncluded, 
    setCurrentStep 
  } = useProjectStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (!paper) {
      router.push('/new')
      return
    }

    if (!hasLoaded) {
      fetchEnrichments()
    }
  }, [paper, hasLoaded])

  const fetchEnrichments = async () => {
    if (!paper) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: paper.summary,
          doi: paper.doi,
          url: paper.url,
          maxSnippets: 6
        })
      })

      const data = await response.json()
      setEnrichmentSnippets(data.snippets)
      setHasLoaded(true)
    } catch (error) {
      console.error('Failed to fetch enrichments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const reRoll = () => {
    setHasLoaded(false)
    fetchEnrichments()
  }

  const selectAll = () => {
    const updatedSnippets = enrichmentSnippets.map(snippet => ({ 
      ...snippet, 
      included: true 
    }))
    setEnrichmentSnippets(updatedSnippets)
  }

  const selectNone = () => {
    const updatedSnippets = enrichmentSnippets.map(snippet => ({ 
      ...snippet, 
      included: false 
    }))
    setEnrichmentSnippets(updatedSnippets)
  }

  const handleContinue = () => {
    setCurrentStep('configure')
    router.push('/configure')
  }

  const includedCount = enrichmentSnippets.filter(s => s.included).length

  if (!paper) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Enrich Content
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review and curate AI-suggested context snippets for your story
          </p>
        </div>

        {/* Paper Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Your Paper</CardTitle>
            <CardDescription>
              {paper.title || 'Untitled Paper'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
              {paper.summary.substring(0, 300)}...
            </p>
            {paper.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {paper.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={reRoll}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Re-roll Suggestions
                </Button>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={selectNone}>
                    Select None
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-300">
                {includedCount} of {enrichmentSnippets.length} selected
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Snippets Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))
          ) : (
            enrichmentSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onToggle={() => toggleSnippetIncluded(snippet.id)}
              />
            ))
          )}
        </div>

        {/* Continue Button */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {includedCount > 0 ? (
              <p>Great! You've selected {includedCount} context snippets.</p>
            ) : (
              <p>Select at least one snippet to continue.</p>
            )}
          </div>
          
          <Button 
            onClick={handleContinue}
            disabled={includedCount === 0}
            size="lg"
          >
            Continue to Configuration →
          </Button>
        </div>
      </div>
    </div>
  )
}

interface SnippetCardProps {
  snippet: EnrichmentSnippet
  onToggle: () => void
}

function SnippetCard({ snippet, onToggle }: SnippetCardProps) {
  return (
    <Card className={`transition-all ${snippet.included ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base line-clamp-2">
              {snippet.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Globe className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-500">{snippet.source}</span>
              {snippet.publishedAt && (
                <span className="text-sm text-gray-400">
                  • {new Date(snippet.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Switch
              checked={snippet.included}
              onCheckedChange={onToggle}
            />
            {snippet.included ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
          {snippet.excerpt}
        </p>
      </CardContent>
    </Card>
  )
}
