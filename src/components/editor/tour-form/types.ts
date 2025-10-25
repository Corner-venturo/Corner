export interface FlightInfo {
  airline: string;
  flightNumber: string;
  departureAirport: string;
  departureTime: string;
  departureDate: string;
  arrivalAirport: string;
  arrivalTime: string;
  duration?: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface FocusCard {
  title: string;
  src: string;
}

export interface Activity {
  icon: string;
  title: string;
  description: string;
}

export interface Meals {
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface DailyItinerary {
  dayLabel: string;
  date: string;
  title: string;
  highlight?: string;
  description?: string;
  activities: Activity[];
  recommendations: string[];
  meals: Meals;
  accommodation: string;
}

export interface LeaderInfo {
  name: string;
  domesticPhone: string;
  overseasPhone: string;
}

export interface MeetingInfo {
  time: string;
  location: string;
}

export interface TourFormData {
  tagline: string;
  title: string;
  subtitle: string;
  description: string;
  country: string;
  city: string;
  departureDate: string;
  tourCode: string;
  coverImage?: string;
  outboundFlight: FlightInfo;
  returnFlight: FlightInfo;
  features: Feature[];
  focusCards: FocusCard[];
  leader: LeaderInfo;
  meetingInfo: MeetingInfo;
  itinerarySubtitle: string;
  dailyItinerary: DailyItinerary[];
}

export interface IconOption {
  value: string;
  label: string;
  component: React.ComponentType<{ className?: string }>;
}

export interface CityOption {
  code: string;
  name: string;
}
