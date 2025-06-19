# WebCapture Screenshot App

A modern Next.js app to capture full-page screenshots of any website using Puppeteer and Chrome. Enter a URL and instantly get a high-quality JPG download with the website title in the filename.

## Features
- Full-page website screenshots
- Auto-download with smart filename
- High-resolution JPG output
- User-friendly UI (React, Tailwind CSS)
- Robust error handling

## Getting Started

### Prerequisites
- Node.js (v18 or later recommended)
- pnpm (or npm/yarn)

### Installation
```bash
pnpm install
```

### Puppeteer Chrome Setup
Puppeteer requires a compatible version of Chrome. After installing dependencies, run:

```bash
npx puppeteer browsers install chrome
```

This will download the required Chrome binary for Puppeteer.

### Running Locally
```bash
pnpm dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Usage
1. Enter a website URL (e.g., `example.com` or `https://example.com`).
2. Click "Capture Screenshot".
3. The app will process and download a JPG screenshot of the full page.

## Troubleshooting
### Puppeteer/Chrome Issues
- **Chrome not found:** If you see errors about Chrome not being found, make sure you ran `npx puppeteer browsers install chrome`.
- **Edge Runtime Error:** Puppeteer only works in Node.js environments, not Edge/serverless runtimes.
- **Permissions:** On some systems, you may need to allow execution of the downloaded Chrome binary.

### Common Fixes
- Delete `node_modules` and reinstall dependencies if you see unexpected errors.
- Ensure your API route is not running in an Edge runtime (no `export const runtime = "edge"`).

## License
MIT 