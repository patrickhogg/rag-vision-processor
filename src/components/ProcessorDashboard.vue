<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 p-6 md:p-12">
    <div class="max-w-4xl mx-auto space-y-10">
      <!-- Header -->
      <header class="space-y-2">
        <div class="flex items-center gap-3">
          <div class="bg-blue-600 p-2 rounded-lg text-white">
            <ImagesIcon :size="28" />
          </div>
          <h1 class="text-3xl font-bold tracking-tight text-slate-900">Mass Image Processor</h1>
        </div>
        <p class="text-slate-500 text-lg">Resize images and generate AI metadata for your Knowledge Base.</p>
      </header>

      <main class="grid gap-8">
        <!-- Folders Section -->
        <section class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <FolderOpenIcon :size="18" class="text-slate-500" />
            <h2 class="font-semibold text-slate-800">Folders</h2>
          </div>
          <div class="p-6 space-y-6">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-slate-700">Input Folder</label>
                  <div v-if="config.inputDir" class="flex items-center gap-2">
                    <span v-if="trackingInfo.pendingCount > 0" class="text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {{ trackingInfo.pendingCount }} pending
                    </span>
                    <span v-else-if="trackingInfo.totalValidImages > 0" class="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      All Done
                    </span>

                    <span v-if="trackingInfo.exists" class="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {{ trackingInfo.processedCount }} processed
                    </span>
                    <button 
                      v-if="trackingInfo.exists"
                      @click="clearTracking" 
                      class="text-slate-400 hover:text-red-500 transition-colors bg-white rounded-md p-0.5 shadow-sm border border-slate-200 hover:border-red-200"
                      title="Clear tracking history to re-process all images"
                    >
                      <Trash2Icon :size="14" />
                    </button>
                  </div>
                </div>
                <div class="flex gap-2">
                  <div class="relative flex-1">
                    <input 
                      v-model="config.inputDir" 
                      readonly 
                      placeholder="Select source..." 
                      class="w-full pl-3 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-default"
                    />
                  </div>
                  <button 
                    @click="selectDir('inputDir')" 
                    class="px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                  >
                    Browse
                  </button>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700">Output Folder</label>
                <div class="flex gap-2">
                  <input 
                    v-model="config.outputDir" 
                    readonly 
                    placeholder="Select destination..." 
                    class="w-full pl-3 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-default"
                  />
                  <button 
                    @click="selectDir('outputDir')" 
                    class="px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                  >
                    Browse
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Configuration Grid -->
        <div class="grid gap-8 md:grid-cols-2">
          <!-- Resizing Section -->
          <section class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <MaximizeIcon :size="18" class="text-slate-500" />
              <h2 class="font-semibold text-slate-800">Resizing</h2>
            </div>
            <div class="p-6 space-y-6 flex-1">
              <div class="space-y-3">
                <label class="text-sm font-medium text-slate-700">Output Sizes (Max Width)</label>
                <div class="flex flex-wrap gap-2">
                  <div v-for="(size, index) in config.sizes" :key="index" class="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-md">
                    <input 
                      v-model.number="size.width" 
                      type="number" 
                      class="w-16 bg-transparent border-none focus:ring-0 text-sm font-medium p-0" 
                    />
                    <span class="text-xs opacity-50 px-1">px</span>
                    <button @click="removeSize(index)" class="hover:bg-blue-200 rounded p-0.5 transition-colors">
                      <XIcon :size="14" />
                    </button>
                  </div>
                  <button 
                    @click="addSize" 
                    class="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <PlusIcon :size="14" /> Add
                  </button>
                </div>
              </div>

              <div class="space-y-4 pt-2 border-t border-slate-50">
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1.5">
                    <label class="text-sm font-medium text-slate-700">Output Format</label>
                    <select 
                      v-model="config.outputFormat" 
                      class="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="original">Retain Original</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-sm font-medium text-slate-700">Quality (1-100)</label>
                    <input 
                      v-model.number="config.quality" 
                      type="number" 
                      min="1" 
                      max="100" 
                      class="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Image Naming</label>
                  <input 
                    v-model="config.imageNameTemplate" 
                    class="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p class="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Tags: {base}, {width}, {ext}</p>
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">JSON Naming</label>
                  <input 
                    v-model="config.jsonNameTemplate" 
                    class="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p class="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Tags: {base}, {ext}</p>
                </div>
              </div>
            </div>
          </section>

          <!-- AI Metadata Section -->
          <section class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" :class="{ 'opacity-60': !config.generateAiMetadata }">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <SparklesIcon :size="18" class="text-slate-500" />
                <h2 class="font-semibold text-slate-800">AI Metadata</h2>
              </div>
              <label class="flex items-center gap-2 cursor-pointer relative z-10">
                <span class="text-xs font-medium" :class="config.generateAiMetadata ? 'text-blue-600' : 'text-slate-500'">Enable</span>
                <input type="checkbox" v-model="config.generateAiMetadata" class="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500/20 focus:ring-2 cursor-pointer transition-colors" />
              </label>
            </div>
            <div class="p-6 space-y-4 flex-1" :class="{ 'pointer-events-none': !config.generateAiMetadata }">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Provider</label>
                  <select 
                    v-model="config.aiProvider" 
                    class="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="google">Google Gemini</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Model</label>
                  <input 
                    v-model="config.aiModel" 
                    class="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-slate-700">API Key</label>
                <div class="relative">
                  <input 
                    v-model="config.aiApiKey" 
                    :type="showKey ? 'text' : 'password'"
                    class="w-full pl-3 pr-10 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="sk-..."
                  />
                  <button 
                    @click="showKey = !showKey" 
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <EyeIcon v-if="!showKey" :size="16" />
                    <EyeOffIcon v-else :size="16" />
                  </button>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-medium text-slate-700">Prompt Instructions</label>
                <textarea 
                  v-model="config.aiPrompt" 
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[100px] resize-none"
                ></textarea>
              </div>
            </div>
          </section>
        </div>

        <!-- Schema & Concurrency -->
        <div class="grid gap-8 md:grid-cols-2">
          <!-- Schema Section -->
          <section class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" :class="{ 'opacity-60': !config.generateAiMetadata }">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <CodeIcon :size="18" class="text-slate-500" />
              <h2 class="font-semibold text-slate-800">Metadata Schema</h2>
            </div>
            <div class="p-6 space-y-3 flex-1" :class="{ 'pointer-events-none': !config.generateAiMetadata }">
              <textarea 
                v-model="schemaRaw" 
                @blur="updateSchema"
                class="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[150px] bg-slate-50/50"
              ></textarea>
              <p class="text-xs text-slate-500">Define the JSON structure the AI should return.</p>
            </div>
          </section>

          <!-- Processing Control -->
          <section class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <ZapIcon :size="18" class="text-slate-500" />
              <h2 class="font-semibold text-slate-800">Execution Control</h2>
            </div>
            <div class="p-6 space-y-8 flex-1 flex flex-col justify-center">
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <label class="text-sm font-medium text-slate-700">Concurrency Limit</label>
                  <span class="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{{ config.concurrency }} workers</span>
                </div>
                <input 
                  v-model.number="config.concurrency" 
                  type="range" 
                  min="1" 
                  max="10" 
                  class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div class="space-y-4">
                <button 
                  v-if="!processing"
                  @click="runProcessor" 
                  class="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 flex items-center justify-center gap-3"
                >
                  <PlayIcon :size="20" />
                  Start Image Processing
                </button>

                <button 
                  v-else
                  @click="cancelProcessor" 
                  class="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] bg-red-600 hover:bg-red-700 shadow-red-500/20 flex items-center justify-center gap-3 animate-pulse"
                >
                  <XOctagonIcon :size="20" />
                  Cancel Processing
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- Progress Overlay (only show when processing or finished) -->
        <section v-if="processing || progress.completed > 0" class="bg-white rounded-xl border border-slate-200 shadow-xl p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="flex justify-between items-end">
            <div class="space-y-1">
              <h3 class="font-bold text-xl text-slate-900">Current Progress</h3>
              <p class="text-sm text-slate-500">{{ progress.completed }} of {{ progress.total }} images completed</p>
            </div>
            <div class="text-3xl font-black text-blue-600 tabular-nums">
              {{ Math.round(progress.percent) }}%
            </div>
          </div>
          
          <div class="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div 
              class="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out relative"
              :style="{ width: progress.percent + '%' }"
            >
              <div class="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
            </div>
          </div>

          <div class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden">
            <div v-if="processing" class="flex-shrink-0">
              <Loader2Icon class="animate-spin text-blue-500" :size="16" />
            </div>
            <div v-else class="flex-shrink-0">
              <CheckCircleIcon class="text-green-500" :size="16" />
            </div>
            <p class="text-sm font-medium text-slate-600 truncate">
              <span class="opacity-50 mr-2">Status:</span>
              {{ currentFile || (processing ? 'Initializing...' : 'Complete!') }}
            </p>
          </div>
        </section>
      </main>

      <footer class="text-center pb-12">
        <p class="text-slate-400 text-xs">Mass Image Processor v1.0 • Built with Electron & Vercel AI SDK</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { 
  ImagesIcon, 
  FolderOpenIcon, 
  MaximizeIcon, 
  PlusIcon, 
  XIcon, 
  SparklesIcon, 
  EyeIcon, 
  EyeOffIcon, 
  CodeIcon, 
  ZapIcon, 
  PlayIcon, 
  Loader2Icon,
  CheckCircleIcon,
  Trash2Icon,
  XOctagonIcon
} from 'lucide-vue-next'

