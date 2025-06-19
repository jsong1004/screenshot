"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const [testResult, setTestResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const testAPI = async () => {
    setIsLoading(true)
    setTestResult("Testing...")

    try {
      const response = await fetch("/api/screenshot/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: "example.com" }),
      })

      const data = await response.json()
      setTestResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setTestResult(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testPuppeteer = async () => {
    setIsLoading(true)
    setTestResult("Testing Puppeteer...")

    try {
      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: "example.com" }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        setTestResult(`Non-JSON response: ${text.substring(0, 500)}...`)
        return
      }

      const data = await response.json()
      setTestResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setTestResult(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>API Debug Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testAPI} disabled={isLoading}>
              Test API (No Puppeteer)
            </Button>
            <Button onClick={testPuppeteer} disabled={isLoading}>
              Test Puppeteer API
            </Button>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="text-sm overflow-auto max-h-96">{testResult || "Click a button to test"}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
