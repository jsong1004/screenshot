import type { PuppeteerLaunchOptions } from "puppeteer"

export const getPuppeteerConfig = (): PuppeteerLaunchOptions => {
  const isProduction = process.env.NODE_ENV === "production"

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
    ],
  }

  if (isProduction) {
    // Production optimizations
    return {
      ...baseConfig,
      args: [
        ...baseConfig.args!,
        "--single-process", // Use single process in production
        "--memory-pressure-off",
        "--max_old_space_size=4096",
      ],
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
