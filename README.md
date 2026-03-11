# Mass Image Processor & AI Indexer

An Electron-based desktop application built with Vue, Tailwind CSS, and the Vercel AI SDK. This tool automates mass image resizing and uses AI (Gemini/OpenAI) to generate structured metadata (JSON) for each image, making them easily searchable within a RAG (Retrieval-Augmented Generation) Knowledge Base system.

## Features

- **Mass Resizing (1:N):** Process an entire directory and output multiple resized versions (e.g., thumbnail, medium, large) for each source image using `sharp`.
- **AI Metadata Generation:** Automatically describe images and extract keywords using the Vercel AI SDK (supports Google Gemini and OpenAI).
- **Customizable JSON Schemas:** Define the exact JSON structure you want the AI to output to perfectly map to your Knowledge Base.
- **Recursive Directory Processing:** Automatically scans all nested subfolders within your selected Input Folder. The exact subfolder structure is mirrored in your Output Folder, keeping your batches perfectly organized.
- **Smart Incremental Processing & Crash Recovery:** Automatically tracks processed files using a hidden, local `.mip_processed.json` file stored in the root of your Input Folder. 
  - **Resume Anytime:** If a batch is interrupted or cancelled, you can resume exactly where you left off.
  - **Crash-Proof File Locking:** Uses strict asynchronous queue locking when updating the tracking file, ensuring your progress is safely saved even if the application closes unexpectedly.
  - **Duplicate Prevention:** Identifies and skips files with the exact same name across different subfolders to prevent redundant AI API calls and processing.
- **Cross-Platform:** Builds available for macOS (`.dmg`) and Windows (`.exe` portable and NSIS installer).

## Prerequisites

- Node.js (v18 or higher recommended)
- A valid API key for Google Gemini or OpenAI (only if AI metadata generation is enabled)

## Installation & Setup

1. Open your terminal and navigate to the project directory:
   ```bash
   cd mass-image-processor
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the App in Development

Start the development server with hot-reload:
```bash
npm run dev
```

## Building for Production

To package the app into a distributable executable, run the appropriate command for your platform. Note: You should run these commands on the actual operating system you intend to build for to ensure native modules compile correctly.

- **For macOS (`.dmg` & `.zip`):**
  ```bash
  npm run build:mac
  ```

- **For Windows (`.exe`):**
  ```bash
  npm run build:win
  ```

- **For All Platforms:**
  ```bash
  npm run build:all
  ```

The compiled binaries will be placed in the `release/` directory.

## Usage Guide

1. Open the application.
2. Select your **Input Folder** containing the source images.
3. Select an **Output Folder** for the resized images and JSON metadata.
4. Add desired output sizes by defining max-width in pixels.
5. (Optional) Configure your AI provider, paste your API key, and define your prompt and JSON schema to generate metadata.
6. Click **Start Image Processing**.
7. *Tip: You can cancel a batch at any time safely. The application utilizes file-locking to ensure the tracking history is preserved up to the last successful image.*

## Tech Stack

- **Framework:** Electron, Vue 3, Vite, Tailwind CSS 4
- **Image Processing:** Sharp
- **AI Integration:** Vercel AI SDK, Zod
- **Concurrency:** p-limit
- **Icons:** Lucide-Vue-Next
