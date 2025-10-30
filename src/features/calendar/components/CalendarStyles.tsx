export function CalendarStyles() {
  return (
    <style jsx global>{`
      /* FullCalendar Morandi 樣式覆蓋 */
      .calendar-container {
        font-family: inherit;
      }

      .fc .fc-toolbar-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #3a3633;
      }

      .fc .fc-button {
        background-color: #c4a572;
        border-color: #c4a572;
        color: white;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        text-transform: none;
        box-shadow: none;
      }

      .fc .fc-button:hover {
        background-color: #b39561;
        border-color: #b39561;
      }

      .fc .fc-button:disabled {
        background-color: #e8e6e3;
        border-color: #e8e6e3;
        color: #8b8680;
        opacity: 0.6;
      }

      .fc .fc-button-primary:not(:disabled).fc-button-active {
        background-color: #b39561;
        border-color: #b39561;
      }

      .fc .fc-col-header-cell {
        background: linear-gradient(to right, rgba(232, 230, 227, 0.4), rgba(196, 165, 114, 0.1), rgba(232, 230, 227, 0.4));
        padding: 0.625rem 1rem;
        font-weight: 500;
        font-size: 0.75rem;
        color: #8b8680;
        border-color: rgba(196, 165, 114, 0.2);
        border-bottom-width: 2px;
      }

      .fc .fc-daygrid-day {
        border-color: rgba(232, 230, 227, 0.4);
      }

      .fc .fc-daygrid-day-frame {
        min-height: 120px;
        background-color: transparent;
      }

      .fc-theme-standard td,
      .fc-theme-standard th {
        border-color: rgba(232, 230, 227, 0.4);
      }

      .fc-theme-standard .fc-scrollgrid {
        border-color: transparent;
      }

      .fc .fc-daygrid-day-top {
        flex-direction: row;
      }

      .fc .fc-daygrid-day-number {
        color: #3a3633;
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
      }

      .fc .fc-daygrid-day-events {
        margin-top: 0;
      }

      .fc .fc-day-today {
        background-color: rgba(217, 210, 200, 0.3) !important;
      }

      .fc .fc-day-today .fc-daygrid-day-number {
        background-color: #c4a572;
        color: white;
        padding: 0.125rem 0.5rem;
        border-radius: 0.375rem;
        font-weight: 600;
        display: inline-block;
        margin: 0.25rem 0 0.25rem 0.5rem;
      }

      .fc .fc-daygrid-day:hover {
        background-color: rgba(58, 54, 51, 0.02);
        cursor: pointer;
      }

      .fc-event {
        cursor: pointer;
        border: none;
        font-size: 0.75rem;
        padding: 0.125rem 0.5rem;
        border-radius: 0.25rem;
        font-weight: 500;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        transition: all 0.2s ease;
        height: 18px;
        line-height: 1.2;
        display: flex;
        align-items: center;
      }

      .fc-event:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
      }

      .fc-event-title {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .fc-daygrid-more-link {
        color: #c4a572 !important;
        font-weight: 500 !important;
        text-decoration: none !important;
        padding: 0.125rem 0.5rem !important;
        border-radius: 0.25rem !important;
        transition: all 0.2s ease !important;
        display: inline-block !important;
        margin-top: 0.25rem !important;
        font-size: 0.75rem !important;
      }

      .fc-daygrid-more-link:hover {
        background-color: rgba(196, 165, 114, 0.1) !important;
        color: #b39561 !important;
      }

      .fc-popover {
        display: none !important;
      }

      .fc .fc-day-sat,
      .fc .fc-day-sun {
        background-color: transparent;
      }

      /* 單日事件樣式 */
      .fc .fc-daygrid-event.fc-event-start.fc-event-end {
        margin: 2px 2px;
        height: 18px;
      }

      /* 跨日事件樣式 */
      .fc .fc-daygrid-event:not(.fc-event-start):not(.fc-event-end),
      .fc .fc-daygrid-event.fc-event-start:not(.fc-event-end),
      .fc .fc-daygrid-event.fc-event-end:not(.fc-event-start) {
        height: 18px;
      }

      /* 生日事件特殊樣式 - 圓形點點 */
      .fc-event[data-event-type='birthday'] {
        border-radius: 50% !important;
        width: 24px !important;
        height: 24px !important;
        padding: 0 !important;
        margin: 2px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        overflow: hidden !important;
        border: none !important;
      }

      .fc-event[data-event-type='birthday'] .fc-event-title {
        font-size: 14px !important;
        line-height: 1 !important;
        text-align: center !important;
      }
    `}</style>
  )
}
