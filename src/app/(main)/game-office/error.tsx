'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0f0f1a] gap-4">
      <div className="text-red-400 text-lg">遊戲辦公室載入失敗</div>
      <div className="text-gray-500 text-sm">{error.message}</div>
      <button onClick={reset} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500">
        重試
      </button>
    </div>
  )
}
