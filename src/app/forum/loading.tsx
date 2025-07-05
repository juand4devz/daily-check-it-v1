import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ForumLoading() {
    return (
        <div className='space-y-4 mx-auto'>
            {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className='p-4'>
                    <div className="flex items-start gap-4">
                        <Skeleton className='h-10 w-10 rounded-full' />
                        <div className='flex-1 space-y-2'>
                            <Skeleton className='h-4 w-3/4' />
                            <Skeleton className='h-3 w-1/2' />
                            <div className='flex gap-2'>
                                <Skeleton className='h-5 w-16' />
                                <Skeleton className='h-5 w-16' />
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
