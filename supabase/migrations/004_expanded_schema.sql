-- ============================================================
-- EXPANDED SCHEMA — IFTAS B2B CRM Feature Parity
-- Run AFTER 001_initial_schema.sql, 002_auth_trigger.sql, 003_sample_data.sql
-- ============================================================

-- ============================================================
-- MODULE 03: OPPORTUNITY STAGE HISTORY (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunity_stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  from_stage_id UUID,
  to_stage_id UUID NOT NULL,
  from_probability NUMERIC(5,2),
  to_probability NUMERIC(5,2),
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_stage_history_opp ON opportunity_stage_history(opportunity_id);

-- ============================================================
-- MODULE 13: SALES METHODOLOGY FRAMEWORKS
-- ============================================================
CREATE TABLE IF NOT EXISTS methodology_frameworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(20) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS methodology_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  framework_id UUID NOT NULL REFERENCES methodology_frameworks(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  slot_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunity_methodology (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  framework_id UUID NOT NULL REFERENCES methodology_frameworks(id),
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  adherence_pct NUMERIC(5,2) DEFAULT 0,
  verdict VARCHAR(20) CHECK (verdict IN ('qualified', 'at_risk', 'disqualified')),
  verdict_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opportunity_id, framework_id)
);

CREATE TABLE IF NOT EXISTS opportunity_methodology_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qualification_id UUID NOT NULL REFERENCES opportunity_methodology(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES methodology_slots(id),
  status VARCHAR(20) DEFAULT 'empty' CHECK (status IN ('empty', 'in_progress', 'filled', 'not_applicable')),
  content TEXT,
  filled_by UUID,
  filled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(qualification_id, slot_id)
);

-- ============================================================
-- MODULE 05: FORECASTING
-- ============================================================
CREATE TABLE IF NOT EXISTS forecast_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('monthly', 'quarterly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  commit_amount NUMERIC(15,2) DEFAULT 0,
  best_case_amount NUMERIC(15,2) DEFAULT 0,
  closed_won_amount NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  submitted_by UUID,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, period_type, period_start)
);

-- ============================================================
-- MODULE 06: TERRITORY MANAGEMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS territories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES employees(id),
  rule_type VARCHAR(20) CHECK (rule_type IN ('geography', 'industry', 'tier', 'combined', 'manual')),
  rule_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS territory_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  territory_id UUID NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  assignment_type VARCHAR(20) DEFAULT 'manual' CHECK (assignment_type IN ('manual', 'rule')),
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_territory_assign_org ON territory_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_territory_assign_current ON territory_assignments(is_current);

-- ============================================================
-- MODULE 07: CAPACITY & QUOTA MANAGEMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS capacity_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('monthly', 'quarterly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  team_quota NUMERIC(15,2) DEFAULT 0,
  avg_productivity NUMERIC(15,2) DEFAULT 0,
  ramp_month_1 NUMERIC(5,2) DEFAULT 25,
  ramp_month_2 NUMERIC(5,2) DEFAULT 50,
  ramp_month_3 NUMERIC(5,2) DEFAULT 75,
  ramp_month_4 NUMERIC(5,2) DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS capacity_plan_reps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES capacity_plans(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  quota_override NUMERIC(15,2),
  ramp_override NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, employee_id)
);

CREATE TABLE IF NOT EXISTS quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('monthly', 'quarterly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  achieved_amount NUMERIC(15,2) DEFAULT 0,
  attainment_pct NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, period_type, period_start)
);

-- ============================================================
-- MODULE 08: SALES COMPENSATION
-- ============================================================
CREATE TABLE IF NOT EXISTS commission_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  base_rate_bps INT NOT NULL DEFAULT 500,
  accelerator_rate_bps INT NOT NULL DEFAULT 1000,
  threshold_pct NUMERIC(5,2) DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES commission_plans(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  base_rate_override_bps INT,
  accelerator_rate_override_bps INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, employee_id)
);

