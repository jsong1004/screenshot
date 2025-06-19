"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Download, Globe, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { downloadImage, generateFilename } from "@/lib/download-utils"

export default function ScreenshotApp() {
  const [url, setUrl] = useState("")
  const [isCapturing, setIsCapturing] = useState(false)
  const [status, setStatus] = useState<"idle" | "capturing" | "success" | "error">("idle")
  const [lastCapturedTitle, setLastCapturedTitle] = useState("")

  const isValidUrl = (string: string) => {
    try {
      new URL(string.startsWith("http") ? string : `https://${string}`)
      return true
    } catch (_) {
      return false
    }
  }

  const captureScreenshot = async () => {
    if (!url || !isValidUrl(url)) return

    setIsCapturing(true)
    setStatus("capturing")

    try {
      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an invalid response. Please try again.")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      // Generate filename and download
      const filename = generateFilename(data.title, data.url)
      const downloadSuccess = downloadImage(data.screenshot, filename)

      if (downloadSuccess) {
        setLastCapturedTitle(data.title)
        setStatus("success")
      } else {
        throw new Error("Failed to download screenshot")
      }
    } catch (error) {
      console.error("Screenshot capture failed:", error)
      setStatus("error")
    } finally {
      setIsCapturing(false)
      // Reset status after 3 seconds
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    captureScreenshot()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">WebCapture</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Capture full-page screenshots of any website instantly. Simply enter a URL and get a high-quality JPG
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
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="url"
                    type="text"
                    placeholder="example.com or https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10 h-12 text-base"
                    disabled={isCapturing}
                  />
                </div>
                {url && !isValidUrl(url) && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Please enter a valid URL
                  </p>
                )}
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

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Full Page Capture</h3>
              <p className="text-sm text-gray-600">Captures the entire webpage, not just the visible area</p>
            </Card>

            <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Auto Download</h3>
              <p className="text-sm text-gray-600">Automatically downloads JPG with website title in filename</p>
            </Card>

            <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">High Quality</h3>
              <p className="text-sm text-gray-600">Generates high-resolution screenshots in JPG format</p>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-500">
          <p className="text-sm">Built with Next.js • Capture any website screenshot instantly</p>
        </footer>
      </div>
    </div>
  )
}
