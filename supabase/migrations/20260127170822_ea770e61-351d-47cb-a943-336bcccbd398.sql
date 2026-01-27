-- ========================================
-- Team Expense Manager Database Schema
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- ENUM TYPES
-- ========================================

-- User roles within an organization
CREATE TYPE public.org_role AS ENUM ('admin', 'finance', 'hr', 'manager', 'employee');

-- Expense status workflow
CREATE TYPE public.expense_status AS ENUM ('draft', 'pending_manager', 'pending_finance', 'approved', 'rejected', 'reimbursed');

-- ========================================
-- CORE TABLES
-- ========================================

-- Organizations (tenants)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization memberships (links users to orgs with roles)
CREATE TABLE public.organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role public.org_role NOT NULL DEFAULT 'employee',
    invited_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, organization_id)
);

-- Teams within organizations
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team memberships
CREATE TABLE public.team_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, team_id)
);

-- Custom expense categories per organization
CREATE TABLE public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Outings/Events for tagging expenses
CREATE TABLE public.outings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    event_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    outing_id UUID REFERENCES public.outings(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    vendor_name TEXT,
    expense_date DATE NOT NULL,
    description TEXT,
    notes TEXT,
    status public.expense_status NOT NULL DEFAULT 'draft',
    receipt_url TEXT,
    ocr_data JSONB,
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id),
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES public.profiles(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expense comments/notes from approvers
CREATE TABLE public.expense_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX idx_org_memberships_user ON public.organization_memberships(user_id);
CREATE INDEX idx_org_memberships_org ON public.organization_memberships(organization_id);
CREATE INDEX idx_teams_org ON public.teams(organization_id);
CREATE INDEX idx_team_memberships_user ON public.team_memberships(user_id);
CREATE INDEX idx_team_memberships_team ON public.team_memberships(team_id);
CREATE INDEX idx_expenses_user ON public.expenses(user_id);
CREATE INDEX idx_expenses_org ON public.expenses(organization_id);
CREATE INDEX idx_expenses_team ON public.expenses(team_id);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_expense_categories_org ON public.expense_categories(organization_id);
CREATE INDEX idx_outings_org ON public.outings(organization_id);

-- ========================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- ========================================

-- Get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_org_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id
    FROM public.organization_memberships
    WHERE user_id = p_user_id
    LIMIT 1;
$$;

-- Check if user is a member of an organization
CREATE OR REPLACE FUNCTION public.is_org_member(p_user_id UUID, p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_memberships
        WHERE user_id = p_user_id
        AND organization_id = p_org_id
    );
$$;

-- Check if user has a specific role in their organization
CREATE OR REPLACE FUNCTION public.has_org_role(p_user_id UUID, p_role public.org_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_memberships
        WHERE user_id = p_user_id
        AND role = p_role
    );
$$;

-- Check if user is an org admin
CREATE OR REPLACE FUNCTION public.is_org_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_org_role(p_user_id, 'admin');
$$;

-- Check if user is org finance
CREATE OR REPLACE FUNCTION public.is_org_finance(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_org_role(p_user_id, 'finance');
$$;

-- Check if user is org manager
CREATE OR REPLACE FUNCTION public.is_org_manager(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_org_role(p_user_id, 'manager');
$$;

-- Check if user is a team member
CREATE OR REPLACE FUNCTION public.is_team_member(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.team_memberships
        WHERE user_id = p_user_id
        AND team_id = p_team_id
    );
$$;

-- Check if user can view an expense
CREATE OR REPLACE FUNCTION public.can_view_expense(p_user_id UUID, p_expense_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.expenses e
        WHERE e.id = p_expense_id
        AND (
            e.user_id = p_user_id
            OR public.is_org_admin(p_user_id)
            OR public.is_org_finance(p_user_id)
            OR (public.is_org_manager(p_user_id) AND public.is_team_member(p_user_id, e.team_id))
        )
    );
$$;

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_comments ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their organization"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_memberships om1
            WHERE om1.user_id = auth.uid()
            AND om1.organization_id IN (
                SELECT om2.organization_id FROM public.organization_memberships om2
                WHERE om2.user_id = profiles.id
            )
        )
    );

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- ORGANIZATIONS policies
CREATE POLICY "Members can view their organization"
    ON public.organizations FOR SELECT
    USING (public.is_org_member(auth.uid(), id));

CREATE POLICY "Admins can update their organization"
    ON public.organizations FOR UPDATE
    USING (public.is_org_member(auth.uid(), id) AND public.is_org_admin(auth.uid()));

CREATE POLICY "Anyone can create an organization"
    ON public.organizations FOR INSERT
    WITH CHECK (true);

-- ORGANIZATION_MEMBERSHIPS policies
CREATE POLICY "Users can view memberships in their org"
    ON public.organization_memberships FOR SELECT
    USING (
        user_id = auth.uid()
        OR public.is_org_member(auth.uid(), organization_id)
    );

CREATE POLICY "Admins can manage memberships"
    ON public.organization_memberships FOR INSERT
    WITH CHECK (
        public.is_org_admin(auth.uid())
        OR NOT EXISTS (SELECT 1 FROM public.organization_memberships WHERE organization_id = organization_memberships.organization_id)
    );

CREATE POLICY "Admins can update memberships"
    ON public.organization_memberships FOR UPDATE
    USING (public.is_org_admin(auth.uid()));

CREATE POLICY "Admins can delete memberships"
    ON public.organization_memberships FOR DELETE
    USING (public.is_org_admin(auth.uid()) OR user_id = auth.uid());

-- TEAMS policies
CREATE POLICY "Members can view teams in their org"
    ON public.teams FOR SELECT
    USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins and managers can create teams"
    ON public.teams FOR INSERT
    WITH CHECK (
        public.is_org_member(auth.uid(), organization_id)
        AND (public.is_org_admin(auth.uid()) OR public.is_org_manager(auth.uid()))
    );

CREATE POLICY "Admins and managers can update teams"
    ON public.teams FOR UPDATE
    USING (
        public.is_org_member(auth.uid(), organization_id)
        AND (public.is_org_admin(auth.uid()) OR public.is_org_manager(auth.uid()))
    );

CREATE POLICY "Admins can delete teams"
    ON public.teams FOR DELETE
    USING (public.is_org_member(auth.uid(), organization_id) AND public.is_org_admin(auth.uid()));

-- TEAM_MEMBERSHIPS policies
CREATE POLICY "Users can view team memberships"
    ON public.team_memberships FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_id
            AND public.is_org_member(auth.uid(), t.organization_id)
        )
    );

