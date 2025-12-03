/**
 * 入住憑證工具的專用佈局
 * 移除 Venturo 系統的側邊欄和底部導航
 */

export default function HotelVoucherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
