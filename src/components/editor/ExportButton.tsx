'use client'

export function ExportButton({ data }: { data: any }) {
  const exportHTML = () => {
    const html = generateFullHTML(data)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.tourCode || 'tour'}.html`
    a.click()
  }

  const generateFullHTML = data => {
    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - Venturo Travel</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <!-- Hero Section -->
    <section class="relative h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative z-10 h-full flex items-center justify-center">
        <div class="text-center px-4">
          <h1 class="text-5xl md:text-7xl font-bold mb-4">${data.title}</h1>
          <p class="text-xl md:text-2xl mb-8 opacity-90">${data.subtitle}</p>
          <div class="flex flex-wrap justify-center gap-6">
            <div class="bg-white/20 backdrop-blur px-6 py-3 rounded-full">
              <div class="text-sm opacity-80">出發日期</div>
              <div class="text-xl font-bold">${data.departureDate}</div>
            </div>
            <div class="bg-white/20 backdrop-blur px-6 py-3 rounded-full">
              <div class="text-sm opacity-80">團費</div>
              <div class="text-xl font-bold">NT$ ${data.price?.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Attractions -->
    <section class="py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-4xl font-bold text-center mb-12">精選景點</h2>
        <div class="grid md:grid-cols-3 gap-6">
          ${data.attractions
            .map(
              a => `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
              <div class="h-48 bg-gradient-to-br from-blue-400 to-purple-400"></div>
              <div class="p-6">
                <h3 class="text-xl font-bold mb-2">${a.title}</h3>
                <p class="text-gray-600">${a.description}</p>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </section>

    <!-- Leader Info -->
    <section class="py-12 bg-white">
      <div class="max-w-4xl mx-auto px-4">
        <div class="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8">
          <h3 class="text-2xl font-bold mb-6">領隊資訊</h3>
          <div class="grid md:grid-cols-3 gap-4">
            <div>
              <div class="text-sm text-gray-600">領隊姓名</div>
              <div class="font-bold">${data.leader.name}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">國內電話</div>
              <div class="font-bold">${data.leader.phone}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">國外電話</div>
              <div class="font-bold">${data.leader.overseasPhone}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
</body>
</html>
    `
  }

  return (
    <button
      onClick={exportHTML}
      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
    >
      📥 匯出 HTML
    </button>
  )
}
