import fs from 'node:fs/promises';
import path from 'node:path';
import pLimit from 'p-limit';
import { resizeImage, SizeConfig } from './imageService';
import { analyzeImage, AIProvider } from './aiService';
import { BrowserWindow } from 'electron';

export async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

let isCancelled = false;

export const cancelBatchProcessor = () => {
  isCancelled = true;
};

export const getDirectoryStats = async (inputDir: string) => {
  try {
    const allFiles = await getFiles(inputDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff'];
    
    const processedRecordPath = path.join(inputDir, '.mip_processed.json');
    let processedFiles: string[] = [];
    try {
      const data = await fs.readFile(processedRecordPath, 'utf-8');
      processedFiles = JSON.parse(data);
    } catch (e) {
      // File does not exist or is invalid
    }
    const processedSet = new Set(processedFiles);
    const seenBasenames = new Set(processedFiles.map(f => path.basename(f)));

    let totalValidImages = 0;
    let pendingCount = 0;

    allFiles.forEach((f) => {
      if (imageExtensions.includes(path.extname(f).toLowerCase())) {
        totalValidImages++;
        const relPath = path.relative(inputDir, f);
        const fileName = path.basename(relPath);
        
        if (!processedSet.has(relPath) && !seenBasenames.has(fileName)) {
          seenBasenames.add(fileName);
          pendingCount++;
        }
      }
    });

    return {
      exists: processedFiles.length > 0,
      processedCount: processedSet.size,
      totalValidImages,
      pendingCount
    };
  } catch (e) {
    return { exists: false, processedCount: 0, totalValidImages: 0, pendingCount: 0 };
  }
};

export interface ProcessorOptions {
  inputDir: string;
  outputDir: string;
  sizes: SizeConfig[];
  imageNameTemplate: string;
  jsonNameTemplate: string;
  outputFormat: 'original' | 'jpeg' | 'png' | 'webp';
  quality: number;
  generateAiMetadata: boolean;
  aiProvider: AIProvider;
  aiApiKey: string;
  aiModel: string;
  aiSchema: Record<string, any>;
  aiPrompt: string;
  concurrency: number;
}

export const runBatchProcessor = async (
  options: ProcessorOptions,
  win: BrowserWindow | null
) => {
  isCancelled = false;

  const {
    inputDir,
    outputDir,
    sizes,
    imageNameTemplate,
    jsonNameTemplate,
    outputFormat,
    quality,
    generateAiMetadata,
    aiProvider,
    aiApiKey,
    aiModel,
    aiSchema,
    aiPrompt,
    concurrency,
  } = options;

  const limit = pLimit(concurrency);
  const writeLimit = pLimit(1); // Lock for incremental tracking file writes
  const allFiles = await getFiles(inputDir);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff'];
  
  // Load tracking metadata for previously processed files
  const processedRecordPath = path.join(inputDir, '.mip_processed.json');
  let processedFiles: string[] = [];
  try {
    const data = await fs.readFile(processedRecordPath, 'utf-8');
    processedFiles = JSON.parse(data);
  } catch (e) {
    // File does not exist or is not valid JSON yet
  }
  const processedSet = new Set(processedFiles);
  
  // Track basenames to ensure files with the exact same name in subfolders are skipped
  const seenBasenames = new Set(processedFiles.map(f => path.basename(f)));

  const imageFiles = allFiles
    .filter((f) => imageExtensions.includes(path.extname(f).toLowerCase()))
    .map((f) => path.relative(inputDir, f))
    .filter((relPath) => {
      // Skip if exactly this file was already processed
      if (processedSet.has(relPath)) return false;
      
      // Skip if a file with this exact name was already processed or queued
      const fileName = path.basename(relPath);
      if (seenBasenames.has(fileName)) return false;
      
      seenBasenames.add(fileName);
      return true;
    });

  const total = imageFiles.length;
  if (total === 0) {
    return { success: true, count: 0, message: 'No new images to process.' };
  }

  let completedCount = 0;

  const updateProgress = (fileName: string, status: string, error?: string) => {
    completedCount++;
    win?.webContents.send('processor-progress', {
      fileName,
      status,
      progress: Math.round((completedCount / total) * 100),
      completed: completedCount,
      total,
      error,
    });
  };

  const tasks = imageFiles.map((file) =>
    limit(async () => {
      if (isCancelled) return;
      try {
        const inputPath = path.join(inputDir, file);
        const relativeDir = path.dirname(file);
        const currentOutputDir = path.join(outputDir, relativeDir);
        
        await fs.mkdir(currentOutputDir, { recursive: true });

        const fileName = path.basename(file);
        const ext = path.extname(fileName);
        const baseName = path.basename(fileName, ext);

        // 1. Resize Images (1:N)
        const resizeResults = await resizeImage(
          inputPath,
          currentOutputDir,
          sizes,
          imageNameTemplate,
          outputFormat,
          quality
        );

        if (isCancelled) return;

        if (generateAiMetadata) {
          // 2. AI Analysis
          const aiMetadata = await analyzeImage({
            provider: aiProvider,
            apiKey: aiApiKey,
            model: aiModel,
            imagePath: inputPath,
            schemaDefinition: aiSchema,
            prompt: aiPrompt,
          });

          // 3. Merge Metadata & Sizes into a single JSON
          const finalJson = {
            ...aiMetadata,
            original_filename: file,
            available_sizes: resizeResults.map((r) => ({
              width: r.width,
              fileName: r.fileName,
            })),
          };

          // 4. Save JSON using template
          const jsonFileName = jsonNameTemplate
            .replace('{base}', baseName)
            .replace('{ext}', 'json');
          
          const jsonPath = path.join(currentOutputDir, jsonFileName);
          await fs.writeFile(jsonPath, JSON.stringify(finalJson, null, 2));
        }

        processedSet.add(file);
        
        // Write tracking file incrementally using a lock (pLimit(1)) to prevent write conflicts
        writeLimit(async () => {
          try {
            await fs.writeFile(processedRecordPath, JSON.stringify(Array.from(processedSet), null, 2));
          } catch (writeErr) {
            console.error('Failed to incrementally update tracking file:', writeErr);
          }
        });

        updateProgress(file, 'success');
      } catch (err: any) {
        console.error(`Error processing ${file}:`, err);
        updateProgress(file, 'error', err.message);
      }
    })
  );

  await Promise.all(tasks);
  
  // Wait for any pending incremental writes to finish, then do one final save
  await writeLimit(async () => {
    try {
      await fs.writeFile(processedRecordPath, JSON.stringify(Array.from(processedSet), null, 2));
    } catch (err) {
      console.error('Failed to write final processed metadata file:', err);
    }
  });

  return { success: true, count: completedCount };
};
