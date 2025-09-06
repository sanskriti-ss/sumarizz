import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_MAX = 10; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds

function getRateLimitStatus(identifier: string) {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    // Create or reset the record
    const newRecord = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(identifier, newRecord);
    return { success: true, count: 1, remaining: RATE_LIMIT_MAX - 1, resetTime: newRecord.resetTime };
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return { success: false, count: record.count, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { success: true, count: record.count, remaining: RATE_LIMIT_MAX - record.count, resetTime: record.resetTime };
}

function getClientIP(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (remoteAddr) {
    return remoteAddr;
  }
  
  return 'anonymous';
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const identifier = getClientIP(request);
    const rateLimitResult = getRateLimitStatus(identifier);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`,
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Get API key from server-side environment
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_API_KEY is not configured in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { topic, proficiency, source, type = 'summary', pageCount = 5 } = body;

    // Validate required fields
    if (!topic || !proficiency || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, proficiency, and source are required' },
        { status: 400 }
      );
    }

    // Prepare API request based on type
    let systemPrompt = '';
    let userQuery = '';

    if (type === 'summary') {
      systemPrompt = `You are an expert researcher. Your task is to provide a concise, single-paragraph summary of a topic based on a specified source and for a specific audience.`;
      userQuery = `Identify the core concepts about "${topic}". Generate a text summary explaining these concepts and theories for a ${proficiency} level audience, assuming the information comes from a ${source}.`;
    } else if (type === 'storybook') {
      systemPrompt = `You are a creative educational content creator. Create engaging, age-appropriate storybook pages that explain concepts in a narrative format. IMPORTANT: Respond with ONLY valid JSON, no additional text or formatting.`;
      userQuery = `Create a storybook about "${topic}" for a ${proficiency} level audience. Generate exactly ${pageCount} pages, each with a title, content (2-3 sentences), and a brief image description. Return ONLY this JSON structure with no additional text: {"pages": [{"id": 1, "title": "Page Title", "content": "Page content", "imageDescription": "Description for image generation"}]}`;
    } else {
      return NextResponse.json(
        { error: 'Invalid content type. Must be "summary" or "storybook"' },
        { status: 400 }
      );
    }

    // Make request to Google AI API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{ 
        parts: [{ text: `${systemPrompt}\n\n${userQuery}` }] 
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: type === 'storybook' && pageCount > 10 ? 8192 : 2048,
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate content', details: response.status },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    // Extract content from response
    const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedContent) {
      console.error('No content generated:', data);
      return NextResponse.json(
        { error: 'No content was generated' },
        { status: 500 }
      );
    }

    // For storybook content, validate and clean JSON
    let finalContent = generatedContent;
    if (type === 'storybook') {
      try {
        // Clean the content - remove markdown formatting if present
        let cleanedContent = generatedContent.trim();
        
        // Remove markdown code blocks if present
        const jsonMatch = cleanedContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          cleanedContent = jsonMatch[1];
        }
        
        // Validate that it's proper JSON
        const parsed = JSON.parse(cleanedContent);
        
        // Ensure it has the expected structure
        if (!parsed.pages || !Array.isArray(parsed.pages)) {
          throw new Error('Invalid structure - missing pages array');
        }
        
        finalContent = cleanedContent;
      } catch (jsonError) {
        console.error('JSON validation error:', jsonError);
        console.log('Raw content:', generatedContent);
        return NextResponse.json(
          { 
            error: 'Generated content is not valid JSON', 
            details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error'
          },
          { status: 500 }
        );
      }
    }

    // Return the generated content
    return NextResponse.json({
      success: true,
      content: finalContent,
      type: type,
      remainingRequests: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime
    }, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      }
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
