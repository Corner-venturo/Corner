export function ModuleLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="flex gap-3">
        <div className="h-10 w-32 bg-muted rounded" />
        <div className="h-10 w-32 bg-muted rounded" />
      </div>
      <div className="h-[400px] w-full bg-muted rounded-lg" />
    </div>
  )
}
