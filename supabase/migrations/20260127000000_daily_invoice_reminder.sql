-- =====================================================
-- 每日開票提醒通知
-- 每天早上 10:00 (UTC+8) 自動發送
-- =====================================================

-- 系統機器人 ID
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_bot_id') THEN
    CREATE DOMAIN system_bot_id AS uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;
END $$;

-- 1. 建立發送開票提醒的函數
CREATE OR REPLACE FUNCTION send_daily_invoice_reminder()
RETURNS integer AS $$
DECLARE
  v_bot_id uuid := '00000000-0000-0000-0000-000000000001';
  v_channel_id uuid;
  v_employee record;
  v_sent_count integer := 0;
  v_message text;
  v_pending_count integer;
BEGIN
  -- 查詢待開發票數量
  SELECT COUNT(*) INTO v_pending_count
  FROM orders o
  WHERE o.paid_amount > 0
    AND o.paid_amount > COALESCE((
      SELECT SUM(io.amount)
      FROM invoice_orders io
      JOIN travel_invoices ti ON ti.id = io.invoice_id
      WHERE io.order_id = o.id
        AND ti.status NOT IN ('voided', 'failed')
    ), 0);

  -- 如果沒有待開發票，不發送通知
  IF v_pending_count = 0 THEN
    RETURN 0;
  END IF;

  -- 組裝訊息
  v_message := format(
    '📋 每日開票提醒

目前有 %s 筆訂單待開發票

請至「代轉發票管理」頁面處理
/finance/travel-invoice',
    v_pending_count
  );

  -- 發送給所有有會計權限的員工
  FOR v_employee IN
    SELECT e.id, e.workspace_id
    FROM employees e
    WHERE e.status = 'active'
      AND (
        e.roles @> '["accountant"]'::jsonb
        OR e.roles @> '["admin"]'::jsonb
        OR e.roles @> '["super_admin"]'::jsonb
      )
  LOOP
    -- 查找或建立 DM 頻道
    SELECT id INTO v_channel_id
    FROM channels
    WHERE type = 'direct'
      AND (
        name = format('dm:%s:%s', v_bot_id, v_employee.id)
        OR name = format('dm:%s:%s', v_employee.id, v_bot_id)
      )
    LIMIT 1;

    -- 如果頻道不存在，建立它
    IF v_channel_id IS NULL THEN
      INSERT INTO channels (name, type, channel_type, workspace_id, created_by)
      VALUES (
        format('dm:%s:%s', v_bot_id, v_employee.id),
        'direct',
        'DIRECT',
        v_employee.workspace_id,
        v_bot_id
      )
      RETURNING id INTO v_channel_id;

      -- 加入成員
      INSERT INTO channel_members (channel_id, employee_id, role, workspace_id)
      VALUES
        (v_channel_id, v_bot_id, 'owner', v_employee.workspace_id),
        (v_channel_id, v_employee.id, 'member', v_employee.workspace_id)
      ON CONFLICT DO NOTHING;
    END IF;

    -- 發送訊息
    INSERT INTO messages (channel_id, content, author_id, metadata)
    VALUES (
      v_channel_id,
      v_message,
      v_bot_id,
      jsonb_build_object(
        'type', 'bot_notification',
        'notification_type', 'info',
        'category', 'invoice_reminder'
      )
    );

    v_sent_count := v_sent_count + 1;
  END LOOP;

  -- 記錄執行結果
  INSERT INTO cron_execution_logs (job_name, result, success)
  VALUES (
    'daily_invoice_reminder',
    jsonb_build_object(
      'sent_count', v_sent_count,
      'pending_invoices', v_pending_count
    ),
    true
  );

  RETURN v_sent_count;
EXCEPTION WHEN OTHERS THEN
  -- 記錄錯誤
  INSERT INTO cron_execution_logs (job_name, success, error_message)
  VALUES ('daily_invoice_reminder', false, SQLERRM);
  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION send_daily_invoice_reminder() IS '每日發送開票提醒給會計人員';

-- 2. 設定 pg_cron 排程
-- 每天早上 10:00 (UTC+8 = 02:00 UTC)

-- 先刪除已存在的任務
SELECT cron.unschedule('daily_invoice_reminder')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily_invoice_reminder'
);

-- 建立排程
SELECT cron.schedule(
  'daily_invoice_reminder',
  '0 2 * * *',  -- 02:00 UTC = 10:00 台北時間
  $$SELECT send_daily_invoice_reminder()$$
);

-- 3. 手動執行函數（測試用）
CREATE OR REPLACE FUNCTION run_invoice_reminder_now()
RETURNS TABLE (
  sent_count integer,
  executed_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    send_daily_invoice_reminder() as sent_count,
    now() as executed_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION run_invoice_reminder_now() IS '手動執行開票提醒（測試用）';
