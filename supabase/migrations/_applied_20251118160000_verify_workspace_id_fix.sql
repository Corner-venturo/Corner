-- 驗證 workspace_id 修正結果

DO $$
DECLARE
    table_record RECORD;
    null_count INT;
    total_count INT;
    query TEXT;
BEGIN
    RAISE NOTICE '=== 驗證 workspace_id 修正結果 ===';
    RAISE NOTICE '';

    -- 檢查剛修正的三個表格
    FOR table_record IN
        SELECT unnest(ARRAY['attractions', 'visas', 'receipt_orders']) as table_name
    LOOP
        -- 計算 NULL 數量
        query := format('SELECT COUNT(*) FROM public.%I WHERE workspace_id IS NULL', table_record.table_name);
        EXECUTE query INTO null_count;

        -- 計算總數
        query := format('SELECT COUNT(*) FROM public.%I', table_record.table_name);
        EXECUTE query INTO total_count;

        IF null_count > 0 THEN
            RAISE NOTICE '❌ % - 還有 %/% 筆 workspace_id 為 NULL', table_record.table_name, null_count, total_count;
        ELSIF total_count > 0 THEN
            RAISE NOTICE '✅ % - 全部 % 筆都有 workspace_id', table_record.table_name, total_count;
        ELSE
            RAISE NOTICE '⚪ % - 表格是空的', table_record.table_name;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '=== 驗證完畢 ===';
END $$;
