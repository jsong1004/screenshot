"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Download, Globe, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { downloadImage, generateFilename } from "@/lib/download-utils"

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export default function ScreenshotApp() {
  const [url, setUrl] = useState("")
  const [isCapturing, setIsCapturing] = useState(false)
  const [status, setStatus] = useState<"idle" | "capturing" | "success" | "error">("idle")
  const [lastCapturedTitle, setLastCapturedTitle] = useState("")
  const [format, setFormat] = useState("jpeg")
  const [device, setDevice] = useState<DeviceType>("desktop")
  const [fullPage, setFullPage] = useState(true)
  const [delay, setDelay] = useState(2)
  const [screenshotData, setScreenshotData] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const devicePresets: Record<DeviceType, { width: number; height: number }> = {
    mobile: { width: 375, height: 812 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 },
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string.startsWith("http") ? string : `https://${string}`)
      return true
    } catch (_) {
      return false
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    let droppedUrl = ""
    if (e.dataTransfer.types.includes("text/uri-list")) {
      droppedUrl = e.dataTransfer.getData("text/uri-list")
    } else if (e.dataTransfer.types.includes("text/plain")) {
      droppedUrl = e.dataTransfer.getData("text/plain")
    }
    if (droppedUrl) setUrl(droppedUrl)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const captureScreenshot = async () => {
    if (!url || !isValidUrl(url)) return

    setIsCapturing(true)
    setStatus("capturing")
    setShowPreview(false)
    setScreenshotData(null)

    try {
      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          format,
          viewport: devicePresets[device],
          fullPage,
          delay: delay * 1000,
        }),
      })

      // Handle PDF differently - direct download
      if (format === "pdf") {
        if (!response.ok) {
          // Try to parse error as JSON
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            throw new Error(errorData.error || `Server error: ${response.status}`)
          } else {
            throw new Error(`Server error: ${response.status}`)
          }
        }
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setScreenshotData(url)
        setShowPreview(true)
        setLastCapturedTitle("PDF Screenshot")
        setStatus("success")
        return
      }

      // For images, check if response is JSON
      if (!response.ok) {
        // Try to parse error as JSON
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Server error: ${response.status}`)
        } else {
          throw new Error(`Server error: ${response.status}`)
        }
      }
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an invalid response. Please try again.")
      }
      const data = await response.json()

      // Generate filename and download
      const filename = generateFilename(data.title, data.url, format)
      setScreenshotData(data.screenshot)
      setShowPreview(true)
      // Only auto-download for images
      if (format !== "pdf") {
        const downloadSuccess = downloadImage(data.screenshot, filename, format)
        if (downloadSuccess) {
          setLastCapturedTitle(data.title)
          setStatus("success")
        } else {
          throw new Error("Failed to download screenshot")
        }
      }
    } catch (error) {
      console.error("Screenshot capture failed:", error)
      setStatus("error")
    } finally {
      setIsCapturing(false)
      // Only reset status after error, not after success
      if (status === "error") {
        setTimeout(() => setStatus("idle"), 3000)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowPreview(false)
    setScreenshotData(null)
    captureScreenshot()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        {isCapturing && (
          <div className="w-full h-2 bg-gray-200 rounded mb-4 overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse" style={{ width: "80%" }} />
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">WebCapture</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Capture full-page screenshots of any website instantly. Simply enter a URL and get a high-quality image(JPG, PNG) or a PDF
            download with the website title automatically included in the filename.
          </p>
        </div>

        {/* Main Card */}
        <Card className="max-w-2xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-gray-800">Capture Website Screenshot</CardTitle>
            <CardDescription className="text-base">
              Enter any website URL to capture a full-page screenshot
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="url" className="text-sm font-medium text-gray-700">
                  Website URL
                </label>
                <div
                  className={`relative border-2 rounded transition-colors ${isDragOver ? "border-blue-500 bg-blue-50" : "border-transparent"}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragLeave}
                >
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="url"
                    type="text"
                    placeholder="example.com or https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10 h-12 text-base"
                    disabled={isCapturing}
                    ref={inputRef}
                  />
                  {isDragOver && (
                    <div className="absolute inset-0 bg-blue-100 bg-opacity-50 flex items-center justify-center pointer-events-none rounded">
                      <span className="text-blue-700 font-semibold">Drop URL here</span>
                    </div>
                  )}
                </div>
                {url && !isValidUrl(url) && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Please enter a valid URL
                  </p>
                )}
              </div>
              {/* Screenshot Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Format</label>
                  <select
                    className="w-full mt-1 border rounded px-2 py-2"
                    value={format}
                    onChange={e => setFormat(e.target.value)}
                    disabled={isCapturing}
                  >
                    <option value="jpeg">JPG</option>
                    <option value="png">PNG</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Device</label>
                  <select
                    className="w-full mt-1 border rounded px-2 py-2"
                    value={device}
                    onChange={e => setDevice(e.target.value as DeviceType)}
                    disabled={isCapturing}
                  >
                    <option value="mobile">Mobile (375x812)</option>
                    <option value="tablet">Tablet (768x1024)</option>
                    <option value="desktop">Desktop (1920x1080)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="fullPage"
                    checked={fullPage}
                    onChange={e => setFullPage(e.target.checked)}
                    disabled={isCapturing}
                  />
                  <label htmlFor="fullPage" className="text-sm font-medium text-gray-700">Full Page</label>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Delay (seconds)</label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={delay}
                    onChange={e => setDelay(Number(e.target.value))}
                    className="mt-1"
                    disabled={isCapturing}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={!url || !isValidUrl(url) || isCapturing}
                className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Capturing Screenshot...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Capture Screenshot
                  </>
                )}
              </Button>
            </form>

            {/* Status Messages */}
            {status === "capturing" && (
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Processing your request...</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">This may take a few seconds</p>
              </div>
            )}

            {status === "success" && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Screenshot captured successfully!</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <Download className="w-4 h-4" />
                  <span>Downloaded: {lastCapturedTitle}</span>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Failed to capture screenshot</span>
                </div>
                <p className="text-sm text-red-600 mt-1">Please try again or check the URL</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Section */}
        {status === "success" && showPreview && (
          <div className="my-8 text-center">
            {format === "pdf" && screenshotData ? (
              <a
                href={screenshotData}
                download={lastCapturedTitle ? `${lastCapturedTitle}.pdf` : "screenshot.pdf"}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
              >
                Download PDF
              </a>
            ) : format !== "pdf" && screenshotData ? (
              <div>
                <img
                  src={screenshotData}
                  alt="Screenshot preview"
                  className="mx-auto max-w-full max-h-96 border rounded shadow"
                />
                <div className="mt-4 text-green-700 font-medium">Preview - Image downloaded!</div>
              </div>
            ) : null}
          </div>
        )}

  
        {/* Footer */}
        <footer className="text-center mt-16 text-gray-500">
          <p className="text-sm">
            Startup Consulting &bull; Copyright &copy; 2025 screenshots.ai-biz.app. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}
