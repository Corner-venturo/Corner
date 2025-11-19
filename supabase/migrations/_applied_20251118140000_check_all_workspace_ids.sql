-- 檢查所有表格的 workspace_id 狀態
-- 這個 migration 只是檢查，不會修改任何資料

DO $$
DECLARE
    table_record RECORD;
    null_count INT;
    total_count INT;
    query TEXT;
    has_column BOOLEAN;
BEGIN
    RAISE NOTICE '=== 檢查所有表格的 workspace_id 狀態 ===';
    RAISE NOTICE '';

    -- 需要檢查的表格列表
    FOR table_record IN
        SELECT unnest(ARRAY[
            'tours', 'orders', 'quotes', 'customers', 'itineraries',
            'payment_requests', 'disbursement_orders', 'receipt_orders',
            'visas', 'suppliers', 'calendar_events', 'todos',
            'confirmations', 'attractions', 'receipts', 'channels', 'messages'
        ]) as table_name
    LOOP
        -- 檢查表格是否存在且有 workspace_id 欄位
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = table_record.table_name
            AND column_name = 'workspace_id'
        ) INTO has_column;

        IF NOT has_column THEN
            RAISE NOTICE '⚠️  % - 沒有 workspace_id 欄位', table_record.table_name;
            CONTINUE;
        END IF;

        -- 計算 NULL 數量
        query := format('SELECT COUNT(*) FROM public.%I WHERE workspace_id IS NULL', table_record.table_name);
        EXECUTE query INTO null_count;

        -- 計算總數
        query := format('SELECT COUNT(*) FROM public.%I', table_record.table_name);
        EXECUTE query INTO total_count;

        IF null_count > 0 THEN
            RAISE NOTICE '❌ % - %/% 筆 workspace_id 為 NULL', table_record.table_name, null_count, total_count;
        ELSIF total_count > 0 THEN
            RAISE NOTICE '✅ % - 全部 % 筆都有 workspace_id', table_record.table_name, total_count;
        ELSE
            RAISE NOTICE '⚪ % - 表格是空的', table_record.table_name;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '=== 檢查完畢 ===';
END $$;
