import { NextResponse } from "next/server"
import { existsSync } from "fs"

export async function GET() {
  try {
    // Check environment variables
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      K_SERVICE: process.env.K_SERVICE,
      FUNCTION_NAME: process.env.FUNCTION_NAME,
      PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,
      PUPPETEER_SKIP_DOWNLOAD: process.env.PUPPETEER_SKIP_DOWNLOAD,
    }

    // Check if Chrome/Chromium exists at expected paths
    const chromePaths = [
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
    ]

    const chromePathsStatus = chromePaths.map(path => ({
      path,
      exists: existsSync(path)
    }))

    // Test Chrome binary execution
    let chromeTestResult = null
    const chromeBinary = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome'
    try {
      const { execSync } = await import("child_process")
      const result = execSync(`${chromeBinary} --version`, { 
        encoding: 'utf8', 
        timeout: 5000 
      })
      chromeTestResult = { success: true, version: result.trim(), binary: chromeBinary }
    } catch (error) {
      chromeTestResult = { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        binary: chromeBinary
      }
    }

    // Test Puppeteer import
    let puppeteerImportStatus = "success"
    let puppeteerError = null
    let puppeteerVersion = null
    
    try {
      const puppeteer = await import("puppeteer")
      puppeteerVersion = puppeteer.default.version || "unknown"
    } catch (error) {
      puppeteerImportStatus = "failed"
      puppeteerError = error instanceof Error ? error.message : String(error)
    }

    // Test Puppeteer config
    let configStatus = "success"
    let configError = null
    let config = null
    
    try {
      const { getPuppeteerConfig } = await import("@/lib/puppeteer-config")
      config = getPuppeteerConfig()
    } catch (error) {
      configStatus = "failed"
      configError = error instanceof Error ? error.message : String(error)
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envInfo,
      chromePaths: chromePathsStatus,
      chromeTest: chromeTestResult,
      puppeteer: {
        importStatus: puppeteerImportStatus,
        version: puppeteerVersion,
        error: puppeteerError,
      },
      config: {
        status: configStatus,
        error: configError,
        config: config,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug endpoint failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}