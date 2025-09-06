import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Simple in-memory rate limiting for image generation (more restrictive)
const imageRateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration for images (more restrictive due to cost)
const IMAGE_RATE_LIMIT_MAX = 35; // requests per window
const IMAGE_RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds

function getImageRateLimitStatus(identifier: string) {
  const now = Date.now();
  const record = imageRateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    const newRecord = { count: 1, resetTime: now + IMAGE_RATE_LIMIT_WINDOW };
    imageRateLimitMap.set(identifier, newRecord);
    return { success: true, count: 1, remaining: IMAGE_RATE_LIMIT_MAX - 1, resetTime: newRecord.resetTime };
  }
  
  if (record.count >= IMAGE_RATE_LIMIT_MAX) {
    return { success: false, count: record.count, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { success: true, count: record.count, remaining: IMAGE_RATE_LIMIT_MAX - record.count, resetTime: record.resetTime };
}

function getClientIP(request: NextRequest): string {
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
    // Apply rate limiting (more restrictive for images)
    const identifier = getClientIP(request);
    const rateLimitResult = getImageRateLimitStatus(identifier);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Too many image requests. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`,
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': IMAGE_RATE_LIMIT_MAX.toString(),
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
    const { prompt, pageId } = body;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      );
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    // Enhanced prompt for better storybook-style images
    const enhancedPrompt = `Create a high-quality, vibrant, storybook-style illustration for adults or researchers. ${prompt}. The image should be colorful, engaging, and suitable for educational content. Style: digital art, clean lines, bright colors, child-friendly.`;

    try {
      // Try to use Gemini's multimodal capabilities for image generation
      // Note: This uses a text-to-image approach with Gemini
      
      const imageGenerationPrompt = `Generate an image: ${enhancedPrompt}`;
      
      // Attempt to generate content that might include image data
      const response = await model.generateContent([
        {
          text: imageGenerationPrompt
        }
      ]);
      
      const result = await response.response;
      
      // Check if the response contains image data
      let imageData = null;
      if (result.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
              imageData = part.inlineData.data;
              break;
            }
          }
        }
      }
      
      if (imageData) {
        // Successfully generated image
        const imageUrl = `data:image/png;base64,${imageData}`;
        
        return NextResponse.json({
          success: true,
          imageUrl: imageUrl,
          pageId: pageId,
          remainingRequests: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          note: 'Generated with Gemini AI'
        }, {
          headers: {
            'X-RateLimit-Limit': IMAGE_RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        });
      } else {
        // No image generated, create enhanced description instead
        const description = result.text();
        console.log('Generated image description:', description);
        
        // Use a more sophisticated placeholder generation
        const seed = Math.abs(prompt.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0));
        const imageUrl = `https://picsum.photos/seed/${seed}/400/300`;

        return NextResponse.json({
          success: true,
          imageUrl: imageUrl,
          pageId: pageId,
          description: description,
          remainingRequests: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          note: 'Enhanced placeholder with AI-generated description'
        }, {
          headers: {
            'X-RateLimit-Limit': IMAGE_RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        });
      }

    } catch (geminiError) {
      console.error('Gemini image generation error:', geminiError);
      
      // Fallback to placeholder image
      const placeholderUrl = `https://picsum.photos/400/300?random=${Date.now()}`;
      
      return NextResponse.json({
        success: true,
        imageUrl: placeholderUrl,
        pageId: pageId,
        remainingRequests: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
        note: 'Using placeholder due to generation error'
      }, {
        headers: {
          'X-RateLimit-Limit': IMAGE_RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      });
    }

  } catch (error) {
    console.error('Image generation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