CREATE POLICY "Admins and managers can manage team memberships"
    ON public.team_memberships FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_id
            AND public.is_org_member(auth.uid(), t.organization_id)
            AND (public.is_org_admin(auth.uid()) OR public.is_org_manager(auth.uid()))
        )
    );

CREATE POLICY "Admins and managers can delete team memberships"
    ON public.team_memberships FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_id
            AND public.is_org_member(auth.uid(), t.organization_id)
            AND (public.is_org_admin(auth.uid()) OR public.is_org_manager(auth.uid()))
        )
    );

-- EXPENSE_CATEGORIES policies
CREATE POLICY "Members can view expense categories"
    ON public.expense_categories FOR SELECT
    USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage expense categories"
    ON public.expense_categories FOR INSERT
    WITH CHECK (
        public.is_org_member(auth.uid(), organization_id)
        AND public.is_org_admin(auth.uid())
    );

CREATE POLICY "Admins can update expense categories"
    ON public.expense_categories FOR UPDATE
    USING (
        public.is_org_member(auth.uid(), organization_id)
        AND public.is_org_admin(auth.uid())
    );

CREATE POLICY "Admins can delete expense categories"
    ON public.expense_categories FOR DELETE
    USING (
        public.is_org_member(auth.uid(), organization_id)
        AND public.is_org_admin(auth.uid())
    );

-- OUTINGS policies
CREATE POLICY "Members can view outings"
    ON public.outings FOR SELECT
    USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins and managers can create outings"
    ON public.outings FOR INSERT
    WITH CHECK (
        public.is_org_member(auth.uid(), organization_id)
        AND (public.is_org_admin(auth.uid()) OR public.is_org_manager(auth.uid()))
    );

CREATE POLICY "Admins and managers can update outings"
    ON public.outings FOR UPDATE
    USING (
        public.is_org_member(auth.uid(), organization_id)
        AND (public.is_org_admin(auth.uid()) OR public.is_org_manager(auth.uid()))
    );

CREATE POLICY "Admins can delete outings"
    ON public.outings FOR DELETE
    USING (
        public.is_org_member(auth.uid(), organization_id)
        AND public.is_org_admin(auth.uid())
    );

-- EXPENSES policies
CREATE POLICY "Users can view their own expenses"
    ON public.expenses FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Managers can view team expenses"
    ON public.expenses FOR SELECT
    USING (
        public.is_org_member(auth.uid(), organization_id)
        AND (
            public.is_org_admin(auth.uid())
            OR public.is_org_finance(auth.uid())
            OR public.is_org_manager(auth.uid())
        )
    );

CREATE POLICY "Users can create their own expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND public.is_org_member(auth.uid(), organization_id)
    );

CREATE POLICY "Users can update their draft expenses"
    ON public.expenses FOR UPDATE
    USING (
        user_id = auth.uid()
        AND status = 'draft'
    );

CREATE POLICY "Managers can approve/reject expenses"
    ON public.expenses FOR UPDATE
    USING (
        public.is_org_member(auth.uid(), organization_id)
        AND (
            (status = 'pending_manager' AND public.is_org_manager(auth.uid()))
            OR (status = 'pending_finance' AND public.is_org_finance(auth.uid()))
            OR public.is_org_admin(auth.uid())
        )
    );

CREATE POLICY "Users can delete their draft expenses"
    ON public.expenses FOR DELETE
    USING (user_id = auth.uid() AND status = 'draft');

-- EXPENSE_COMMENTS policies
CREATE POLICY "Users can view comments on accessible expenses"
    ON public.expense_comments FOR SELECT
    USING (public.can_view_expense(auth.uid(), expense_id));

CREATE POLICY "Users can add comments to accessible expenses"
    ON public.expense_comments FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND public.can_view_expense(auth.uid(), expense_id)
    );

-- ========================================
-- TRIGGERS
-- ========================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_memberships_updated_at
    BEFORE UPDATE ON public.organization_memberships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_categories_updated_at
    BEFORE UPDATE ON public.expense_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outings_updated_at
    BEFORE UPDATE ON public.outings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- STORAGE BUCKET FOR RECEIPTS
-- ========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false);

-- Storage policies for receipts
CREATE POLICY "Users can upload their own receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'receipts'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own receipts"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'receipts'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Org members with elevated roles can view receipts"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'receipts'
        AND (
            public.is_org_admin(auth.uid())
            OR public.is_org_finance(auth.uid())
            OR public.is_org_manager(auth.uid())
        )
    );

CREATE POLICY "Users can delete their own receipts"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'receipts'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );