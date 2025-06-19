import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
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

    console.log(`Test screenshot for: ${normalizedUrl}`)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Extract domain for title
    const domain = new URL(normalizedUrl).hostname.replace("www.", "")
    const title = `Test Screenshot of ${domain}`

    // Create a simple test image (1x1 pixel JPEG in base64)
    const testImageBase64 =
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"

    return NextResponse.json({
      success: true,
      screenshot: `data:image/jpeg;base64,${testImageBase64}`,
      title: title,
      url: normalizedUrl,
      timestamp: new Date().toISOString(),
      isTest: true,
    })
  } catch (error) {
    console.error("Test screenshot error:", error)
    return NextResponse.json(
      {
        error: "Test screenshot failed",
      },
      { status: 500 },
    )
  }
}
