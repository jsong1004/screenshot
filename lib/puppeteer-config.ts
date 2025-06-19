import type { PuppeteerLaunchOptions } from "puppeteer"

export const getPuppeteerConfig = (viewport?: { width: number; height: number }): PuppeteerLaunchOptions => {
  const isProduction = process.env.NODE_ENV === "production"
  const isCloudRun = process.env.K_SERVICE || process.env.FUNCTION_NAME
  const windowSize = viewport ? `${viewport.width},${viewport.height}` : "1920,1080"
  
  const baseConfig: PuppeteerLaunchOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-extensions",
      "--disable-plugins",
      "--disable-default-apps",
      "--no-default-browser-check",
      "--disable-translate",
      "--disable-sync",
      "--hide-scrollbars",
      "--mute-audio",
      "--disable-crash-reporter",
      "--disable-in-process-stack-traces",
      "--disable-logging",
      "--silent",
      "--disable-breakpad",
    ],
  }

  if (isProduction || isCloudRun) {
    // Production/Container optimizations
    const prodArgs = [
      ...baseConfig.args!,
      "--single-process", // Use single process in production
      "--memory-pressure-off",
      "--max_old_space_size=4096",
      "--disable-touch-emulation", // Disable touch emulation that's causing issues
      "--disable-gesture-requirement-for-media-playback",
      "--disable-features=TouchEventFeatureDetection",
      `--window-size=${windowSize}`, // Set window size at launch instead of setViewport
      "--disable-blink-features=AutomationControlled", // Avoid automation detection
      "--disable-ipc-flooding-protection", // Prevent IPC issues in containers
      "--disable-client-side-phishing-detection", 
      "--disable-component-update",
      "--disable-domain-reliability",
      "--disable-background-timer-throttling", // Better for PDF generation
      "--disable-renderer-backgrounding", // Prevent renderer throttling
      "--run-all-compositor-stages-before-draw", // Ensure complete rendering for PDF
    ]
    
    // If running in a containerized environment, try to use system Chrome
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      return {
        ...baseConfig,
        args: prodArgs,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        timeout: 60000, // Longer timeout for containers
      }
    }
    
    return {
      ...baseConfig,
      args: prodArgs,
    }
  }

  return baseConfig
}

export const getPageConfig = () => ({
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  },
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  timeout: 30000,
  waitUntil: "networkidle2" as const,
})