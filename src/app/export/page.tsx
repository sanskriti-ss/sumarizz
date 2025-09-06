'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, FileText, CheckCircle2, Package, ExternalLink } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'

export default function ExportPage() {
  const router = useRouter()
  const { paper, story } = useProjectStore()
  
  const [selectedFormats, setSelectedFormats] = useState<('mdx' | 'csf')[]>(['mdx', 'csf'])
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{
    zipUrl: string
    files: { path: string; content: string }[]
  } | null>(null)

  if (!paper || !story) {
    router.push('/new')
    return null
  }

  const handleFormatChange = (format: 'mdx' | 'csf', checked: boolean) => {
    if (checked) {
      setSelectedFormats([...selectedFormats, format])
    } else {
      setSelectedFormats(selectedFormats.filter(f => f !== format))
    }
  }

  const handleExport = async () => {
    if (selectedFormats.length === 0) return

    setIsExporting(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          formats: selectedFormats
        })
      })

      const data = await response.json()
      setExportResult(data)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const downloadZip = () => {
    if (!exportResult) return
    
    // In a real implementation, this would download the actual zip file
    // For demo purposes, we'll create a simple text file with the story content
    const blob = new Blob([JSON.stringify(exportResult.files, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${paper.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'storybook'}_export.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const startNewProject = () => {
    useProjectStore.getState().resetProject()
    router.push('/new')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Export Storybook
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Generate and download your Storybook files
          </p>
        </div>

        {!exportResult ? (
          <div className="space-y-6">
            {/* Story Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Story Summary</CardTitle>
                <CardDescription>
                  Review what will be exported
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Paper Details</h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <p><strong>Title:</strong> {paper.title || 'Untitled'}</p>
                      <p><strong>Type:</strong> {story.storyType}</p>
                      <p><strong>Context Sources:</strong> {story.snippets.length}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Story Content</h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      {story.storyType === 'explainer' && (
                        <p><strong>Sections:</strong> {(story as any).sections?.length || 0}</p>
                      )}
                      {story.storyType === 'claim_evidence' && (
                        <p><strong>Claims:</strong> {(story as any).claims?.length || 0}</p>
                      )}
                      {story.storyType === 'timeline' && (
                        <p><strong>Events:</strong> {(story as any).events?.length || 0}</p>
                      )}
                      {story.storyType === 'comparison' && (
                        <p><strong>Items:</strong> {(story as any).items?.length || 0}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Formats</CardTitle>
                <CardDescription>
                  Choose which Storybook formats to include
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mdx"
                      checked={selectedFormats.includes('mdx')}
                      onCheckedChange={(checked) => handleFormatChange('mdx', checked as boolean)}
                    />
                    <label htmlFor="mdx" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">MDX Stories</span>
                        <Badge variant="secondary">Recommended</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Markdown-based stories with embedded components
                      </p>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="csf"
                      checked={selectedFormats.includes('csf')}
                      onCheckedChange={(checked) => handleFormatChange('csf', checked as boolean)}
                    />
                    <label htmlFor="csf" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span className="font-medium">Component Story Format (CSF)</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        TypeScript/JavaScript story definitions
                      </p>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Ready to Export</h4>
                    <p className="text-sm text-gray-500">
                      {selectedFormats.length > 0 
                        ? `Selected: ${selectedFormats.join(', ').toUpperCase()}`
                        : 'Please select at least one format'
                      }
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleExport}
                    disabled={selectedFormats.length === 0 || isExporting}
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Generate Export
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Export Success */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-green-600">Export Complete!</CardTitle>
                </div>
                <CardDescription>
                  Your Storybook files are ready for download
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Generated Files</h4>
                    <div className="space-y-1">
                      {exportResult.files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-mono">{file.path}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={downloadZip} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download Files
                    </Button>
                    
                    <Button variant="outline" asChild>
                      <a 
                        href="https://storybook.js.org/docs/get-started/install" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Storybook Setup Guide
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <p>Extract the downloaded files to your project directory</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <p>Install Storybook in your project: <code className="bg-gray-100 px-1 rounded">npx storybook@latest init</code></p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <p>Copy the generated files to your <code className="bg-gray-100 px-1 rounded">stories/</code> directory</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <p>Run Storybook: <code className="bg-gray-100 px-1 rounded">npm run storybook</code></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => router.push('/preview')}>
                ← Back to Preview
              </Button>
              
              <Button onClick={startNewProject}>
                Create New Project
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
