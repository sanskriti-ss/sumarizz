'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { BookOpen, BarChart3, Clock, GitCompare } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { StoryType, StoryConfig } from '@/types'

const configSchema = z.object({
  storyType: z.enum(['explainer', 'claim_evidence', 'timeline', 'comparison']),
  claimCount: z.number().min(3).max(10).optional(),
  includeFigures: z.boolean().optional(),
  includeGlossary: z.boolean().optional(),
  tone: z.enum(['neutral', 'teaching']).optional(),
})

type ConfigFormData = z.infer<typeof configSchema>

const storyTypes = [
  {
    id: 'explainer' as StoryType,
    name: 'Explainer Story',
    description: 'Break down complex concepts into digestible sections',
    icon: BookOpen,
    example: 'Introduction → Methodology → Key Findings → Implications'
  },
  {
    id: 'claim_evidence' as StoryType,
    name: 'Claim-Evidence Analysis',
    description: 'Present key claims with supporting evidence and confidence scores',
    icon: BarChart3,
    example: 'Claim: "Method improves accuracy by 12%" | Evidence: "Study of 10M samples"'
  },
  {
    id: 'timeline' as StoryType,
    name: 'Timeline Visualization',
    description: 'Show research progression and key milestones chronologically',
    icon: Clock,
    example: '2020: Initial Development → 2023: Validation → 2024: Publication'
  },
  {
    id: 'comparison' as StoryType,
    name: 'Comparison Table',
    description: 'Compare different methods, approaches, or results side-by-side',
    icon: GitCompare,
    example: 'Traditional vs New Method: Accuracy, Speed, Scalability'
  }
]

export default function ConfigurePage() {
  const router = useRouter()
  const { paper, enrichmentSnippets, setConfig, setCurrentStep } = useProjectStore()
  const [selectedType, setSelectedType] = useState<StoryType>('explainer')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isValid }
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      storyType: 'explainer',
      claimCount: 5,
      includeFigures: true,
      includeGlossary: true,
      tone: 'neutral'
    }
  })

  const watchedValues = watch()

  if (!paper || enrichmentSnippets.length === 0) {
    router.push('/new')
    return null
  }

  const includedSnippets = enrichmentSnippets.filter(s => s.included)

  const onSubmit = (data: ConfigFormData) => {
    const config: StoryConfig = {
      storyType: data.storyType,
      options: {
        claimCount: data.claimCount,
        includeFigures: data.includeFigures,
        includeGlossary: data.includeGlossary,
        tone: data.tone
      }
    }

    setConfig(config)
    setCurrentStep('preview')
    router.push('/preview')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configure Story
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Choose your story type and customize the generation options
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Story Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Story Type</CardTitle>
              <CardDescription>
                Select how you want to present your research findings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedType}
                onValueChange={(value) => {
                  setSelectedType(value as StoryType)
                  setValue('storyType', value as StoryType)
                }}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  {storyTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <div key={type.id}>
                        <Label
                          htmlFor={type.id}
                          className="cursor-pointer"
                        >
                          <div className={`border-2 rounded-lg p-4 transition-all ${
                            selectedType === type.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="flex items-start gap-3">
                              <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon className="h-5 w-5 text-blue-600" />
                                  <h3 className="font-semibold">{type.name}</h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                  {type.description}
                                </p>
                                <p className="text-xs text-gray-500 italic">
                                  {type.example}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Story Options */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Options</CardTitle>
              <CardDescription>
                Customize how your story will be generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Claim Count - only for claim_evidence */}
              {selectedType === 'claim_evidence' && (
                <div className="space-y-3">
                  <Label>Number of Claims: {watchedValues.claimCount}</Label>
                  <Slider
                    value={[watchedValues.claimCount || 5]}
                    onValueChange={(value) => setValue('claimCount', value[0])}
                    min={3}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500">
                    How many key claims to extract from your research
                  </p>
                </div>
              )}

              {/* Include Figures */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Include Figure References</Label>
                  <p className="text-sm text-gray-500">
                    Reference figures and charts in the generated story
                  </p>
                </div>
                <Switch
                  checked={watchedValues.includeFigures}
                  onCheckedChange={(checked) => setValue('includeFigures', checked)}
                />
              </div>

              {/* Include Glossary - only for explainer and claim_evidence */}
              {(selectedType === 'explainer' || selectedType === 'claim_evidence') && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Glossary</Label>
                    <p className="text-sm text-gray-500">
                      Add definitions for technical terms
                    </p>
                  </div>
                  <Switch
                    checked={watchedValues.includeGlossary}
                    onCheckedChange={(checked) => setValue('includeGlossary', checked)}
                  />
                </div>
              )}

              {/* Tone */}
              <div className="space-y-3">
                <Label>Tone & Style</Label>
                <RadioGroup
                  value={watchedValues.tone}
                  onValueChange={(value) => setValue('tone', value as 'neutral' | 'teaching')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="neutral" id="neutral" />
                    <Label htmlFor="neutral">Neutral & Scientific</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="teaching" id="teaching" />
                    <Label htmlFor="teaching">Educational & Accessible</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Context Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Context Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Paper:</strong> {paper.title || 'Untitled'}</p>
                <p><strong>Context Snippets:</strong> {includedSnippets.length} selected</p>
                <p><strong>Story Type:</strong> {storyTypes.find(t => t.id === selectedType)?.name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="flex justify-between items-center">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
            >
              ← Back to Enrichment
            </Button>
            
            <Button 
              type="submit"
              disabled={!isValid}
              size="lg"
            >
              Generate Story →
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