const config = reactive({
  inputDir: '',
  outputDir: '',
  sizes: [{ width: 800 }, { width: 300 }],
  imageNameTemplate: '{base}-{width}.{ext}',
  jsonNameTemplate: '{base}.{ext}',
  outputFormat: 'original',
  quality: 70,
  generateAiMetadata: true,
  aiProvider: 'google',
  aiApiKey: '',
  aiModel: 'gemini-2.5-flash',
  aiPrompt: 'Analyze this image and extract highly detailed metadata according to the strict JSON schema provided.\n\nRules for extraction:\n1. "description": Write a rich, objective, descriptive paragraph covering subjects, actions, background, and visual composition.\n2. "colors": Extract the primary and secondary dominant colors as exact Hex Codes (e.g. #E0B890).\n3. "people": If people are present, create an array of each person containing their estimated age group, gender, skin tone, and approximate location (bounding_box in format [ymin, xmin, ymax, xmax] coordinates from 0-1000).\n4. "objects": List the primary focus objects, their counts, and their approximate location (bounding_box in format [ymin, xmin, ymax, xmax] coordinates from 0-1000).\n5. "keywords": Provide at least 15 highly relevant SEO keywords or tags based on the image content.',
  aiSchema: {
    description: 'string',
    colors: {
      primary: 'string',
      secondary: 'string'
    },
    people: [
      {
        age_group: 'string',
        gender: 'string',
        skin_color: 'string',
        bounding_box: 'string'
      }
    ],
    objects: [
      {
        name: 'string',
        count: 'number',
        bounding_box: 'string'
      }
    ],
    keywords: ['string']
  },
  concurrency: 3
})

