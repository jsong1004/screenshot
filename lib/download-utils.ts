export function downloadImage(base64Data: string, filename: string, format: string) {
  try {
    // Convert base64 to blob
    const byteCharacters = atob(base64Data.split(",")[1])
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    const mimeType = format === "pdf" ? "application/pdf" : `image/${format}`
    const blob = new Blob([byteArray], { type: mimeType })

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error("Download failed:", error)
    return false
  }
}

export function generateFilename(title: string, url: string, format: string): string {
  const domain = new URL(url).hostname.replace("www.", "")
  const cleanTitle = title.replace(/[^a-zA-Z0-9\s-]/g, "").trim()
  const date = new Date().toISOString().split("T")[0]

  return `${cleanTitle || domain}-screenshot-${date}.${format}`
}
