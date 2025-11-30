-- Grant schema-level permissions to fix "permission denied for schema public"

-- Grant schema usage to all roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant all privileges on all tables to service_role (bypasses RLS)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant specific permissions to anon and authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO anon, authenticated, service_role;

-- Specifically for workspace tables
GRANT ALL ON public.workspaces TO service_role, anon, authenticated;
GRANT ALL ON public.channels TO service_role, anon, authenticated;
GRANT ALL ON public.channel_groups TO service_role, anon, authenticated;
GRANT ALL ON public.channel_members TO service_role, anon, authenticated;
GRANT ALL ON public.messages TO service_role, anon, authenticated;
GRANT ALL ON public.bulletins TO service_role, anon, authenticated;
GRANT ALL ON public.advance_lists TO service_role, anon, authenticated;
GRANT ALL ON public.shared_order_lists TO service_role, anon, authenticated;
