-- Fix itinerary field names duplication (camelCase vs snake_case)
BEGIN;

-- Copy data from camelCase columns to snake_case columns (if they exist)
UPDATE public.itineraries SET
  departure_date = COALESCE("departureDate", departure_date),
  tour_code = COALESCE("tourCode", tour_code),
  cover_image = COALESCE("coverImage", cover_image),
  outbound_flight = COALESCE("outboundFlight", outbound_flight),
  return_flight = COALESCE("returnFlight", return_flight),
  focus_cards = COALESCE("focusCards", focus_cards),
  meeting_info = COALESCE("meetingInfo", meeting_info),
  itinerary_subtitle = COALESCE("itinerarySubtitle", itinerary_subtitle),
  daily_itinerary = COALESCE("dailyItinerary", daily_itinerary)
WHERE
  "departureDate" IS NOT NULL
  OR "tourCode" IS NOT NULL
  OR "coverImage" IS NOT NULL
  OR "outboundFlight" IS NOT NULL
  OR "returnFlight" IS NOT NULL
  OR "focusCards" IS NOT NULL
  OR "meetingInfo" IS NOT NULL
  OR "itinerarySubtitle" IS NOT NULL
  OR "dailyItinerary" IS NOT NULL;

-- Drop duplicate camelCase columns
ALTER TABLE public.itineraries
DROP COLUMN IF EXISTS "departureDate",
DROP COLUMN IF EXISTS "tourCode",
DROP COLUMN IF EXISTS "coverImage",
DROP COLUMN IF EXISTS "outboundFlight",
DROP COLUMN IF EXISTS "returnFlight",
DROP COLUMN IF EXISTS "focusCards",
DROP COLUMN IF EXISTS "meetingInfo",
DROP COLUMN IF EXISTS "itinerarySubtitle",
DROP COLUMN IF EXISTS "dailyItinerary";

COMMIT;
