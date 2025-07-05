import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DiagnosaLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-80" />
        </div>
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Alert Skeleton */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="mt-2 flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardContent>
      </Card>

      {/* Controls Skeleton */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-10 w-[180px] rounded-md" />
            <Skeleton className="h-10 w-[180px] rounded-md" />
          </div>
          <Skeleton className="h-10 w-[140px] rounded-md" />
        </div>

        <div className="flex items-center justify-between text-sm">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Gejala Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 12 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="relative">
              <Skeleton className="h-32 w-full" />
              <div className="absolute top-2 left-2">
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <div className="absolute top-2 right-2">
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <div className="absolute bottom-2 right-2">
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Button Skeleton */}
      <div className="sticky bottom-4 bg-white border rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex flex-wrap gap-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-[150px] rounded-md" />
        </div>
      </div>
    </div>
  )
}
