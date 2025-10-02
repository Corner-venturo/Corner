export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed top-0 right-0 bottom-0 left-16 bg-white overflow-auto">
      {children}
    </div>
  );
}