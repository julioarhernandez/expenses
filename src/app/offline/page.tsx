'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <svg
          className="w-8 h-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3l18 18M8.111 8.111A5.97 5.97 0 006 12c0 3.314 2.686 6 6 6a5.97 5.97 0 003.889-1.444M10.59 5.17A6.001 6.001 0 0118 12a5.99 5.99 0 01-.941 3.259M3 3l18 18"
          />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">You&apos;re offline</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          No internet connection. Check your network and try again.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
      >
        Try again
      </button>
    </div>
  )
}
