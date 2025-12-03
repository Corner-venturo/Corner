// src/app/(fitness)/layout.tsx
// This layout applies to all routes inside the (fitness) group.
// It renders the children directly without any sidebars or extra wrappers.

export default function FitnessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
