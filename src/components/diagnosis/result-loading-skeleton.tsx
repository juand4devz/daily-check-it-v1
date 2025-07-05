import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, TrendingUp, Brain, Zap, Target } from "lucide-react"

export function ResultLoadingSkeleton() {
  return (
    <div className="mx-auto px-4 py-8 max-w-6xl">
      {/* Header dengan animasi */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <CheckCircle className="h-8 w-8 text-green-600 animate-pulse" />
            <div className="absolute inset-0 h-8 w-8 bg-green-200 rounded-full animate-ping opacity-20"></div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Analyzing Animation */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-16 h-16">
                  <Brain className="w-16 h-16 text-blue-600 animate-pulse" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-blue-300 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-blue-800">Menganalisis Hasil Diagnosa</h3>
                  <p className="text-sm text-blue-600">
                    Sistem sedang memproses data menggunakan metode Dempster-Shafer...
                  </p>
                </div>

                {/* Progress Steps */}
                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">✓ Mengumpulkan gejala yang dipilih</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-4 w-4 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
                    <span className="text-blue-600">Menghitung nilai belief dan plausibility...</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm opacity-50">
                    <Target className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Menyusun rekomendasi solusi</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gejala Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg animate-pulse">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hasil Diagnosa Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600 animate-bounce" />
                <Skeleton className="h-6 w-64" />
              </div>
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-14" />
                      </div>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-50 p-2 rounded animate-pulse">
                          <Skeleton className="h-3 w-12 mb-1" />
                          <Skeleton className="h-4 w-10" />
                        </div>
                        <div className="bg-green-50 p-2 rounded animate-pulse">
                          <Skeleton className="h-3 w-16 mb-1" />
                          <Skeleton className="h-4 w-10" />
                        </div>
                        <div className="bg-orange-50 p-2 rounded animate-pulse">
                          <Skeleton className="h-3 w-14 mb-1" />
                          <Skeleton className="h-4 w-10" />
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                  <Skeleton className="h-2 w-full mb-3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Summary Stats Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg animate-pulse">
                  <Skeleton className="h-6 w-8 mx-auto mb-1" />
                  <Skeleton className="h-3 w-12 mx-auto" />
                </div>
                <div className="p-3 bg-green-50 rounded-lg animate-pulse">
                  <Skeleton className="h-6 w-8 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 mb-2" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Explanation Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-blue-100 rounded animate-pulse"></div>
                <Skeleton className="h-5 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-4/5 mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
