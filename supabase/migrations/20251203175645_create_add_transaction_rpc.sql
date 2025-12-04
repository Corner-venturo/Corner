-- MIGRATION: Create an RPC function for atomic transaction creation.
-- This function ensures that creating a transaction and updating an account balance
-- happen in a single, atomic operation, preventing data inconsistencies.

-- Drop the function if it exists to ensure idempotency
DROP FUNCTION IF EXISTS public.create_atomic_transaction;

-- Create the function
CREATE OR REPLACE FUNCTION public.create_atomic_transaction(
    p_account_id uuid,
    p_amount numeric,
    p_transaction_type text, -- e.g., 'expense' or 'income'
    p_description text,
    p_category_id uuid,
    p_transaction_date timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- To ensure it can update tables correctly
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_balance_change numeric;
BEGIN
    -- 1. Insert the new transaction
    INSERT INTO public.accounting_transactions(account_id, user_id, amount, type, description, category_id, transaction_date)
    VALUES (p_account_id, v_user_id, p_amount, p_transaction_type, p_description, p_category_id, p_transaction_date);

    -- 2. Determine the balance change based on transaction type
    IF p_transaction_type = 'expense' THEN
        v_balance_change := -p_amount;
    ELSIF p_transaction_type = 'income' THEN
        v_balance_change := p_amount;
    ELSE
        v_balance_change := 0; -- Or handle other types like 'transfer'
    END IF;

    -- 3. Atomically update the account balance
    UPDATE public.accounting_accounts
    SET 
        balance = balance + v_balance_change,
        updated_at = now()
    WHERE id = p_account_id AND user_id = v_user_id;

    -- The function doesn't need to return anything
END;
$$;

-- Grant permission to authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.create_atomic_transaction(uuid, numeric, text, text, uuid, timestamptz) TO authenticated;

COMMENT ON FUNCTION public.create_atomic_transaction IS 'Atomically creates a transaction and updates the corresponding account balance.';