CREATE TABLE IF NOT EXISTS commission_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES commission_assignments(id),
  opportunity_id UUID NOT NULL REFERENCES deals(id),
  deal_amount NUMERIC(15,2) NOT NULL,
  commission_amount NUMERIC(15,2) NOT NULL,
  base_amount NUMERIC(15,2) DEFAULT 0,
  accelerator_amount NUMERIC(15,2) DEFAULT 0,
  rate_bps_applied INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 10: SALES SUPPORT (expanded from help_desk_tickets)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales_support_queues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  first_response_hours INT DEFAULT 4,
  resolution_hours INT DEFAULT 24,
  default_assignee_id UUID REFERENCES employees(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  queue_id UUID NOT NULL REFERENCES sales_support_queues(id),
  opportunity_id UUID REFERENCES deals(id),
  subject VARCHAR(200) NOT NULL,
  description TEXT,
  ticket_type VARCHAR(20) NOT NULL CHECK (ticket_type IN ('pricing', 'legal', 'rfp', 'technical', 'other')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'cancelled')),
  assigned_to UUID REFERENCES employees(id),
  raised_by UUID REFERENCES employees(id),
  first_responded_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_support_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES sales_support_tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES employees(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 11: PERFORMANCE MANAGEMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS scorecards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('monthly', 'quarterly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  attainment_pct NUMERIC(5,2) DEFAULT 0,
  pipeline_coverage_pct NUMERIC(5,2) DEFAULT 0,
  activity_count INT DEFAULT 0,
  opportunities_created INT DEFAULT 0,
  opportunities_won INT DEFAULT 0,
  opportunities_lost INT DEFAULT 0,
  win_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, period_type, period_start)
);

CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  manager_id UUID NOT NULL REFERENCES employees(id),
  session_date DATE NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coaching_action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES employees(id),
  due_date DATE,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  linked_metric VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 12: SALES ENABLEMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS content_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  content_type VARCHAR(30) NOT NULL CHECK (content_type IN ('battle_card', 'deck', 'case_study', 'rfp_template', 'one_pager', 'video', 'document')),
  description TEXT,
  file_url TEXT,
  tags TEXT[],
  target_industries TEXT[],
  target_tiers TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content_library(id) ON DELETE CASCADE,
  viewed_by UUID REFERENCES employees(id),
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'waived')),
  score NUMERIC(5,2),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, employee_id)
);

-- ============================================================
-- MODULE 14: VIRTUAL SELLING
-- ============================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES deals(id),
  account_id UUID REFERENCES organizations(id),
  title VARCHAR(200) NOT NULL,
  meeting_platform VARCHAR(20) CHECK (meeting_platform IN ('zoom', 'google_meet', 'teams', 'other')),
  meeting_url TEXT,
  recording_url TEXT,
  attendees TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  disposition VARCHAR(20) CHECK (disposition IN ('advanced', 'no_decision', 'no_show', 'rescheduled', 'won', 'lost', 'other')),
  outcome_notes TEXT,
  next_steps TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS digital_sales_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES deals(id),
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS digital_sales_room_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES digital_sales_rooms(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content_library(id),
  title VARCHAR(200) NOT NULL,
  file_url TEXT,
  item_order INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 15: CHANNEL STRATEGY
-- ============================================================
CREATE TABLE IF NOT EXISTS channel_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  partner_type VARCHAR(20) NOT NULL CHECK (partner_type IN ('system_integrator', 'reseller', 'isv', 'referral', 'distributor')),
  tier VARCHAR(20) DEFAULT 'standard' CHECK (tier IN ('strategic', 'gold', 'silver', 'standard')),
  default_margin_bps INT DEFAULT 0,
  target_industries TEXT[],
  target_geographies TEXT[],
  channel_manager_id UUID REFERENCES employees(id),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deal_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES channel_partners(id),
  customer_name VARCHAR(200) NOT NULL,
  industry VARCHAR(100),
  location VARCHAR(200),
  estimated_amount NUMERIC(15,2),
  expected_close_date DATE,
  description TEXT,
  competitive_notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewed_by UUID REFERENCES employees(id),
  decision_at TIMESTAMPTZ,
  decision_note TEXT,
  expiry_date DATE,
  opportunity_id UUID REFERENCES deals(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partner_opportunity_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES channel_partners(id),
  opportunity_id UUID NOT NULL REFERENCES deals(id),
  role VARCHAR(20) DEFAULT 'co_sell' CHECK (role IN ('primary', 'co_sell', 'influencer', 'fulfillment')),
  margin_bps INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, opportunity_id)
);

