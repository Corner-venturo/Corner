# Foreign Key 健檢報告

執行時間: 2026-03-09 03:36:15
資料庫: Venturo ERP (pfqvdacxowpgfamuvnsn)

---

## 1. 掃描所有 *_id 欄位

找到 821 個 *_id 欄位

## 2. 檢查現有 Foreign Keys

找到 513 個現有 Foreign Keys

## 3. 分析缺失的 Foreign Keys

正在比對...

### 🔴 可能缺失的 Foreign Keys: 162 個

| 表名 | 欄位 | 資料型態 | 可能指向 |
|------|------|----------|----------|
| accounting_accounts | user_id | uuid | users? |
| accounting_entries | supplier_id | uuid | suppliers? |
| accounting_entries | tour_id | uuid | tours? |
| accounting_events | group_id | uuid | groups? |
| accounting_events | source_id | uuid | sources? |
| accounting_transactions | category_id | uuid | categorys? |
| accounting_transactions | user_id | uuid | users? |
| activities | region_id | uuid | regions? |
| activities | supplier_id | uuid | suppliers? |
| advance_items | payment_request_id | text | payment_requests? |
| ai_bots | bot_id | text | bots? |
| assigned_itineraries | itinerary_id | text | itinerarys? |
| body_measurements | user_id | uuid | users? |
| brochure_documents | itinerary_id | uuid | itinerarys? |
| brochure_documents | package_id | uuid | packages? |
| calendar_events | related_order_id | uuid | related_orders? |
| calendar_events | related_tour_id | uuid | related_tours? |
| casual_trips | user_id | uuid | users? |
| companies | tax_id | text | taxs? |
| company_contacts | line_id | text | lines? |
| customers | national_id | text | nationals? |
| customers | online_user_id | uuid | online_users? |
| customers | tax_id | text | taxs? |
| designer_drafts | style_id | text | styles? |
| designer_drafts | user_id | uuid | users? |
| disbursement_orders | refund_id | uuid | refunds? |
| disbursement_requests | disbursement_order_id | uuid | disbursement_orders? |
| disbursement_requests | payment_request_id | uuid | payment_requests? |
| driver_tasks | driver_id | uuid | drivers? |
| driver_tasks | supplier_id | uuid | suppliers? |
| driver_tasks | tour_id | uuid | tours? |
| driver_tasks | tour_request_id | uuid | tour_requests? |
| email_attachments | content_id | text | contents? |
| emails | external_id | text | externals? |
| emails | message_id | text | messages? |
| emails | thread_id | text | threads? |
| employees | supabase_user_id | uuid | supabase_users? |
| employees | user_id | uuid | users? |
| esims | product_id | text | products? |
| expense_categories | user_id | uuid | users? |
| expense_monthly_stats | user_id | uuid | users? |
| expense_streaks | user_id | uuid | users? |
| files | source_email_attachment_id | uuid | source_email_attachments? |
| fleet_drivers | employee_id | uuid | employees? |
| fleet_schedules | tour_id | uuid | tours? |
| flight_status_subscriptions | external_subscription_id | text | external_subscriptions? |
| friends | friend_id | uuid | friends? |
| friends | user_id | uuid | users? |
| image_library | attraction_id | uuid | attractions? |
| image_library | city_id | text | citys? |
| image_library | country_id | text | countrys? |
| itineraries | created_by_legacy_user_id | uuid | created_by_legacy_users? |
| itineraries | erp_itinerary_id | text | erp_itinerarys? |
| itinerary_permissions | user_id | uuid | users? |
| journal_lines | subledger_id | uuid | subledgers? |
| meeting_messages | sender_id | text | senders? |
| meeting_participants | participant_id | text | participants? |
| members | national_id | text | nationals? |
| notes | tab_id | text | tabs? |
| online_trip_members | erp_driver_task_id | uuid | erp_driver_tasks? |
| online_trip_members | erp_employee_id | text | erp_employees? |
| online_trip_members | erp_order_member_id | text | erp_order_members? |
| online_trip_members | user_id | uuid | users? |
| online_trips | erp_itinerary_id | text | erp_itinerarys? |
| online_trips | erp_tour_id | text | erp_tours? |
| order_members | customer_id | uuid | customers? |
| order_members | order_id | uuid | orders? |
| payment_request_items | supplier_id | uuid | suppliers? |
| payment_requests | batch_id | uuid | batchs? |
| payment_requests | order_id | text | orders? |
| payment_requests | supplier_id | uuid | suppliers? |
| payment_requests | tour_id | uuid | tours? |
| payments | order_id | uuid | orders? |
| payments | tour_id | uuid | tours? |
| personal_canvases | employee_id | uuid | employees? |
| personal_expenses | split_expense_id | uuid | split_expenses? |
| personal_expenses | split_group_id | uuid | split_groups? |
| personal_expenses | user_id | uuid | users? |
| personal_records | exercise_id | integer | exercises? |
| personal_records | session_id | uuid | sessions? |
| personal_records | user_id | uuid | users? |
| pnr_passengers | customer_id | text | customers? |
| pnr_passengers | order_member_id | uuid | order_members? |
| pnr_records | tour_id | text | tours? |
| price_list_items | supplier_id | uuid | suppliers? |
| private_messages | receiver_id | uuid | receivers? |
| private_messages | sender_id | uuid | senders? |
| profiles | customer_id | uuid | customers? |
| profiles | employee_id | uuid | employees? |
| progress_photos | user_id | uuid | users? |
| proposal_packages | country_id | text | countrys? |
| proposal_packages | handbook_id | text | handbooks? |
| proposal_packages | itinerary_id | text | itinerarys? |
| proposal_packages | main_city_id | text | main_citys? |
| proposal_packages | quote_id | text | quotes? |
| proposals | converted_tour_id | text | converted_tours? |
| proposals | country_id | text | countrys? |
| proposals | main_city_id | text | main_citys? |
| quote_categories | quote_id | uuid | quotes? |
| quote_items | resource_id | uuid | resources? |
| quote_versions | quote_id | uuid | quotes? |
| quotes | confirmed_by_staff_id | text | confirmed_by_staffs? |
| quotes | customer_id | text | customers? |
| quotes | itinerary_id | text | itinerarys? |
| quotes | tour_id | text | tours? |
| receipts | customer_id | uuid | customers? |
| receipts | order_id | uuid | orders? |
| receipts | transaction_id | text | transactions? |
| request_response_items | resource_id | uuid | resources? |
| rich_documents | canvas_id | uuid | canvas? |
| shared_order_lists | author_id | text | authors? |
| supplier_employees | app_user_id | uuid | app_users? |
| supplier_employees | supplier_id | uuid | suppliers? |
| supplier_users | user_id | uuid | users? |
| tour_confirmation_items | resource_id | uuid | resources? |
| tour_confirmation_items | supplier_id | uuid | suppliers? |
| tour_confirmation_sheets | itinerary_id | text | itinerarys? |
| tour_confirmation_sheets | tour_leader_id | uuid | tour_leaders? |
| tour_expenses | expense_id | bigint | expenses? |
| tour_expenses | leader_id | uuid | leaders? |
| tour_itinerary_items | confirmation_item_id | uuid | confirmation_items? |
| tour_itinerary_items | quote_item_id | text | quote_items? |
| tour_itinerary_items | resource_id | uuid | resources? |
| tour_itinerary_items | supplier_id | uuid | suppliers? |
| tour_members | customer_id | uuid | customers? |
| tour_members | roommate_id | uuid | roommates? |
| tour_members | tour_id | uuid | tours? |
| tour_refunds | member_id | uuid | members? |
| tour_refunds | order_id | uuid | orders? |
| tour_refunds | tour_id | uuid | tours? |
| tour_request_member_vouchers | member_id | uuid | members? |
| tour_request_messages | forwarded_message_id | uuid | forwarded_messages? |
| tour_request_messages | sender_id | uuid | senders? |
| tour_requests | assignee_id | uuid | assignees? |
| tour_requests | order_id | uuid | orders? |
| tour_requests | resource_id | uuid | resources? |
| tour_requests | supplier_id | uuid | suppliers? |
| tour_requests | tour_id | uuid | tours? |
| tours | itinerary_id | text | itinerarys? |
| tours | locked_itinerary_id | text | locked_itinerarys? |
| tours | locked_quote_id | text | locked_quotes? |
| tours | quote_id | text | quotes? |
| transactions | order_id | text | orders? |
| transactions | tour_id | text | tours? |
| travel_invoices | merchant_id | text | merchants? |
| traveler_conversation_members | last_read_message_id | uuid | last_read_messages? |
| traveler_conversation_members | user_id | uuid | users? |
| traveler_messages | sender_id | uuid | senders? |
| traveler_profiles | customer_id | uuid | customers? |
| traveler_split_group_members | user_id | uuid | users? |
| traveler_tour_cache | itinerary_id | text | itinerarys? |
| traveler_tour_cache | order_id | text | orders? |
| traveler_tour_cache | order_member_id | text | order_members? |
| traveler_tour_cache | tour_id | text | tours? |
| traveler_trips | erp_tour_id | uuid | erp_tours? |
| trip_members | app_user_id | text | app_users? |
| trip_members_v2 | customer_id | uuid | customers? |
| user_points_transactions | reference_id | uuid | references? |
| user_roles | user_id | uuid | users? |
| visas | order_id | text | orders? |
| vouchers | source_id | uuid | sources? |
| workspaces | tax_id | text | taxs? |

---

## 4. 統計摘要

| 項目 | 數量 |
|------|------|
| 總表數 | 249 |
| 總 *_id 欄位 | 575 |
| 現有 FK | 513 |
| **可能缺失 FK** | **162** |


## 5. 下一步建議

1. 人工審查上述缺失的 FK 清單
2. 確認哪些欄位真的需要 FK 約束
3. 建立 migration 檔案批次加入 FK
4. 執行前先檢查是否有孤兒記錄

---

執行完成: 2026-03-09 03:36:33
