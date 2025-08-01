import { Skeleton } from "@/components/ui/skeleton";

export default function GejalaPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between mb-6 space-y-4 md:space-y-0">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-md" />
            <Skeleton className="h-4 w-96 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full sm:w-48" />
          <Skeleton className="h-10 w-full sm:w-48" />
        </div>
        <Skeleton className="h-[60vh] w-full rounded-md" />
      </div>
    </div>
  )
}
