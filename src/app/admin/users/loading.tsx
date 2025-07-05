export default function UsersLoading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-200 rounded w-64"></div>
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded"></div>
                    ))}
                </div>

                {/* Filters */}
                <div className="h-20 bg-gray-200 rounded"></div>

                {/* Table */}
                <div className="space-y-4">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        </div>
    )
}
