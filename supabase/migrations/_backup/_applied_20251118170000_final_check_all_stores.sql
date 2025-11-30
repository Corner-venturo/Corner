-- 最終檢查：所有使用 createStore 的表格是否都有 workspace_id
-- 根據 src/stores/index.ts 的 createStore 調用列表

DO $$
DECLARE
    table_record RECORD;
    null_count INT;
    total_count INT;
    query TEXT;
    has_column BOOLEAN;
    problem_count INT := 0;
BEGIN
    RAISE NOTICE '=== 檢查所有使用 createStore 的表格 ===';
    RAISE NOTICE '';

    -- 所有使用 createStore 的表格（從 src/stores/index.ts 整理）
    FOR table_record IN
        SELECT unnest(ARRAY[
            -- 業務實體（有編號前綴）
            'tours',              -- T
            'itineraries',        -- I
            'orders',             -- O
            'customers',          -- C
            'quotes',             -- Q
            'payment_requests',   -- PR
            'disbursement_orders',-- DO
            'receipt_orders',     -- RO

            -- 子實體（無編號，但應在排除列表）
            'members',
            'quote_items',
            'tour_addons',
            'payment_request_items',

            -- 系統管理
            'employees',
            'todos',
            'visas',              -- V
            'suppliers',          -- S
            'companies',
            'company_contacts',
            'regions',
            'calendar_events',

            -- 新增的
            'attractions',
            'confirmations'
        ]) as table_name
    LOOP
        -- 檢查表格是否存在
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = table_record.table_name
        ) THEN
            RAISE NOTICE '⚠️  % - 表格不存在', table_record.table_name;
            CONTINUE;
        END IF;

        -- 檢查是否有 workspace_id 欄位
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = table_record.table_name
            AND column_name = 'workspace_id'
        ) INTO has_column;

        IF NOT has_column THEN
            -- 檢查是否在排除列表中（子實體表格）
            IF table_record.table_name IN (
                'members', 'quote_items', 'tour_addons', 'payment_request_items',
                'order_members', 'tour_participants', 'itinerary_days', 'itinerary_activities'
            ) THEN
                RAISE NOTICE '✅ % - 子實體表格，不需要 workspace_id', table_record.table_name;
            ELSE
                RAISE NOTICE '❌ % - 缺少 workspace_id 欄位！', table_record.table_name;
                problem_count := problem_count + 1;
            END IF;
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
            problem_count := problem_count + 1;
        ELSIF total_count > 0 THEN
            RAISE NOTICE '✅ % - 全部 % 筆都有 workspace_id', table_record.table_name, total_count;
        ELSE
            RAISE NOTICE '⚪ % - 表格是空的（暫時沒問題）', table_record.table_name;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '=== 檢查完畢 ===';

    IF problem_count > 0 THEN
        RAISE NOTICE '⚠️  發現 % 個表格有問題！', problem_count;
    ELSE
        RAISE NOTICE '✅ 所有表格都正常！';
    END IF;
END $$;
