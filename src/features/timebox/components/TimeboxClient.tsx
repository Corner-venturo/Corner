'use client'

import { useState } from 'react'

export function TimeboxClient({ initialData }) {
  // Logic for the interactive timebox grid will go here
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">箱型時間 (Timebox)</h1>
      <div className="border rounded-lg p-4 min-h-[500px] bg-gray-50">
        <p className="text-gray-500">Timebox grid will be rendered here.</p>
        <pre className="mt-4 text-xs bg-gray-100 p-2 rounded">
          {JSON.stringify(initialData, null, 2)}
        </pre>
      </div>
    </div>
  )
}
