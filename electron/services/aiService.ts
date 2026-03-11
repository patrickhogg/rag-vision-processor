import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import sharp from 'sharp';

export type AIProvider = 'google' | 'openai';

export interface AIServiceOptions {
  provider: AIProvider;
  apiKey: string;
  model: string;
  imagePath: string;
  schemaDefinition: Record<string, any>;
  prompt: string;
}

/**
 * Dynamically creates a Zod schema from a deeply nested definition.
 */
function createZodSchema(definition: any): z.ZodType<any> {
  if (typeof definition === 'string') {
    if (definition === 'string') return z.string();
    if (definition === 'number') return z.number();
    if (definition === 'boolean') return z.boolean();
    return z.string(); // fallback for unknown strings
  }
  
  if (Array.isArray(definition)) {
    if (definition.length > 0) {
      return z.array(createZodSchema(definition[0]));
    }
    return z.array(z.any());
  }
  
  if (typeof definition === 'object' && definition !== null) {
    const shape: Record<string, z.ZodType<any>> = {};
    for (const [key, val] of Object.entries(definition)) {
      shape[key] = createZodSchema(val);
    }
    return z.object(shape);
  }
  
  return z.string(); // fallback
}

export const analyzeImage = async (options: AIServiceOptions) => {
  const { provider, apiKey, model, imagePath, schemaDefinition, prompt } = options;

  let aiModel;
  if (provider === 'google') {
    const google = createGoogleGenerativeAI({ apiKey });
    aiModel = google(model);
  } else {
    const openai = createOpenAI({ apiKey });
    aiModel = openai(model);
  }

  // Ensure image sent to AI is never larger than 800x800 to save bandwidth and tokens (maintains aspect ratio)
  const imageBuffer = await sharp(imagePath)
    .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
    .toBuffer();

  const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  const schema = createZodSchema(schemaDefinition);

  const { object } = await generateObject({
    model: aiModel,
    schema,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image', image: imageBuffer, mimeType },
        ],
      } as any,
    ],
  });

  return object;
};
