import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import { runBatchProcessor, getDirectoryStats, cancelBatchProcessor } from './services/processor'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()

  // IPC Handlers
  ipcMain.handle('select-directory', async () => {
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
    })
    return result.filePaths[0] || null
  })

  ipcMain.handle('run-processor', async (_event, options) => {
    try {
      const result = await runBatchProcessor(options, win)
      // Ensure result is a plain serializable object
      return JSON.parse(JSON.stringify(result))
    } catch (error: any) {
      console.error('Batch processor failed:', error)
      // Throwing plain strings or basic Error messages prevents clone errors
      throw new Error(error.message || 'Unknown processing error')
    }
  })

  ipcMain.handle('cancel-processor', async () => {
    cancelBatchProcessor()
    return true
  })

  ipcMain.handle('check-tracking-file', async (_event, dirPath) => {
    if (!dirPath) return { exists: false, processedCount: 0, totalValidImages: 0, pendingCount: 0 }
    return await getDirectoryStats(dirPath)
  })

  ipcMain.handle('delete-tracking-file', async (_event, dirPath) => {
    if (!dirPath) return false
    try {
      const filePath = path.join(dirPath, '.mip_processed.json')
      await fs.unlink(filePath)
      return true
    } catch (e) {
      return false
    }
  })
})
