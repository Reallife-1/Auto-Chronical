begin;

-- ============================================================
-- Auto Chronicle: Persistent Notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    type TEXT NOT NULL
        CHECK (
            type IN (
                'service_due',
                'insurance_expiry',
                'car_fund_contribution',
                'car_fund_goal'
            )
        ),

    title TEXT NOT NULL,
    message TEXT NOT NULL,

    priority TEXT NOT NULL DEFAULT 'normal'
        CHECK (
            priority IN ('urgent', 'high', 'normal')
        ),

    due_date DATE NOT NULL,

    action_url TEXT NOT NULL,
    entity_id UUID NOT NULL,

    -- Stable identifier used to prevent duplicate reminders.
    dedupe_key TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT notifications_user_dedupe_unique
        UNIQUE (user_id, dedupe_key),

    CONSTRAINT notifications_read_state_consistent
        CHECK (
            (is_read = FALSE AND read_at IS NULL)
            OR
            (is_read = TRUE AND read_at IS NOT NULL)
        )
);

-- Efficient notification list queries.
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON public.notifications (
        user_id,
        created_at DESC,
        id DESC
    );

-- Efficient unread count queries.
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON public.notifications (user_id, created_at DESC)
    WHERE is_read = FALSE;

-- Efficient filtering by type.
CREATE INDEX IF NOT EXISTS idx_notifications_user_type
    ON public.notifications (user_id, type);

-- Keep updated_at current.
CREATE OR REPLACE FUNCTION public.set_notifications_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_updated_at_trigger
    ON public.notifications;

CREATE TRIGGER notifications_updated_at_trigger
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.set_notifications_updated_at();

-- Enable Row Level Security.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications through user-scoped
-- Supabase access.
DROP POLICY IF EXISTS "Users can read their own notifications"
    ON public.notifications;

CREATE POLICY "Users can read their own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users may update the read status of their own notifications.
DROP POLICY IF EXISTS "Users can update their own notifications"
    ON public.notifications;

CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Do not allow authenticated clients to create or delete
-- arbitrary notification records directly.
REVOKE INSERT, DELETE
    ON public.notifications
    FROM anon, authenticated;

GRANT SELECT, UPDATE
    ON public.notifications
    TO authenticated;

-- Backend operations using the Supabase service role can insert
-- and maintain notification records.
GRANT ALL
    ON public.notifications
    TO service_role;

commit;
