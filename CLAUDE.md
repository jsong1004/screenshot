# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application that captures full-page screenshots of websites using Puppeteer. Users enter a URL and receive a high-quality JPG/PNG/PDF download with the website title in the filename.

## Architecture

### Core Components
- **Screenshot API** (`app/api/screenshot/route.ts`): Main API endpoint handling URL validation, Puppeteer browser automation, and screenshot capture
- **Test API** (`app/api/screenshot/test/route.ts`): Mock endpoint for testing without launching actual browser
- **Puppeteer Configuration** (`lib/puppeteer-config.ts`): Centralized browser launch configurations with production optimizations
- **Download Utilities** (`lib/download-utils.ts`): Client-side file download handling and filename generation
- **UI Components** (`components/ui/`): Shadcn/ui component library with Radix UI primitives
- **Main Page** (`app/page.tsx`): React component with screenshot capture UI and advanced options

### Key Architecture Patterns
- Uses Next.js App Router with API routes
- Puppeteer runs in Node.js runtime (NOT Edge runtime)
- Screenshot data returned as base64 to client, then converted to blob for download
- PDF format handled differently - direct binary response for download
- Error handling includes network timeouts, DNS resolution, and browser launch failures
- Support for multiple output formats (JPG, PNG, PDF) and device viewports
- Advanced options: full page vs viewport, custom delay, device presets

## Development Commands

### Setup
```bash
pnpm install
npx puppeteer browsers install chrome  # Required for Puppeteer
```

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Build for production  
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Testing

Tests are located in `app/api/screenshot/test/route.ts`. The project uses a minimal test setup that returns a mock 1x1 pixel image without launching browsers.

## Puppeteer Configuration

- Browser launched with security flags for containerized environments
- Production mode uses `--single-process` flag
- Configurable viewport (mobile: 375x812, tablet: 768x1024, desktop: 1920x1080)
- User agent spoofing to avoid bot detection
- 30-second timeout with `networkidle2` wait condition
- Custom delay support for waiting for lazy-loaded content

## Deployment

### Docker
- Multi-stage build using Node.js 20 Alpine
- System Chromium installed instead of downloading Puppeteer's Chrome
- Environment variables configured for containerized Puppeteer execution

### Google Cloud Platform
- Configured for Google Cloud Run deployment via Cloud Build
- Build configuration in `cloudbuild.yaml`
- Uses Google Container Registry for image storage

## Important Notes

- The API route must NOT use Edge runtime - Puppeteer requires Node.js
- Chrome binary auto-downloaded via `npx puppeteer browsers install chrome`
- TypeScript and ESLint errors ignored during build (see `next.config.mjs`)
- Uses `@/*` path alias for imports
- All UI components use Tailwind CSS with shadcn/ui styling system
- PDF generation supported with A4 format and margins
- Error responses differentiate between DNS issues, timeouts, and connection refusals