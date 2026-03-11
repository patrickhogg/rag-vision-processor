import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';

export interface SizeConfig {
  width: number;
  suffix?: string;
}

export interface ResizeResult {
  width: number;
  fileName: string;
  fullPath: string;
}

export const resizeImage = async (
  inputPath: string,
  outputDir: string,
  sizes: SizeConfig[],
  fileNameTemplate: string,
  outputFormat: 'original' | 'jpeg' | 'png' | 'webp' = 'original',
  quality: number = 70
): Promise<ResizeResult[]> => {
  const originalExt = path.extname(inputPath);
  const baseName = path.basename(inputPath, originalExt);
  const results: ResizeResult[] = [];

  await fs.mkdir(outputDir, { recursive: true });

  const pipeline = sharp(inputPath);
  
  // Determine final extension based on outputFormat
  let finalExt = originalExt;
  if (outputFormat === 'jpeg') finalExt = '.jpg';
  if (outputFormat === 'png') finalExt = '.png';
  if (outputFormat === 'webp') finalExt = '.webp';

  for (const size of sizes) {
    const targetWidth = size.width;
    
    let outputFileName = fileNameTemplate
      .replace('{base}', baseName)
      .replace('{width}', targetWidth.toString())
      .replace('{ext}', finalExt.replace('.', ''));
    
    if (!outputFileName) {
      outputFileName = `${baseName}-${targetWidth}${finalExt}`;
    }

    let outputPath = path.join(outputDir, outputFileName);
    
    // Prevent overwriting the exact same source file
    if (path.resolve(outputPath) === path.resolve(inputPath)) {
      const parsedPath = path.parse(outputPath);
      outputPath = path.join(parsedPath.dir, `${parsedPath.name}_resized${parsedPath.ext}`);
      outputFileName = path.basename(outputPath);
    }

    let op = pipeline.clone().resize({
      width: targetWidth,
      withoutEnlargement: true,
    });

    // Apply format and quality
    const formatToApply = outputFormat === 'original' 
      ? originalExt.toLowerCase().replace('.', '') 
      : outputFormat;

    if (formatToApply === 'jpeg' || formatToApply === 'jpg') {
      op = op.jpeg({ quality });
    } else if (formatToApply === 'png') {
      // For PNG, 'quality' only applies when palette=true. 
      // User might mean compressionLevel (0-9). If quality is low (e.g. 7), treat as compressionLevel.
      const compressionLevel = quality <= 9 ? quality : Math.floor((100 - quality) / 10);
      op = op.png({ quality: quality <= 100 ? quality : 100, compressionLevel });
    } else if (formatToApply === 'webp') {
      op = op.webp({ quality });
    } else if (formatToApply === 'tiff') {
      op = op.tiff({ quality });
    }

    await op.toFile(outputPath);

    results.push({
      width: targetWidth,
      fileName: outputFileName,
      fullPath: outputPath,
    });
  }

  return results;
};
