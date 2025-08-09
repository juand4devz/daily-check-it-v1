import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ExplanationSkeleton } from "@/components/diagnosis/explanation-skeleton"

export default function HasilDiagnosaLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Skeleton className="h-10 w-40 mb-4" />
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Ringkasan Gejala Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-1" />
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-4/5 mt-1" />
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
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-64" />
              </div>
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-5 w-8" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-3" />

                      <div className="flex flex-wrap gap-4 mb-3">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-32" />
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <Skeleton className="h-14 rounded" />
                        <Skeleton className="h-14 rounded" />
                        <Skeleton className="h-14 rounded" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-4 w-12 mt-1" />
                    </div>
                  </div>

                  <Skeleton className="h-2 w-full mb-3" />

                  <Skeleton className="h-10 w-full mt-3" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons Skeleton */}
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>

        <div className="lg:col-span-1">
          {/* Summary Stats Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>

              <div>
                <Skeleton className="h-5 w-28 mb-2" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Explanation Card Skeleton */}
          <div className="mt-6">
            <ExplanationSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}
