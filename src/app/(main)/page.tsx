import { DashboardClient } from '@/features/dashboard/components/DashboardClient'

export default function Home() {
  // This is now a Server Component. 
  // It renders the basic structure and delegates all client-side
  // interactivity and logic to the DashboardClient component.
  return <DashboardClient />
}