const schemaRaw = ref(JSON.stringify(config.aiSchema, null, 2))

// Watch config for changes and save to localStorage (omitting folders)
watch(config, (newConfig) => {
  const configToSave = { ...newConfig, inputDir: '', outputDir: '' }
  localStorage.setItem('mip_config', JSON.stringify(configToSave))
}, { deep: true })
const showKey = ref(false)
const processing = ref(false)
const currentFile = ref('')
const progress = reactive({
  percent: 0,
  completed: 0,
  total: 0
})

const trackingInfo = ref({ exists: false, processedCount: 0, totalValidImages: 0, pendingCount: 0 })

const checkTracking = async () => {
  if (!config.inputDir) {
    trackingInfo.value = { exists: false, processedCount: 0, totalValidImages: 0, pendingCount: 0 }
    return
  }
  trackingInfo.value = await (window as any).ipcRenderer.invoke('check-tracking-file', config.inputDir)
}

const clearTracking = async () => {
  if (!config.inputDir) return
  if (confirm(`Are you sure you want to clear the processed history for this folder? The next run will process all images again.`)) {
    await (window as any).ipcRenderer.invoke('delete-tracking-file', config.inputDir)
    await checkTracking()
  }
}

// Watch inputDir specifically to update tracking info
watch(() => config.inputDir, () => {
  checkTracking()
})

const updateSchema = () => {
  try {
    config.aiSchema = JSON.parse(schemaRaw.value)
  } catch (e) {
    alert('Invalid JSON in schema definition')
  }
}

const selectDir = async (key: 'inputDir' | 'outputDir') => {
  const path = await (window as any).ipcRenderer.invoke('select-directory')
  if (path) {
    config[key] = path
  }
}

const addSize = () => {
  config.sizes.push({ width: 500 })
}

const removeSize = (index: number) => {
  config.sizes.splice(index, 1)
}

const cancelProcessor = async () => {
  if (!confirm('Are you sure you want to stop processing?')) return
  currentFile.value = 'Canceling...'
  await (window as any).ipcRenderer.invoke('cancel-processor')
}

const runProcessor = async () => {
  if (!config.inputDir || !config.outputDir) {
    alert('Please set Input/Output folders')
    return
  }

  if (config.generateAiMetadata && !config.aiApiKey) {
    alert('Please set an API Key for AI Metadata generation')
    return
  }

  processing.value = true
  progress.percent = 0
  progress.completed = 0
  progress.total = 0
  currentFile.value = 'Preparing...'

  try {
    // Deep clone the reactive config to strip all Vue Proxy wrappers so Electron can serialize it cleanly
    const plainConfig = JSON.parse(JSON.stringify(config))
    const result = await (window as any).ipcRenderer.invoke('run-processor', plainConfig)
    
    if (result && result.message) {
      currentFile.value = result.message
    } else {
      currentFile.value = 'Done!'
    }
  } catch (err: any) {
    alert('Error: ' + err.message)
    currentFile.value = 'Error'
  } finally {
    processing.value = false
    await checkTracking()
  }
}

onMounted(() => {
  // Restore config on load
  const savedConfig = localStorage.getItem('mip_config')
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig)
      Object.keys(parsed).forEach(key => {
        if (key !== 'inputDir' && key !== 'outputDir') {
          (config as any)[key] = parsed[key]
        }
      })
      // Sync the raw schema text box with the loaded schema object
      schemaRaw.value = JSON.stringify(config.aiSchema, null, 2)
    } catch (e) {
      console.error('Failed to parse saved config', e)
    }
  }

  (window as any).ipcRenderer.on('processor-progress', (_event: any, data: any) => {
    progress.percent = data.progress
    progress.completed = data.completed
    progress.total = data.total
    if (data.status === 'error') {
      currentFile.value = `Error on ${data.fileName}: ${data.error}`
    } else {
      currentFile.value = data.fileName
    }
  })
})
</script>

<style>
/* Base animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
