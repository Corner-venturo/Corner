'use client'

import React from 'react'
import Image from 'next/image'
import styles from './PrintItineraryPreview.module.css'

// Define the data interfaces directly in the file for clarity
interface DailyScheduleItem {
  day: string
  route: string
  meals: { breakfast: string; lunch: string; dinner: string }
  accommodation: string
}

interface FlightOption {
  airline: string
  outbound: { code: string; from: string; fromCode: string; time: string; to: string; toCode: string; arrivalTime: string }
  return: { code: string; from: string; fromCode: string; time: string; to: string; toCode: string; arrivalTime: string }
}

interface HighlightSpot {
  name: string
  nameEn: string
  tags: string[]
  description: string
  imageUrl?: string
}

interface PrintItineraryData {
  coverImage: string
  tagline: string
  taglineEn: string
  title: string
  subtitle: string
  price: string
  priceNote: string
  country: string
  city: string
  dailySchedule: DailyScheduleItem[]
  flightOptions: FlightOption[]
  highlightImages: string[]
  highlightSpots: HighlightSpot[]
}

interface PrintItineraryPreviewProps {
  data: Partial<PrintItineraryData>
}

// --- Reusable Helper Components ---
const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className={styles.sectionHeader}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    <p className={styles.sectionSubtitle}>{subtitle}</p>
  </div>
)

export function PrintItineraryPreview({ data }: PrintItineraryPreviewProps) {
  // Fallback for missing data to prevent errors
  const safeData = {
    ...{
      highlightSpots: [],
      flightOptions: [],
      dailySchedule: [],
    },
    ...data,
  }

  return (
    <div className={styles.wrapper}>
      {/* --- Hero Section --- */}
      <header className={styles.hero} style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url('${safeData.coverImage || '/placeholder.jpg'}')` }}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h2>{safeData.tagline}</h2>
            <h1>{safeData.title || '行程標題'}</h1>
            <p>{safeData.subtitle || '此處顯示行程的副標題或描述'}</p>
          </div>
        </div>
      </header>

      {/* --- Highlights Section --- */}
      <section className={`${styles.section} ${styles.container}`}>
        <SectionHeader title="行程特色" subtitle="Highlights" />
        <div className={styles.highlightsGrid}>
          {safeData.highlightSpots.map((spot, index) => (
            <div key={index}>
              <Image 
                src={spot.imageUrl || '/placeholder.jpg'} 
                alt={spot.name} 
                width={600} 
                height={400} 
                className={styles.highlightCardImage}
              />
              <h3 className={styles.highlightTitle}>{spot.name}</h3>
              <p className={styles.highlightDesc}>{spot.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Flights Section --- */}
      {safeData.flightOptions.length > 0 && (
        <section className={`${styles.section} ${styles.container}`}>
          <SectionHeader title="參考航班" subtitle="Flights Information" />
          <div className={styles.flightsTableWrapper}>
            <table className={styles.flightsTable}>
              <thead>
                <tr>
                  <th>航空公司</th>
                  <th>航班號碼</th>
                  <th>起飛地</th>
                  <th>目的地</th>
                  <th>起飛時間</th>
                  <th>抵達時間</th>
                </tr>
              </thead>
              <tbody>
                {safeData.flightOptions.map((flight, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td>{flight.airline}</td>
                      <td>{flight.outbound.code}</td>
                      <td>{`${flight.outbound.from} (${flight.outbound.fromCode})`}</td>
                      <td>{`${flight.outbound.to} (${flight.outbound.toCode})`}</td>
                      <td>{flight.outbound.time}</td>
                      <td>{flight.outbound.arrivalTime}</td>
                    </tr>
                    <tr>
                      <td>{flight.airline}</td>
                      <td>{flight.return.code}</td>
                      <td>{`${flight.return.from} (${flight.return.fromCode})`}</td>
                      <td>{`${flight.return.to} (${flight.return.toCode})`}</td>
                      <td>{flight.return.time}</td>
                      <td>{flight.return.arrivalTime}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* --- Itinerary Section --- */}
      <section className={`${styles.section} ${styles.container}`}>
        <SectionHeader title="行程規劃" subtitle="Daily Itinerary" />
        <div className={styles.itineraryList}>
          {safeData.dailySchedule.map((day, index) => (
            <div className={styles.dayItem} key={index}>
              <div className={styles.dayBadge}>{day.day}</div>
              <div className={styles.dayContent}>
                <p className={styles.dayRoute}>{day.route}</p>
                <p className={styles.dayDetails}>
                  <strong>餐食：</strong>
                  早 {day.meals.breakfast} / 
                  午 {day.meals.lunch} / 
                  晚 {day.meals.dinner}
                </p>
                <p className={styles.dayHotel}>
                  <strong>住宿：</strong>
                  {day.accommodation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- Cost Section --- */}
      {safeData.price && (
        <section className={`${styles.section} ${styles.container}`}>
          <SectionHeader title="團費說明" subtitle="Pricing Details" />
          <div className={styles.costCard}>
            <div className={styles.costHeader}>參考費用</div>
            <div className={styles.costPrice}>
              NT$ {safeData.price} <small>{safeData.priceNote || '起'}</small>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
