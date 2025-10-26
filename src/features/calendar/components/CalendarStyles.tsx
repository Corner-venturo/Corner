export function CalendarStyles() {
  return (
    <style jsx global>{`
      /* FullCalendar Morandi 樣式覆蓋 */
      .calendar-container {
        font-family: inherit;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(243, 240, 235, 0.85));
        border-radius: 1.25rem;
        box-shadow: 0 25px 50px -12px rgba(17, 24, 39, 0.15);
        border: 1px solid rgba(196, 180, 150, 0.3);
        backdrop-filter: blur(12px);
      }

      .calendar-container .fc {
        flex: 1 1 auto;
      }

      .calendar-container .fc-view-harness {
        flex: 1 1 auto;
      }

      .calendar-container .fc-scrollgrid,
      .calendar-container .fc-scrollgrid-section,
      .calendar-container .fc-scrollgrid-sync-inner {
        background-color: transparent;
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
        background-color: #f6f4f1;
        padding: 1rem 0.5rem;
        font-weight: 500;
        color: #8b8680;
        border-color: #e8e6e3;
      }

      .fc .fc-daygrid-day {
        border-color: #e8e6e3;
        transition: background-color 0.2s ease;
      }

      .fc .fc-daygrid-day-frame {
        min-height: 120px;
        padding: 0.25rem;
      }

      .fc .fc-daygrid-day-number {
        color: #3a3633;
        padding: 0.5rem;
        font-size: 0.875rem;
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
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-weight: 500;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        transition: all 0.2s ease;
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

      .fc-event[data-event-type='tour'] {
        background: linear-gradient(135deg, rgba(155, 181, 214, 0.9), rgba(115, 151, 194, 0.9));
        color: #243b53;
      }

      .fc-event[data-event-type='personal'] {
        background: linear-gradient(135deg, rgba(184, 169, 209, 0.9), rgba(162, 143, 194, 0.9));
        color: #2f2a26;
      }

      .fc-event[data-event-type='company'] {
        background: linear-gradient(135deg, rgba(224, 195, 160, 0.95), rgba(204, 168, 128, 0.95));
        color: #2f2a26;
      }

      .fc-event[data-event-type='birthday'] {
        background: linear-gradient(135deg, rgba(230, 184, 200, 0.95), rgba(214, 157, 177, 0.95));
        color: #5a2533;
      }

      .fc-popover {
        display: none !important;
      }

      .fc .fc-day-sat,
      .fc .fc-day-sun {
        background-color: transparent;
      }

      @media (max-width: 1280px) {
        .fc .fc-daygrid-day-frame {
          min-height: 100px;
        }

        .calendar-container {
          border-radius: 1rem;
        }
      }

      @media (max-width: 1024px) {
        .fc .fc-daygrid-day-frame {
          min-height: 90px;
        }

        .fc .fc-daygrid-day-number {
          font-size: 0.8125rem;
        }
      }

      @media (max-width: 768px) {
        .fc .fc-daygrid-day-frame {
          min-height: 80px;
        }

        .fc .fc-daygrid-day-number {
          font-size: 0.75rem;
        }

        .fc .fc-daygrid-more-link {
          font-size: 0.6875rem !important;
        }
      }
    `}</style>
  )
}