-- ============================================================
-- MODULE 16: ACCOUNT SEGMENTATION
-- ============================================================
CREATE TABLE IF NOT EXISTS account_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  segment_type VARCHAR(20) NOT NULL CHECK (segment_type IN ('rule_based', 'manual')),
  rule_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_segment_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_id UUID NOT NULL REFERENCES account_segments(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  icp_score INT DEFAULT 0 CHECK (icp_score >= 0 AND icp_score <= 100),
  added_by UUID,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(segment_id, organization_id)
);

-- ============================================================
-- MODULE 01: EXPAND ACCOUNTS (BFSI taxonomy)
-- ============================================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'mid_market' CHECK (tier IN ('strategic', 'enterprise', 'mid_market', 'smb'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'prospect', 'dormant', 'churned'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS revenue_band VARCHAR(30);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS renewal_status VARCHAR(20);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS icp_score INT DEFAULT 0;

-- ============================================================
-- MODULE 01: EXPAND CONTACTS (role typing)
-- ============================================================
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_role VARCHAR(30) CHECK (contact_role IN ('decision_maker', 'champion', 'influencer', 'blocker'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS relationship_strength VARCHAR(20) CHECK (relationship_strength IN ('strong', 'moderate', 'weak', 'unknown'));

-- ============================================================
-- MODULE 03: EXPAND DEALS (probability, weighted)
-- ============================================================
ALTER TABLE deals ADD COLUMN IF NOT EXISTS weighted_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS source_lead_id UUID REFERENCES leads(id);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS methodology_id UUID REFERENCES methodology_frameworks(id);

-- ============================================================
-- MODULE 09: EXPAND CAMPAIGNS (program targets)
-- ============================================================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_pipeline NUMERIC(15,2) DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_won NUMERIC(15,2) DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_leads INT DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS program_type VARCHAR(30) CHECK (program_type IN ('campaign', 'initiative', 'event', 'sales_play', 'account_based'));
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_industries TEXT[];
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_tiers TEXT[];

CREATE TABLE IF NOT EXISTS program_attributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES deals(id),
  lead_id UUID REFERENCES leads(id),
  attribution_type VARCHAR(10) DEFAULT 'assist' CHECK (attribution_type IN ('primary', 'assist')),
  attributed_at TIMESTAMPTZ DEFAULT NOW(),
  reattributed BOOLEAN DEFAULT false,
  reattribution_reason TEXT
);

-- ============================================================
-- SEED: METHODOLOGY FRAMEWORKS
-- ============================================================
INSERT INTO methodology_frameworks (id, name, short_name, description, is_system) VALUES
  ('mf00001-0000-0000-0000-000000000001', 'MEDDPICC', 'MEDDPICC', 'Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identify Pain, Champion, Competition', true),
  ('mf00001-0000-0000-0000-000000000002', 'BANT', 'BANT', 'Budget, Authority, Need, Timeline', true),
  ('mf00001-0000-0000-0000-000000000003', 'SPIN', 'SPIN', 'Situation, Problem, Implication, Need-Payoff', true),
  ('mf00001-0000-0000-0000-000000000004', 'Sandler', 'Sandler', 'Bond, Rapport, Assess, Discover, Infer, Negotiate, Close', true)
ON CONFLICT (id) DO NOTHING;

-- MEDDPICC Slots
INSERT INTO methodology_slots (framework_id, code, label, description, is_required, slot_order) VALUES
  ('mf00001-0000-0000-0000-000000000001', 'M', 'Metrics', 'What measurable outcomes will the solution deliver?', true, 1),
  ('mf00001-0000-0000-0000-000000000001', 'EB', 'Economic Buyer', 'Who controls the budget and can approve the purchase?', true, 2),
  ('mf00001-0000-0000-0000-000000000001', 'DC', 'Decision Criteria', 'What criteria will the customer use to evaluate solutions?', true, 3),
  ('mf00001-0000-0000-0000-000000000001', 'DP', 'Decision Process', 'What steps does the customer follow to make a decision?', true, 4),
  ('mf00001-0000-0000-0000-000000000001', 'PP', 'Paper Process', 'What is the legal/procurement process for signing?', true, 5),
  ('mf00001-0000-0000-0000-000000000001', 'IP', 'Identify Pain', 'What business pain will the solution address?', true, 6),
  ('mf00001-0000-0000-0000-000000000001', 'CH', 'Champion', 'Who inside the account is selling on our behalf?', true, 7),
  ('mf00001-0000-0000-0000-000000000001', 'C', 'Competition', 'Who are we competing against and what is our differentiation?', true, 8)
ON CONFLICT DO NOTHING;

-- BANT Slots
INSERT INTO methodology_slots (framework_id, code, label, description, is_required, slot_order) VALUES
  ('mf00001-0000-0000-0000-000000000002', 'B', 'Budget', 'Has a budget been identified and allocated?', true, 1),
  ('mf00001-0000-0000-0000-000000000002', 'A', 'Authority', 'Are we talking to the decision-maker?', true, 2),
  ('mf00001-0000-0000-0000-000000000002', 'N', 'Need', 'Is there a clearly articulated business need?', true, 3),
  ('mf00001-0000-0000-0000-000000000002', 'T', 'Timeline', 'When does the customer need a solution in place?', true, 4)
ON CONFLICT DO NOTHING;

-- SPIN Slots
INSERT INTO methodology_slots (framework_id, code, label, description, is_required, slot_order) VALUES
  ('mf00001-0000-0000-0000-000000000003', 'S', 'Situation', 'What is the current state of the prospect?', true, 1),
  ('mf00001-0000-0000-0000-000000000003', 'P', 'Problem', 'What problems or challenges are they facing?', true, 2),
  ('mf00001-0000-0000-0000-000000000003', 'I', 'Implication', 'What are the consequences of not solving the problem?', true, 3),
  ('mf00001-0000-0000-0000-000000000003', 'NP', 'Need-Payoff', 'What value would solving the problem deliver?', true, 4)
ON CONFLICT DO NOTHING;

-- Sandler Slots
INSERT INTO methodology_slots (framework_id, code, label, description, is_required, slot_order) VALUES
  ('mf00001-0000-0000-0000-000000000004', 'B', 'Bond', 'Establish personal rapport and trust', true, 1),
  ('mf00001-0000-0000-0000-000000000004', 'R', 'Rapport', 'Build professional credibility and connection', true, 2),
  ('mf00001-0000-0000-0000-000000000004', 'A', 'Assess', 'Understand the current situation and pain', true, 3),
  ('mf00001-0000-0000-0000-000000000004', 'D', 'Discover', 'Uncover the deeper business issues', true, 4),
  ('mf00001-0000-0000-0000-000000000004', 'I', 'Infer', 'Help prospect understand the cost of inaction', true, 5),
  ('mf00001-0000-0000-0000-000000000004', 'N', 'Negotiate', 'Agree on terms and pricing', true, 6),
  ('mf00001-0000-0000-0000-000000000004', 'C', 'Close', 'Secure the commitment', true, 7)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: SALES SUPPORT QUEUES
-- ============================================================
INSERT INTO sales_support_queues (id, name, code, description, first_response_hours, resolution_hours) VALUES
  ('ssq0001-0000-0000-0000-000000000001', 'Deal Desk', 'DEAL', 'Pricing approvals, discount requests, deal structure', 4, 24),
  ('ssq0001-0000-0000-0000-000000000002', 'Legal & Contracts', 'LEGAL', 'MSA redlines, DPA reviews, compliance approvals', 8, 72),
  ('ssq0001-0000-0000-0000-000000000003', 'Technical Pre-Sales', 'TECH', 'Integration questions, POC support, architecture reviews', 4, 48)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: ACCOUNT TIERS for existing orgs
-- ============================================================
UPDATE organizations SET tier = 'strategic', revenue_band = '500cr+' WHERE name IN ('Tata Consultancy Services', 'Reliance Industries');
UPDATE organizations SET tier = 'enterprise', revenue_band = '100cr-500cr' WHERE name IN ('Infosys', 'HDFC Bank', 'Wipro', 'Bharti Airtel');
UPDATE organizations SET tier = 'mid_market', revenue_band = '10cr-100cr' WHERE name IN ('Zomato', 'Freshworks');
UPDATE organizations SET account_status = 'active', icp_score = 85 WHERE tier = 'strategic';
UPDATE organizations SET account_status = 'active', icp_score = 70 WHERE tier = 'enterprise';
UPDATE organizations SET account_status = 'active', icp_score = 55 WHERE tier = 'mid_market';
