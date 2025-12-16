export function CalendarStyles() {
  return (
    <style jsx global>{`
      /* FullCalendar CIS v2.1 樣式 */
      .calendar-container {
        font-family: inherit;
      }

      .fc .fc-toolbar-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #333333;
      }

      .fc .fc-button {
        background-color: #B8A99A;
        border-color: #B8A99A;
        color: white;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        text-transform: none;
        box-shadow: none;
      }

      .fc .fc-button:hover {
        background-color: #9E8C7A;
        border-color: #9E8C7A;
      }

      .fc .fc-button:disabled {
        background-color: #E8E4E0;
        border-color: #E8E4E0;
        color: #8C8C8C;
        opacity: 0.6;
      }

      .fc .fc-button-primary:not(:disabled).fc-button-active {
        background-color: #9E8C7A;
        border-color: #9E8C7A;
      }

      /* 星期標題列 */
      .fc .fc-col-header-cell {
        background-color: rgba(249, 248, 246, 0.4);
        padding: 0.75rem 1rem;
        font-weight: 700;
        font-size: 11px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(51, 51, 51, 0.6);
        border-color: #E8E4E0;
        border-bottom-width: 1px;
      }

      /* 周末標題特殊顏色 */
      .fc .fc-col-header-cell.fc-day-sat,
      .fc .fc-col-header-cell.fc-day-sun {
        color: #B8A99A;
      }

      /* 日曆格子 */
      .fc .fc-daygrid-day {
        border-color: #E8E4E0;
        transition: background-color 0.2s;
      }

      .fc .fc-daygrid-day-frame {
        min-height: 140px;
        padding: 8px;
        background-color: transparent;
      }

      .fc-theme-standard td,
      .fc-theme-standard th {
        border-color: #E8E4E0;
      }

      .fc-theme-standard .fc-scrollgrid {
        border-color: #E8E4E0;
        border-top: 1px solid #E8E4E0;
        border-left: 1px solid #E8E4E0;
      }

      /* 日期數字 */
      .fc .fc-daygrid-day-top {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
      }

      .fc .fc-daygrid-day-number {
        color: #333333;
        padding: 4px;
        font-size: 14px;
        font-weight: 500;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .fc .fc-daygrid-day-number:hover {
        background-color: #F9F8F6;
      }

      /* 周末日期顏色 */
      .fc .fc-day-sat .fc-daygrid-day-number,
      .fc .fc-day-sun .fc-daygrid-day-number {
        color: #B8A99A;
        font-weight: 600;
      }

      /* 周末格子背景 */
      .fc .fc-day-sat,
      .fc .fc-day-sun {
        background-color: rgba(249, 248, 246, 0.5);
      }

      /* 今天 */
      .fc .fc-day-today {
        background-color: rgba(184, 169, 154, 0.05) !important;
      }

      .fc .fc-day-today .fc-daygrid-day-number {
        background-color: #B8A99A;
        color: white;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        font-weight: 700;
        box-shadow: 0 2px 4px rgba(184, 169, 154, 0.3);
      }

      /* Hover 效果 */
      .fc .fc-daygrid-day:hover {
        background-color: rgba(249, 248, 246, 0.8);
        cursor: pointer;
      }

      /* 事件樣式 */
      .fc .fc-daygrid-day-events {
        margin-top: 4px;
      }

      .fc-event {
        cursor: pointer;
        border: none;
        border-left: 2px solid currentColor;
        font-size: 11px;
        padding: 4px 6px;
        border-radius: 0 4px 4px 0;
        font-weight: 500;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
        margin: 2px 4px;
        background-color: rgba(184, 169, 154, 0.1);
        color: #333333;
      }

      .fc-event:hover {
        background-color: rgba(184, 169, 154, 0.2);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .fc-event-title {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* 更多連結 */
      .fc-daygrid-more-link {
        color: #B8A99A !important;
        font-weight: 600 !important;
        text-decoration: none !important;
        padding: 2px 6px !important;
        border-radius: 4px !important;
        transition: all 0.2s ease !important;
        display: inline-block !important;
        margin-top: 4px !important;
        font-size: 10px !important;
        background-color: rgba(184, 169, 154, 0.1) !important;
      }

      .fc-daygrid-more-link:hover {
        background-color: rgba(184, 169, 154, 0.2) !important;
        color: #9E8C7A !important;
      }

      .fc-popover {
        display: none !important;
      }

      /* 非當月日期 - 隱藏 */
      .fc .fc-day-other {
        visibility: hidden;
      }

      .fc .fc-day-other .fc-daygrid-day-number,
      .fc .fc-day-other .fc-daygrid-day-events {
        display: none;
      }

      /* 事件顏色類型 */
      .fc-event[data-event-type='tour'] {
        border-left-color: #8FA9C2;
        background-color: rgba(143, 169, 194, 0.2);
      }

      .fc-event[data-event-type='meeting'] {
        border-left-color: #B8A99A;
        background-color: rgba(184, 169, 154, 0.1);
      }

      .fc-event[data-event-type='deadline'] {
        border-left-color: #C77D7D;
        background-color: rgba(199, 125, 125, 0.1);
      }

      .fc-event[data-event-type='holiday'] {
        border-left-color: #8FA38F;
        background-color: rgba(143, 163, 143, 0.2);
      }

      .fc-event[data-event-type='task'] {
        border-left-color: #D4B483;
        background-color: rgba(212, 180, 131, 0.1);
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
        border-left: none !important;
      }

      .fc-event[data-event-type='birthday'] .fc-event-title {
        font-size: 14px !important;
        line-height: 1 !important;
        text-align: center !important;
      }

      /* 單日事件樣式 */
      .fc .fc-daygrid-event.fc-event-start.fc-event-end {
        margin: 2px 4px;
      }

      /* 跨日事件樣式 */
      .fc .fc-daygrid-event:not(.fc-event-start):not(.fc-event-end) {
        border-left: none;
        border-radius: 0;
        opacity: 0.7;
      }

      .fc .fc-daygrid-event.fc-event-start:not(.fc-event-end) {
        border-radius: 0 0 0 0;
        margin-right: 0;
      }

      .fc .fc-daygrid-event.fc-event-end:not(.fc-event-start) {
        border-left: none;
        border-radius: 0 4px 4px 0;
        margin-left: 0;
      }
    `}</style>
  )
}
