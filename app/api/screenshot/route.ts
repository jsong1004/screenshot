import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  let browser = null

  // Set a timeout for the entire operation
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Screenshot operation timed out after 120 seconds")), 120000)
  })

  const mainOperation = async () => {
    const { url, format = "jpeg", viewport = { width: 1920, height: 1080 }, fullPage = true, delay = 2000 } = await request.json()

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
    console.log("Environment:", { 
      NODE_ENV: process.env.NODE_ENV,
      K_SERVICE: process.env.K_SERVICE,
      PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH 
    })

    // Dynamic import of Puppeteer to handle potential installation issues
    let puppeteer
    try {
      puppeteer = await import("puppeteer")
      console.log("Puppeteer imported successfully")
    } catch (importError) {
      console.error("Puppeteer import failed:", importError)
      return NextResponse.json(
        {
          error: "Screenshot service temporarily unavailable. Puppeteer not available.",
          details: importError instanceof Error ? importError.message : String(importError)
        },
        { status: 503 },
      )
    }

    // Import Puppeteer configuration
    const { getPuppeteerConfig, getPageConfig } = await import("@/lib/puppeteer-config")
    const puppeteerConfig = getPuppeteerConfig(viewport)
    const pageConfig = getPageConfig()

    // Launch Puppeteer with error handling
    console.log("Puppeteer config:", JSON.stringify(puppeteerConfig, null, 2))
    try {
      browser = await puppeteer.default.launch(puppeteerConfig)
      console.log("Browser launched successfully")
    } catch (launchError) {
      console.error("Puppeteer launch failed:", launchError)
      return NextResponse.json(
        {
          error: "Failed to initialize browser. Please try again.",
          details: launchError instanceof Error ? launchError.message : String(launchError)
        },
        { status: 500 },
      )
    }

    const page = await browser.newPage()

    try {
      // Only set user agent, skip setViewport to avoid touch emulation issues
      await page.setUserAgent(pageConfig.userAgent)
      
      // Add delay to let Chrome fully initialize
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log("Page setup completed successfully")
    } catch (setupError) {
      console.error("Page setup failed:", setupError)
      await browser.close()
      return NextResponse.json(
        {
          error: "Failed to configure browser page",
          details: setupError instanceof Error ? setupError.message : String(setupError)
        },
        { status: 500 }
      )
    }

    // Navigate to the page with timeout and error handling
    try {
      await page.goto(normalizedUrl, {
        waitUntil: pageConfig.waitUntil,
        timeout: pageConfig.timeout,
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
    await new Promise(resolve => setTimeout(resolve, delay))

    // Get page title for filename
    let title = "screenshot"
    try {
      title = await page.title()
      title = title.replace(/[^a-zA-Z0-9\s-]/g, "").trim() || "screenshot"
    } catch (titleError) {
      // Failed to get page title
    }

    // Check if page is still connected before taking screenshot
    try {
      const isConnected = await page.evaluate(() => true)
      if (!isConnected) {
        throw new Error("Page session lost before screenshot")
      }
    } catch (connectionError) {
      console.error("Page connection check failed:", connectionError)
      await browser.close()
      return NextResponse.json(
        { 
          error: "Browser session was lost during navigation",
          details: connectionError instanceof Error ? connectionError.message : String(connectionError)
        }, 
        { status: 500 }
      )
    }

    // Take full page screenshot or PDF
    let screenshot
    try {
      if (format === "pdf") {
        console.log("Starting PDF generation...")
        
        // Log memory usage before PDF generation
        const memUsage = process.memoryUsage()
        console.log(`Memory before PDF: RSS=${Math.round(memUsage.rss/1024/1024)}MB, Heap=${Math.round(memUsage.heapUsed/1024/1024)}MB`)
        
        // Additional wait for PDF stability
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Optimize PDF generation for memory efficiency
        screenshot = await page.pdf({
          format: "A4",
          printBackground: true,
          preferCSSPageSize: false,
          displayHeaderFooter: false,
          margin: {
            top: "0.4in",
            bottom: "0.4in", 
            left: "0.4in",
            right: "0.4in"
          },
          // Optimize for memory usage
          omitBackground: false,
          timeout: 60000, // 60 second timeout for PDF
        })
        
        // Log memory usage after PDF generation
        const memUsageAfter = process.memoryUsage()
        console.log(`PDF generated successfully, size: ${screenshot.length} bytes`)
        console.log(`Memory after PDF: RSS=${Math.round(memUsageAfter.rss/1024/1024)}MB, Heap=${Math.round(memUsageAfter.heapUsed/1024/1024)}MB`)
      } else {
        screenshot = await page.screenshot({
          type: format,
          quality: format === "jpeg" ? 90 : undefined,
          fullPage,
        })
      }
      console.log("Screenshot captured successfully")
    } catch (screenshotError) {
      console.error("Screenshot capture failed:", screenshotError)
      await browser.close()
      return NextResponse.json(
        { 
          error: "Failed to capture screenshot",
          details: screenshotError instanceof Error ? screenshotError.message : String(screenshotError)
        }, 
        { status: 500 }
      )
    }

    await browser.close()

    console.log(`Screenshot captured successfully for: ${normalizedUrl}`)

    // For PDF, return as binary response instead of base64
    if (format === "pdf") {
      return new NextResponse(screenshot, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${title.replace(/[^a-zA-Z0-9\s-]/g, "").trim() || "screenshot"}-${new Date().toISOString().split("T")[0]}.pdf"`,
        },
      })
    }

    // Return the screenshot as base64 with metadata for images
    const base64Screenshot = screenshot.toString("base64")
    const mimeType = `image/${format}`

    return NextResponse.json({
      success: true,
      screenshot: `data:${mimeType};base64,${base64Screenshot}`,
      title: title,
      url: normalizedUrl,
      timestamp: new Date().toISOString(),
      format,
      viewport,
      fullPage,
      delay,
    })
  }

  try {
    return await Promise.race([mainOperation(), timeoutPromise])
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

    // In production, if Puppeteer fails, provide a helpful error with debugging info
    const isCloudRun = process.env.K_SERVICE || process.env.FUNCTION_NAME
    if (isCloudRun) {
      return NextResponse.json(
        {
          error: "Screenshot capture failed in production environment",
          details: error instanceof Error ? error.message : String(error),
          troubleshooting: {
            debugEndpoint: "/api/debug",
            environment: process.env.NODE_ENV,
            cloudRun: !!isCloudRun,
          }
        },
        { status: 500 },
      )
    }

    // Return a proper JSON error response
    return NextResponse.json(
      {
        error: "An unexpected error occurred while capturing the screenshot",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
