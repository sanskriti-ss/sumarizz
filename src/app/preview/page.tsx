'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Edit3, Eye, Save, RotateCcw } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { StorySchema, ExplainerStory, ClaimEvidenceStory, TimelineStory, ComparisonStory, Claim } from '@/types'

export default function PreviewPage() {
  const router = useRouter()
  const { 
    paper, 
    enrichmentSnippets, 
    config, 
    story, 
    setStory, 
    setCurrentStep 
  } = useProjectStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (!paper || !config) {
      router.push('/new')
      return
    }

    if (!hasGenerated && !story) {
      generateStory()
    }
  }, [paper, config, hasGenerated, story])

  const generateStory = async () => {
    if (!paper || !config) return

    setIsLoading(true)
    try {
      const includedSnippets = enrichmentSnippets.filter(s => s.included)
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyType: config.storyType,
          paper,
          snippets: includedSnippets,
          options: config.options
        })
      })

      const data = await response.json()
      setStory(data.story)
      setHasGenerated(true)
    } catch (error) {
      console.error('Failed to generate story:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    setCurrentStep('export')
    router.push('/export')
  }

  const regenerateStory = () => {
    setHasGenerated(false)
    setStory(undefined)
    generateStory()
  }

  if (!paper || !config) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Story Preview
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review and edit your generated story before exporting
          </p>
        </div>

        {isLoading ? (
          <LoadingPreview />
        ) : story ? (
          <div className="space-y-6">
            {/* Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(!editMode)}
                      className="flex items-center gap-2"
                    >
                      {editMode ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                      {editMode ? 'Preview Mode' : 'Edit Mode'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={regenerateStory}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{config.storyType}</Badge>
                    <span className="text-sm text-gray-500">
                      {getStoryMetrics(story)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story Content */}
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <StoryRenderer story={story} editMode={editMode} onUpdate={setStory} />
              </div>
              
              <div className="space-y-4">
                <StoryMetadata story={story} />
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-between items-center">
              <Button 
                variant="outline"
                onClick={() => router.back()}
              >
                ← Back to Configuration
              </Button>
              
              <Button 
                onClick={handleContinue}
                size="lg"
              >
                Continue to Export →
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No story generated yet.</p>
            <Button onClick={generateStory} className="mt-4">
              Generate Story
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingPreview() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface StoryRendererProps {
  story: StorySchema
  editMode: boolean
  onUpdate: (story: StorySchema) => void
}

function StoryRenderer({ story, editMode, onUpdate }: StoryRendererProps) {
  switch (story.storyType) {
    case 'explainer':
      return <ExplainerRenderer story={story as ExplainerStory} editMode={editMode} onUpdate={onUpdate} />
    case 'claim_evidence':
      return <ClaimEvidenceRenderer story={story as ClaimEvidenceStory} editMode={editMode} onUpdate={onUpdate} />
    case 'timeline':
      return <TimelineRenderer story={story as TimelineStory} editMode={editMode} onUpdate={onUpdate} />
    case 'comparison':
      return <ComparisonRenderer story={story as ComparisonStory} editMode={editMode} onUpdate={onUpdate} />
    default:
      return <div>Unknown story type</div>
  }
}

function ExplainerRenderer({ story, editMode, onUpdate }: { story: ExplainerStory, editMode: boolean, onUpdate: (story: StorySchema) => void }) {
  const updateSection = (index: number, field: 'heading' | 'body', value: string) => {
    const newSections = [...story.sections]
    newSections[index] = { ...newSections[index], [field]: value }
    onUpdate({ ...story, sections: newSections })
  }

  return (
    <div className="space-y-6">
      {story.sections.map((section, index) => (
        <Card key={index}>
          <CardHeader>
            {editMode ? (
              <Input
                value={section.heading}
                onChange={(e) => updateSection(index, 'heading', e.target.value)}
                className="text-lg font-semibold"
              />
            ) : (
              <CardTitle>{section.heading}</CardTitle>
            )}
          </CardHeader>
          <CardContent>
            {editMode ? (
              <Textarea
                value={section.body}
                onChange={(e) => updateSection(index, 'body', e.target.value)}
                className="min-h-[100px]"
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {section.body}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ClaimEvidenceRenderer({ story, editMode, onUpdate }: { story: ClaimEvidenceStory, editMode: boolean, onUpdate: (story: StorySchema) => void }) {
  const updateClaim = (index: number, field: keyof Claim, value: any) => {
    const newClaims = [...story.claims]
    newClaims[index] = { ...newClaims[index], [field]: value }
    onUpdate({ ...story, claims: newClaims })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Key Claims</CardTitle>
          <CardDescription>
            Claims extracted from your research with supporting evidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {story.claims.map((claim, index) => (
              <div key={claim.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">Claim {index + 1}</h4>
                  <Badge variant="outline">
                    {Math.round((claim.confidence || 0) * 100)}% confidence
                  </Badge>
                </div>
                
                {editMode ? (
                  <div className="space-y-3">
                    <Textarea
                      value={claim.text}
                      onChange={(e) => updateClaim(index, 'text', e.target.value)}
                      placeholder="Claim text"
                    />
                    <Textarea
                      value={claim.evidence || ''}
                      onChange={(e) => updateClaim(index, 'evidence', e.target.value)}
                      placeholder="Supporting evidence"
                      className="min-h-[60px]"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-900 dark:text-gray-100">{claim.text}</p>
                    {claim.evidence && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Evidence:</strong> {claim.evidence}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {story.glossary && story.glossary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Glossary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {story.glossary.map((term, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-3">
                  <dt className="font-medium">{term.term}</dt>
                  <dd className="text-sm text-gray-600 dark:text-gray-400">{term.definition}</dd>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TimelineRenderer({ story }: { story: TimelineStory, editMode: boolean, onUpdate: (story: StorySchema) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Timeline</CardTitle>
        <CardDescription>
          Key milestones in the research development
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {story.events.map((event, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                {index < story.events.length - 1 && (
                  <div className="w-0.5 h-16 bg-gray-300 mt-2"></div>
                )}
              </div>
              <div className="flex-1 pb-8">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{event.label}</h4>
                  {event.date && (
                    <Badge variant="outline" className="text-xs">{event.date}</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{event.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ComparisonRenderer({ story }: { story: ComparisonStory, editMode: boolean, onUpdate: (story: StorySchema) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparison Analysis</CardTitle>
        <CardDescription>
          Side-by-side comparison of different approaches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-left font-medium">Method</th>
                {story.axes.map(axis => (
                  <th key={axis} className="border p-2 text-left font-medium">{axis}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {story.items.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2 font-medium">{item.name}</td>
                  {story.axes.map(axis => (
                    <td key={axis} className="border p-2">{item.values[axis] || '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function StoryMetadata({ story }: { story: StorySchema }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Story Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <span className="font-medium">Type:</span>
          <Badge variant="secondary" className="ml-2">{story.storyType}</Badge>
        </div>
        <div>
          <span className="font-medium">Context Sources:</span>
          <div className="mt-1 space-y-1">
            {story.snippets.map(snippet => (
              <div key={snippet.id} className="text-xs text-gray-500">
                • {snippet.source}
              </div>
            ))}
          </div>
        </div>
        <div>
          <span className="font-medium">Metrics:</span>
          <p className="text-xs text-gray-500 mt-1">{getStoryMetrics(story)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function getStoryMetrics(story: StorySchema): string {
  switch (story.storyType) {
    case 'explainer':
      return `${(story as ExplainerStory).sections.length} sections`
    case 'claim_evidence':
      return `${(story as ClaimEvidenceStory).claims.length} claims`
    case 'timeline':
      return `${(story as TimelineStory).events.length} events`
    case 'comparison':
      return `${(story as ComparisonStory).items.length} items compared`
    default:
      return 'Unknown metrics'
  }
}
