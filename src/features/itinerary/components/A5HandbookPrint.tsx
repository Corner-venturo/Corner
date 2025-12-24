'use client'

import React from 'react'
import styles from './A5HandbookPrint.module.css'

interface DailyItineraryDay {
  day: number
  title: string
  activities?: Array<{
    time?: string
    title: string
    description?: string
  }>
  meals?: {
    breakfast?: string
    lunch?: string
    dinner?: string
  }
  accommodation?: string
}

interface FlightInfo {
  airline?: string
  flightNumber?: string
  departureAirport?: string
  departureTime?: string
  arrivalAirport?: string
  arrivalTime?: string
  departureDate?: string
}

interface A5HandbookData {
  // 封面
  title: string
  subtitle?: string
  tagline?: string
  coverImage?: string
  tourCode?: string
  departureDate?: string

  // 航班
  outboundFlight?: FlightInfo
  returnFlight?: FlightInfo

  // 每日行程
  dailyItinerary: DailyItineraryDay[]

  // 其他
  companyName?: string
  companyPhone?: string
  leaderName?: string
  leaderPhone?: string
}

interface A5HandbookPrintProps {
  data: A5HandbookData
}

export function A5HandbookPrint({ data }: A5HandbookPrintProps) {
  const totalDays = data.dailyItinerary.length

  return (
    <div className={styles.handbook}>
      {/* 封面頁 */}
      <div className={`${styles.page} ${styles.coverPage}`}>
        <div
          className={styles.coverBackground}
          style={{ backgroundImage: data.coverImage ? `url(${data.coverImage})` : undefined }}
        />
        <div className={styles.coverOverlay} />
        <div className={styles.coverContent}>
          {data.tagline && <p className={styles.tagline}>{data.tagline}</p>}
          <h1 className={styles.title}>{data.title}</h1>
          {data.subtitle && <p className={styles.subtitle}>{data.subtitle}</p>}
          <div className={styles.tourInfo}>
            {data.tourCode && <span className={styles.tourCode}>{data.tourCode}</span>}
            {data.departureDate && <span className={styles.departureDate}>{data.departureDate}</span>}
          </div>
          <p className={styles.duration}>{totalDays}天{totalDays - 1}夜</p>
        </div>
        <div className={styles.coverFooter}>
          <span>{data.companyName || 'Corner Travel'}</span>
        </div>
      </div>

      {/* 航班資訊頁 */}
      {(data.outboundFlight || data.returnFlight) && (
        <div className={`${styles.page} ${styles.flightPage}`}>
          <h2 className={styles.pageTitle}>航班資訊</h2>
          <div className={styles.flightCards}>
            {data.outboundFlight && (
              <div className={styles.flightCard}>
                <div className={styles.flightHeader}>去程</div>
                <div className={styles.flightBody}>
                  <div className={styles.flightRoute}>
                    <span className={styles.airport}>{data.outboundFlight.departureAirport || 'TPE'}</span>
                    <span className={styles.flightArrow}>✈</span>
                    <span className={styles.airport}>{data.outboundFlight.arrivalAirport}</span>
                  </div>
                  <div className={styles.flightDetails}>
                    <p><strong>航班：</strong>{data.outboundFlight.airline} {data.outboundFlight.flightNumber}</p>
                    <p><strong>日期：</strong>{data.outboundFlight.departureDate}</p>
                    <p><strong>時間：</strong>{data.outboundFlight.departureTime} → {data.outboundFlight.arrivalTime}</p>
                  </div>
                </div>
              </div>
            )}
            {data.returnFlight && (
              <div className={styles.flightCard}>
                <div className={styles.flightHeader}>回程</div>
                <div className={styles.flightBody}>
                  <div className={styles.flightRoute}>
                    <span className={styles.airport}>{data.returnFlight.departureAirport}</span>
                    <span className={styles.flightArrow}>✈</span>
                    <span className={styles.airport}>{data.returnFlight.arrivalAirport || 'TPE'}</span>
                  </div>
                  <div className={styles.flightDetails}>
                    <p><strong>航班：</strong>{data.returnFlight.airline} {data.returnFlight.flightNumber}</p>
                    <p><strong>日期：</strong>{data.returnFlight.departureDate}</p>
                    <p><strong>時間：</strong>{data.returnFlight.departureTime} → {data.returnFlight.arrivalTime}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 領隊資訊 */}
          {(data.leaderName || data.companyPhone) && (
            <div className={styles.contactInfo}>
              <h3>聯絡資訊</h3>
              {data.leaderName && <p><strong>領隊：</strong>{data.leaderName} {data.leaderPhone}</p>}
              {data.companyPhone && <p><strong>公司：</strong>{data.companyPhone}</p>}
            </div>
          )}
        </div>
      )}

      {/* 每日行程頁 */}
      {data.dailyItinerary.map((day, index) => (
        <div key={index} className={`${styles.page} ${styles.dayPage}`}>
          <div className={styles.dayHeader}>
            <span className={styles.dayBadge}>Day {day.day}</span>
            <h2 className={styles.dayTitle}>{day.title}</h2>
          </div>

          <div className={styles.dayContent}>
            {/* 行程活動 */}
            {day.activities && day.activities.length > 0 && (
              <div className={styles.activities}>
                {day.activities.map((activity, actIndex) => (
                  <div key={actIndex} className={styles.activityItem}>
                    {activity.time && <span className={styles.activityTime}>{activity.time}</span>}
                    <div className={styles.activityContent}>
                      <strong>{activity.title}</strong>
                      {activity.description && <p>{activity.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 餐食 */}
            {day.meals && (
              <div className={styles.meals}>
                <div className={styles.mealItem}>
                  <span className={styles.mealLabel}>早</span>
                  <span className={styles.mealValue}>{day.meals.breakfast || '敬請自理'}</span>
                </div>
                <div className={styles.mealItem}>
                  <span className={styles.mealLabel}>午</span>
                  <span className={styles.mealValue}>{day.meals.lunch || '敬請自理'}</span>
                </div>
                <div className={styles.mealItem}>
                  <span className={styles.mealLabel}>晚</span>
                  <span className={styles.mealValue}>{day.meals.dinner || '敬請自理'}</span>
                </div>
              </div>
            )}

            {/* 住宿 */}
            {day.accommodation && (
              <div className={styles.accommodation}>
                <span className={styles.accommodationLabel}>🏨 住宿</span>
                <span className={styles.accommodationValue}>{day.accommodation}</span>
              </div>
            )}
          </div>

          <div className={styles.pageFooter}>
            <span>{data.tourCode}</span>
            <span>第 {index + 2} 頁</span>
          </div>
        </div>
      ))}

      {/* 備註頁 */}
      <div className={`${styles.page} ${styles.notesPage}`}>
        <h2 className={styles.pageTitle}>旅遊須知</h2>
        <div className={styles.notesContent}>
          <div className={styles.noteSection}>
            <h3>行李規定</h3>
            <ul>
              <li>託運行李：每人限重 23 公斤</li>
              <li>手提行李：每人限重 7 公斤</li>
            </ul>
          </div>
          <div className={styles.noteSection}>
            <h3>注意事項</h3>
            <ul>
              <li>請務必攜帶有效護照</li>
              <li>請於航班起飛前 2 小時抵達機場</li>
              <li>請確認護照有效期超過 6 個月</li>
            </ul>
          </div>
        </div>
        <div className={styles.companyInfo}>
          <p><strong>{data.companyName || 'Corner Travel'}</strong></p>
          {data.companyPhone && <p>電話：{data.companyPhone}</p>}
        </div>
      </div>
    </div>
  )
}
