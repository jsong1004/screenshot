import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  let browser = null

  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Normalize URL
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    // Validate URL
    try {
      new URL(normalizedUrl)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    console.log(`Starting screenshot capture for: ${normalizedUrl}`)

    // Dynamic import of Puppeteer to handle potential installation issues
    let puppeteer
    try {
      puppeteer = await import("puppeteer")
    } catch (importError) {
      console.error("Puppeteer import failed:", importError)
      return NextResponse.json(
        {
          error: "Screenshot service temporarily unavailable. Puppeteer not available.",
        },
        { status: 503 },
      )
    }

    // Launch Puppeteer with error handling
    try {
      browser = await puppeteer.default.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
        ],
      })
    } catch (launchError) {
      console.error("Puppeteer launch failed:", launchError)
      return NextResponse.json(
        {
          error: "Failed to initialize browser. Please try again.",
        },
        { status: 500 },
      )
    }

    const page = await browser.newPage()

    // Set viewport for consistent screenshots
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    })

    // Set user agent to avoid bot detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    )

    // Navigate to the page with timeout and error handling
    try {
      await page.goto(normalizedUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      })
    } catch (navigationError) {
      await browser.close()
      console.error("Navigation failed:", navigationError)

      const errorMsg = (navigationError instanceof Error ? navigationError.message : String(navigationError))
      if (errorMsg.includes("net::ERR_NAME_NOT_RESOLVED")) {
        return NextResponse.json({ error: "Website not found or unreachable" }, { status: 400 })
      } else if (errorMsg.includes("TimeoutError")) {
        return NextResponse.json({ error: "Website took too long to load" }, { status: 408 })
      } else if (errorMsg.includes("net::ERR_CONNECTION_REFUSED")) {
        return NextResponse.json({ error: "Connection refused by the website" }, { status: 400 })
      }

      return NextResponse.json({ error: "Failed to load the website" }, { status: 400 })
    }

    // Wait a bit more for any lazy-loaded content
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Get page title for filename
    let title = "screenshot"
    try {
      title = await page.title()
      title = title.replace(/[^a-zA-Z0-9\s-]/g, "").trim() || "screenshot"
    } catch (titleError) {
      // Failed to get page title
    }

    // Take full page screenshot
    let screenshot
    try {
      screenshot = await page.screenshot({
        type: "jpeg",
        quality: 90,
        fullPage: true,
      })
    } catch (screenshotError) {
      await browser.close()
      console.error("Screenshot capture failed:", screenshotError)
      return NextResponse.json({ error: "Failed to capture screenshot" }, { status: 500 })
    }

    await browser.close()

    console.log(`Screenshot captured successfully for: ${normalizedUrl}`)

    // Return the screenshot as base64 with metadata
    const base64Screenshot = screenshot.toString("base64")

    return NextResponse.json({
      success: true,
      screenshot: `data:image/jpeg;base64,${base64Screenshot}`,
      title: title,
      url: normalizedUrl,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    // Ensure browser is closed in case of any error
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error("Failed to close browser:", closeError)
      }
    }

    console.error("Screenshot capture error:", error)

    // Return a proper JSON error response
    return NextResponse.json(
      {
        error: "An unexpected error occurred while capturing the screenshot",
      },
      { status: 500 },
    )
  }
}
