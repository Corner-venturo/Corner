import { createSupabaseServerClient } from '@/lib/supabase/server'
import { TimeboxClient } from '@/features/timebox/components/TimeboxClient'
import { redirect } from 'next/navigation'

// Helper function to get the start of the current week (Monday)
const getWeekStart = (date: Date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

async function getInitialTimeboxData() {
  const supabase = createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  const userId = user.id
  const weekStart = getWeekStart(new Date()).toISOString().split('T')[0]

  // Fetch all data in parallel for efficiency
  const [
    { data: boxes },
    { data: weeks },
    { data: scheduledBoxes }
  ] = await Promise.all([
    supabase.from('timebox_boxes').select('*').eq('user_id', userId),
    supabase.from('timebox_weeks').select('*').eq('user_id', userId).eq('week_start', weekStart),
    // We can't know the week_id yet, so we'll fetch this on the client
    // after ensuring the week exists. For now, we pass an empty array.
    Promise.resolve({ data: [] }) 
  ])
  
  let currentWeek = weeks?.[0]

  // If the week record doesn't exist for the current week, create it.
  if (!currentWeek) {
    const { data: newWeek, error } = await supabase
      .from('timebox_weeks')
      .insert({ user_id: userId, week_start: weekStart })
      .select()
      .single()
    
    if (error) {
      console.error("Error creating new week:", error)
    } else {
      currentWeek = newWeek
    }
  }

  return {
    boxes: boxes || [],
    currentWeek: currentWeek || null,
    scheduledBoxes: scheduledBoxes || [], // Will be fetched on client
    user,
  }
}


export default async function TimeboxPage() {
  const initialData = await getInitialTimeboxData()

  return <TimeboxClient initialData={initialData} />
}
