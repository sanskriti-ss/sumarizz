'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { PaperSummary } from '@/types'

const paperSchema = z.object({
  title: z.string().optional(),
  summary: z.string().min(400, 'Summary must be at least 400 characters'),
  doi: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
})

type PaperFormData = z.infer<typeof paperSchema>

export default function NewProjectPage() {
  const router = useRouter()
  const { setPaper, setCurrentStep } = useProjectStore()
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<PaperFormData>({
    resolver: zodResolver(paperSchema),
    mode: 'onChange'
  })

  const summaryValue = watch('summary') || ''
  const charCount = summaryValue.length

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const onSubmit = (data: PaperFormData) => {
    const paper: PaperSummary = {
      id: crypto.randomUUID(),
      title: data.title,
      summary: data.summary,
      doi: data.doi,
      url: data.url || undefined,
      tags
    }
    
    setPaper(paper)
    setCurrentStep('enrich')
    router.push('/enrich')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            New Project
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Paste your Nature paper summary to begin creating an interactive story
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Paper Summary</CardTitle>
            <CardDescription>
              Provide the summary and optional metadata for your Nature paper
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="Enter a custom title for your project"
                  {...register('title')}
                />
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Label htmlFor="summary">
                  Paper Summary *
                  <span className="text-sm text-gray-500 ml-2">
                    ({charCount}/400 minimum)
                  </span>
                </Label>
                <Textarea
                  id="summary"
                  placeholder="Paste your Nature paper summary here. Make sure it's at least 400 characters for better AI enhancement..."
                  className="min-h-[200px]"
                  {...register('summary')}
                />
                {errors.summary && (
                  <p className="text-sm text-red-600">{errors.summary.message}</p>
                )}
              </div>

              {/* DOI */}
              <div className="space-y-2">
                <Label htmlFor="doi">DOI (Optional)</Label>
                <Input
                  id="doi"
                  placeholder="10.1038/..."
                  {...register('doi')}
                />
              </div>

              {/* URL */}
              <div className="space-y-2">
                <Label htmlFor="url">Paper URL (Optional)</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  {...register('url')}
                />
                {errors.url && (
                  <p className="text-sm text-red-600">{errors.url.message}</p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag (e.g., genomics, AI, climate)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="pr-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {!isValid && charCount < 400 && (
                    <p>Please provide a summary of at least 400 characters</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  disabled={!isValid}
                  size="lg"
                >
                  Continue to Enhancement →
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Tips for Better Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Include the main findings and methodology in your summary</li>
              <li>• Add relevant tags to help with context enhancement</li>
              <li>• Provide DOI or URL if available for better enrichment</li>
              <li>• Longer summaries (500+ characters) work best</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
