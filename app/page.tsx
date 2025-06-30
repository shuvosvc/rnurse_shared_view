import { Suspense } from "react"
import SharedDocsContent from "./shared-docs-content"

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Initializing shared documents viewer...</p>
      </div>
    </div>
  )
}

export default function SharedPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SharedDocsContent />
    </Suspense>
  )
}
