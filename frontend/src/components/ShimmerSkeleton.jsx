import { cn } from '../utils/cn';

export function ShimmerBlock({ className }) {
  return <div className={cn('rounded-lg bg-white/[0.06] animate-pulse', className)} />;
}

export default function ShimmerSkeleton() {
  return (
    <div className="space-y-4 p-2">
      <ShimmerBlock className="h-10 w-full" />
      <ShimmerBlock className="h-32 w-full" />
      <div className="grid grid-cols-3 gap-3">
        <ShimmerBlock className="h-24" />
        <ShimmerBlock className="h-24" />
        <ShimmerBlock className="h-24" />
      </div>
    </div>
  );
}
