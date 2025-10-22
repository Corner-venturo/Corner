export default function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 純淨的 layout，不包含管理系統的側邊欄和導航
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
