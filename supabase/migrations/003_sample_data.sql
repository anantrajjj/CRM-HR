-- ============================================================
-- SAMPLE DATA - Indian Audience
-- Run this AFTER 001_initial_schema.sql and 002_auth_trigger.sql
-- ============================================================

-- Departments
INSERT INTO departments (id, name, code, description, is_active) VALUES
  ('d1000001-0000-0000-0000-000000000001', 'Engineering', 'ENG', 'Software development and infrastructure', true),
  ('d1000001-0000-0000-0000-000000000002', 'Human Resources', 'HR', 'People operations and recruitment', true),
  ('d1000001-0000-0000-0000-000000000003', 'Sales', 'SALES', 'Business development and client acquisition', true),
  ('d1000001-0000-0000-0000-000000000004', 'Marketing', 'MKT', 'Brand, digital marketing and campaigns', true),
  ('d1000001-0000-0000-0000-000000000005', 'Finance', 'FIN', 'Accounting, billing and financial planning', true),
  ('d1000001-0000-0000-0000-000000000006', 'Operations', 'OPS', 'Supply chain and daily operations', true),
  ('d1000001-0000-0000-0000-000000000007', 'Product', 'PROD', 'Product management and design', true),
  ('d1000001-0000-0000-0000-000000000008', 'Customer Support', 'CS', 'Client support and issue resolution', true)
ON CONFLICT DO NOTHING;

-- Designations
INSERT INTO designations (id, name, code, department_id, is_active) VALUES
  ('des00001-0000-0000-0000-000000000001', 'Software Engineer', 'SE', 'd1000001-0000-0000-0000-000000000001', true),
  ('des00001-0000-0000-0000-000000000002', 'Senior Software Engineer', 'SSE', 'd1000001-0000-0000-0000-000000000001', true),
  ('des00001-0000-0000-0000-000000000003', 'Tech Lead', 'TL', 'd1000001-0000-0000-0000-000000000001', true),
  ('des00001-0000-0000-0000-000000000004', 'HR Manager', 'HRM', 'd1000001-0000-0000-0000-000000000002', true),
  ('des00001-0000-0000-0000-000000000005', 'HR Executive', 'HRE', 'd1000001-0000-0000-0000-000000000002', true),
  ('des00001-0000-0000-0000-000000000006', 'Sales Manager', 'SM', 'd1000001-0000-0000-0000-000000000003', true),
  ('des00001-0000-0000-0000-000000000007', 'Sales Executive', 'SE2', 'd1000001-0000-0000-0000-000000000003', true),
  ('des00001-0000-0000-0000-000000000008', 'Marketing Manager', 'MM', 'd1000001-0000-0000-0000-000000000004', true),
  ('des00001-0000-0000-0000-000000000009', 'Finance Analyst', 'FA', 'd1000001-0000-0000-0000-000000000005', true),
  ('des00001-0000-0000-0000-000000000010', 'Product Manager', 'PM', 'd1000001-0000-0000-0000-000000000007', true),
  ('des00001-0000-0000-0000-000000000011', 'Support Engineer', 'CSE', 'd1000001-0000-0000-0000-000000000008', true)
ON CONFLICT DO NOTHING;

-- Leave Types
INSERT INTO leave_types (id, name, code, days_per_year, is_paid, is_active) VALUES
  ('lt00001-0000-0000-0000-000000000001', 'Casual Leave', 'CL', 12, true, true),
  ('lt00001-0000-0000-0000-000000000002', 'Sick Leave', 'SL', 6, true, true),
  ('lt00001-0000-0000-0000-000000000003', 'Earned Leave', 'EL', 15, true, true),
  ('lt00001-0000-0000-0000-000000000004', 'Maternity Leave', 'ML', 182, true, true),
  ('lt00001-0000-0000-0000-000000000005', 'Paternity Leave', 'PL', 15, true, true),
  ('lt00001-0000-0000-0000-000000000006', 'Work From Home', 'WFH', 0, false, true)
ON CONFLICT DO NOTHING;

-- Shift Types
INSERT INTO shift_types (id, name, code, start_time, end_time, break_minutes, is_active) VALUES
  ('st00001-0000-0000-0000-000000000001', 'General Shift', 'GEN', '09:00', '18:00', 60, true),
  ('st00001-0000-0000-0000-000000000002', 'Morning Shift', 'MOR', '06:00', '15:00', 60, true),
  ('st00001-0000-0000-0000-000000000003', 'Evening Shift', 'EVE', '14:00', '23:00', 60, true),
  ('st00001-0000-0000-0000-000000000004', 'Night Shift', 'NIT', '22:00', '07:00', 60, true)
ON CONFLICT DO NOTHING;

-- Lead Sources
INSERT INTO lead_sources (id, name, code, description, is_active) VALUES
  ('ls00001-0000-0000-0000-000000000001', 'Website', 'WEB', 'Inbound leads from company website', true),
  ('ls00001-0000-0000-0000-000000000002', 'Referral', 'REF', 'Referrals from existing clients', true),
  ('ls00001-0000-0000-0000-000000000003', 'LinkedIn', 'LI', 'Leads from LinkedIn campaigns', true),
  ('ls00001-0000-0000-0000-000000000004', 'Trade Show', 'TS', 'Leads from exhibitions and trade fairs', true),
  ('ls00001-0000-0000-0000-000000000005', 'Cold Call', 'CC', 'Outbound telesales', true),
  ('ls00001-0000-0000-0000-000000000006', 'Google Ads', 'GA', 'Paid search campaigns', true)
ON CONFLICT DO NOTHING;

-- Pipelines
INSERT INTO pipelines (id, name, code, description, is_default, is_active) VALUES
  ('pl00001-0000-0000-0000-000000000001', 'Sales Pipeline', 'SALES', 'Standard sales pipeline', true, true)
ON CONFLICT DO NOTHING;

-- Deal Stages
INSERT INTO deal_stages (id, name, code, pipeline_id, probability, stage_order, is_active) VALUES
  ('ds00001-0000-0000-0000-000000000001', 'Prospecting', 'PROSP', 'pl00001-0000-0000-0000-000000000001', 10, 1, true),
  ('ds00001-0000-0000-0000-000000000002', 'Qualification', 'QUAL', 'pl00001-0000-0000-0000-000000000001', 25, 2, true),
  ('ds00001-0000-0000-0000-000000000003', 'Proposal', 'PROP', 'pl00001-0000-0000-0000-000000000001', 50, 3, true),
  ('ds00001-0000-0000-0000-000000000004', 'Negotiation', 'NEG', 'pl00001-0000-0000-0000-000000000001', 75, 4, true),
  ('ds00001-0000-0000-0000-000000000005', 'Closed Won', 'WON', 'pl00001-0000-0000-0000-000000000001', 100, 5, true),
  ('ds00001-0000-0000-0000-000000000006', 'Closed Lost', 'LOST', 'pl00001-0000-0000-0000-000000000001', 0, 6, true)
ON CONFLICT DO NOTHING;

-- Currencies
INSERT INTO currencies (id, name, code, symbol, is_default, is_active) VALUES
  ('cu00001-0000-0000-0000-000000000001', 'Indian Rupee', 'INR', '₹', true, true),
  ('cu00001-0000-0000-0000-000000000002', 'US Dollar', 'USD', '$', false, true)
ON CONFLICT DO NOTHING;

-- Organizations
INSERT INTO organizations (id, name, industry, website, email, city, country, employee_count, is_active) VALUES
  ('org0001-0000-0000-0000-000000000001', 'Tata Consultancy Services', 'IT Services', 'https://www.tcs.com', 'info@tcs.com', 'Mumbai', 'India', 600000, true),
  ('org0001-0000-0000-0000-000000000002', 'Reliance Industries', 'Conglomerate', 'https://www.ril.com', 'contact@ril.com', 'Mumbai', 'India', 250000, true),
  ('org0001-0000-0000-0000-000000000003', 'Infosys', 'IT Services', 'https://www.infosys.com', 'info@infosys.com', 'Bengaluru', 'India', 300000, true),
  ('org0001-0000-0000-0000-000000000004', 'HDFC Bank', 'Banking', 'https://www.hdfcbank.com', 'support@hdfcbank.com', 'Mumbai', 'India', 180000, true),
  ('org0001-0000-0000-0000-000000000005', 'Wipro', 'IT Services', 'https://www.wipro.com', 'info@wipro.com', 'Bengaluru', 'India', 230000, true),
  ('org0001-0000-0000-0000-000000000006', 'Bharti Airtel', 'Telecom', 'https://www.airtel.in', 'care@airtel.in', 'New Delhi', 'India', 150000, true),
  ('org0001-0000-0000-0000-000000000007', 'Zomato', 'Food Tech', 'https://www.zomato.com', 'support@zomato.com', 'Gurugram', 'India', 5000, true),
  ('org0001-0000-0000-0000-000000000008', 'Freshworks', 'SaaS', 'https://www.freshworks.com', 'info@freshworks.com', 'Chennai', 'India', 5000, true)
ON CONFLICT DO NOTHING;

-- Contacts
INSERT INTO contacts (id, organization_id, first_name, last_name, email, phone, job_title, is_lead, is_customer) VALUES
  ('con0001-0000-0000-0000-000000000001', 'org0001-0000-0000-0000-000000000001', 'Rajesh', 'Kumar', 'rajesh.kumar@tcs.com', '+91 98765 43210', 'VP Engineering', false, true),
  ('con0001-0000-0000-0000-000000000002', 'org0001-0000-0000-0000-000000000002', 'Priya', 'Sharma', 'priya.sharma@ril.com', '+91 98123 45678', 'CTO', false, true),
  ('con0001-0000-0000-0000-000000000003', 'org0001-0000-0000-0000-000000000003', 'Amit', 'Patel', 'amit.patel@infosys.com', '+91 99876 54321', 'Director of IT', true, false),
  ('con0001-0000-0000-0000-000000000004', 'org0001-0000-0000-0000-000000000004', 'Sneha', 'Reddy', 'sneha.reddy@hdfcbank.com', '+91 98712 34567', 'Head of Digital', false, true),
  ('con0001-0000-0000-0000-000000000005', 'org0001-0000-0000-0000-000000000005', 'Vikram', 'Singh', 'vikram.singh@wipro.com', '+91 97654 32109', 'Senior Architect', true, false),
  ('con0001-0000-0000-0000-000000000006', 'org0001-0000-0000-0000-000000000006', 'Ananya', 'Nair', 'ananya.nair@airtel.in', '+91 96543 21098', 'Product Manager', true, false),
  ('con0001-0000-0000-0000-000000000007', 'org0001-0000-0000-0000-000000000007', 'Deepak', 'Gupta', 'deepak.gupta@zomato.com', '+91 95432 10987', 'Engineering Lead', false, true),
  ('con0001-0000-0000-0000-000000000008', 'org0001-0000-0000-0000-000000000008', 'Kavita', 'Iyer', 'kavita.iyer@freshworks.com', '+91 94321 09876', 'VP Sales', true, false)
ON CONFLICT DO NOTHING;

-- Employees
INSERT INTO employees (id, employee_id, first_name, last_name, email, phone, department_id, designation_id, hire_date, employment_type, status) VALUES
  ('emp0001-0000-0000-0000-000000000001', 'EMP-001', 'Arjun', 'Mehta', 'arjun.mehta@company.in', '+91 98765 11111', 'd1000001-0000-0000-0000-000000000001', 'des00001-0000-0000-0000-000000000003', '2021-03-15', 'full_time', 'active'),
  ('emp0001-0000-0000-0000-000000000002', 'EMP-002', 'Neha', 'Joshi', 'neha.joshi@company.in', '+91 98765 22222', 'd1000001-0000-0000-0000-000000000002', 'des00001-0000-0000-0000-000000000004', '2020-07-01', 'full_time', 'active'),
  ('emp0001-0000-0000-0000-000000000003', 'EMP-003', 'Rohit', 'Verma', 'rohit.verma@company.in', '+91 98765 33333', 'd1000001-0000-0000-0000-000000000003', 'des00001-0000-0000-0000-000000000006', '2022-01-10', 'full_time', 'active'),
  ('emp0001-0000-0000-0000-000000000004', 'EMP-004', 'Pooja', 'Desai', 'pooja.desai@company.in', '+91 98765 44444', 'd1000001-0000-0000-0000-000000000004', 'des00001-0000-0000-0000-000000000008', '2022-06-20', 'full_time', 'active'),
  ('emp0001-0000-0000-0000-000000000005', 'EMP-005', 'Karthik', 'Menon', 'karthik.menon@company.in', '+91 98765 55555', 'd1000001-0000-0000-0000-000000000001', 'des00001-0000-0000-0000-000000000002', '2019-11-05', 'full_time', 'active'),
  ('emp0001-0000-0000-0000-000000000006', 'EMP-006', 'Divya', 'Rao', 'divya.rao@company.in', '+91 98765 66666', 'd1000001-0000-0000-0000-000000000005', 'des00001-0000-0000-0000-000000000009', '2023-02-14', 'full_time', 'active'),
  ('emp0001-0000-0000-0000-000000000007', 'EMP-007', 'Suresh', 'Pandey', 'suresh.pandey@company.in', '+91 98765 77777', 'd1000001-0000-0000-0000-000000000001', 'des00001-0000-0000-0000-000000000001', '2023-08-01', 'full_time', 'on_leave'),
  ('emp0001-0000-0000-0000-000000000008', 'EMP-008', 'Megha', 'Kulkarni', 'megha.kulkarni@company.in', '+91 98765 88888', 'd1000001-0000-0000-0000-000000000007', 'des00001-0000-0000-0000-000000000010', '2021-09-12', 'full_time', 'active'),
  ('emp0001-0000-0000-0000-000000000009', 'EMP-009', 'Tarun', 'Bhatia', 'tarun.bhatia@company.in', '+91 98765 99999', 'd1000001-0000-0000-0000-000000000008', 'des00001-0000-0000-0000-000000000011', '2024-01-05', 'full_time', 'active'),
  ('emp0001-0000-0000-0000-000000000010', 'EMP-010', 'Ishita', 'Agarwal', 'ishita.agarwal@company.in', '+91 98765 00000', 'd1000001-0000-0000-0000-000000000006', 'des00001-0000-0000-0000-000000000007', '2024-04-10', 'full_time', 'active')
ON CONFLICT DO NOTHING;

-- Leads
INSERT INTO leads (id, contact_id, organization_id, lead_source_id, status, score) VALUES
  ('lea0001-0000-0000-0000-000000000001', 'con0001-0000-0000-0000-000000000003', 'org0001-0000-0000-0000-000000000003', 'ls00001-0000-0000-0000-000000000003', 'qualified', 85),
  ('lea0001-0000-0000-0000-000000000002', 'con0001-0000-0000-0000-000000000005', 'org0001-0000-0000-0000-000000000005', 'ls00001-0000-0000-0000-000000000001', 'contacted', 70),
  ('lea0001-0000-0000-0000-000000000003', 'con0001-0000-0000-0000-000000000006', 'org0001-0000-0000-0000-000000000006', 'ls00001-0000-0000-0000-000000000002', 'new', 60),
  ('lea0001-0000-0000-0000-000000000004', 'con0001-0000-0000-0000-000000000008', 'org0001-0000-0000-0000-000000000008', 'ls00001-0000-0000-0000-000000000006', 'new', 45)
ON CONFLICT DO NOTHING;

-- Deals
INSERT INTO deals (id, title, organization_id, contact_id, pipeline_id, stage_id, amount, currency_id, probability, close_date, status) VALUES
  ('dea0001-0000-0000-0000-000000000001', 'TCS Cloud Migration', 'org0001-0000-0000-0000-000000000001', 'con0001-0000-0000-0000-000000000001', 'pl00001-0000-0000-0000-000000000001', 'ds00001-0000-0000-0000-000000000003', 4500000, 'cu00001-0000-0000-0000-000000000001', 50, '2026-08-30', 'open'),
  ('dea0001-0000-0000-0000-000000000002', 'Reliance Digital Transform', 'org0001-0000-0000-0000-000000000002', 'con0001-0000-0000-0000-000000000002', 'pl00001-0000-0000-0000-000000000001', 'ds00001-0000-0000-0000-000000000004', 8200000, 'cu00001-0000-0000-0000-000000000001', 75, '2026-07-15', 'open'),
  ('dea0001-0000-0000-0000-000000000003', 'HDFC Mobile Banking App', 'org0001-0000-0000-0000-000000000004', 'con0001-0000-0000-0000-000000000004', 'pl00001-0000-0000-0000-000000000001', 'ds00001-0000-0000-0000-000000000005', 3200000, 'cu00001-0000-0000-0000-000000000001', 100, '2026-06-01', 'won'),
  ('dea0001-0000-0000-0000-000000000004', 'Zomato Analytics Platform', 'org0001-0000-0000-0000-000000000007', 'con0001-0000-0000-0000-000000000007', 'pl00001-0000-0000-0000-000000000001', 'ds00001-0000-0000-0000-000000000002', 1800000, 'cu00001-0000-0000-0000-000000000001', 25, '2026-09-30', 'open'),
  ('dea0001-0000-0000-0000-000000000005', 'Wipro ERP System', 'org0001-0000-0000-0000-000000000005', 'con0001-0000-0000-0000-000000000005', 'pl00001-0000-0000-0000-000000000001', 'ds00001-0000-0000-0000-000000000006', 6000000, 'cu00001-0000-0000-0000-000000000001', 0, '2026-05-01', 'lost')
ON CONFLICT DO NOTHING;

-- Leave Requests
INSERT INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, days, reason, status) VALUES
  ('lr00001-0000-0000-0000-000000000001', 'emp0001-0000-0000-0000-000000000001', 'lt00001-0000-0000-0000-000000000001', '2026-06-20', '2026-06-24', 5, 'Family function in native place', 'approved'),
  ('lr00001-0000-0000-0000-000000000002', 'emp0001-0000-0000-0000-000000000007', 'lt00001-0000-0000-0000-000000000002', '2026-06-18', '2026-06-18', 1, 'Fever and cold', 'approved'),
  ('lr00001-0000-0000-0000-000000000003', 'emp0001-0000-0000-0000-000000000003', 'lt00001-0000-0000-0000-000000000001', '2026-06-25', '2026-06-27', 3, 'Vacation to Goa with family', 'pending'),
  ('lr00001-0000-0000-0000-000000000004', 'emp0001-0000-0000-0000-000000000005', 'lt00001-0000-0000-0000-000000000003', '2026-07-01', '2026-07-05', 5, 'Personal work', 'pending'),
  ('lr00001-0000-0000-0000-000000000005', 'emp0001-0000-0000-0000-000000000004', 'lt00001-0000-0000-0000-000000000001', '2026-06-16', '2026-06-16', 1, 'Temple visit', 'approved')
ON CONFLICT DO NOTHING;

-- Help Desk Tickets
INSERT INTO help_desk_tickets (id, ticket_number, subject, description, category, priority, status, raised_by_type, raised_by_id) VALUES
  ('tkt0001-0000-0000-0000-000000000001', 'TKT-001', 'Laptop screen flickering', 'My laptop screen keeps flickering during video calls. Need replacement.', 'IT', 'high', 'open', 'employee', 'emp0001-0000-0000-0000-000000000001'),
  ('tkt0001-0000-0000-0000-000000000002', 'TKT-002', 'WiFi not connecting on 3rd floor', 'The office WiFi on 3rd floor has been down since morning.', 'Facilities', 'urgent', 'in_progress', 'employee', 'emp0001-0000-0000-0000-000000000003'),
  ('tkt0001-0000-0000-0000-000000000003', 'TKT-003', 'Salary slip not received', 'Did not receive salary slip for May 2026. Please check.', 'HR', 'medium', 'open', 'employee', 'emp0001-0000-0000-0000-000000000006'),
  ('tkt0001-0000-0000-0000-000000000004', 'TKT-004', 'Access to Jira board needed', 'Need access to the ABC project Jira board for sprint planning.', 'IT', 'low', 'resolved', 'employee', 'emp0001-0000-0000-0000-000000000008'),
  ('tkt0001-0000-0000-0000-000000000005', 'TKT-005', 'AC not working in conference room', 'The AC in Banyan Hall is not cooling properly.', 'Facilities', 'medium', 'open', 'employee', 'emp0001-0000-0000-0000-000000000009')
ON CONFLICT DO NOTHING;

-- Attendance (recent entries)
INSERT INTO attendance (employee_id, date, check_in, check_out, status, hours_worked) VALUES
  ('emp0001-0000-0000-0000-000000000001', '2026-06-16', '2026-06-16T09:05:00', NULL, 'present', NULL),
  ('emp0001-0000-0000-0000-000000000002', '2026-06-16', '2026-06-16T08:55:00', '2026-06-16T18:10:00', 'present', 9.25),
  ('emp0001-0000-0000-0000-000000000003', '2026-06-16', '2026-06-16T09:30:00', '2026-06-16T18:15:00', 'late', 8.75),
  ('emp0001-0000-0000-0000-000000000004', '2026-06-16', '2026-06-16T08:50:00', '2026-06-16T17:55:00', 'present', 9.08),
  ('emp0001-0000-0000-0000-000000000005', '2026-06-16', '2026-06-16T09:00:00', '2026-06-16T18:30:00', 'present', 9.5),
  ('emp0001-0000-0000-0000-000000000006', '2026-06-16', '2026-06-16T09:10:00', '2026-06-16T18:05:00', 'present', 8.92),
  ('emp0001-0000-0000-0000-000000000007', '2026-06-16', NULL, NULL, 'on_leave', NULL),
  ('emp0001-0000-0000-0000-000000000008', '2026-06-16', '2026-06-16T09:00:00', '2026-06-16T18:00:00', 'present', 9.0),
  ('emp0001-0000-0000-0000-000000000009', '2026-06-16', '2026-06-16T08:45:00', '2026-06-16T17:50:00', 'present', 9.08),
  ('emp0001-0000-0000-0000-000000000010', '2026-06-16', '2026-06-16T09:15:00', '2026-06-16T18:20:00', 'present', 9.08)
ON CONFLICT (employee_id, date) DO NOTHING;

-- Goals
INSERT INTO goals (id, employee_id, title, description, category, start_date, due_date, progress, status) VALUES
  ('goa0001-0000-0000-0000-000000000001', 'emp0001-0000-0000-0000-000000000001', 'Complete AWS Certification', 'Get AWS Solutions Architect certification', 'development', '2026-04-01', '2026-07-31', 60, 'in_progress'),
  ('goa0001-0000-0000-0000-000000000002', 'emp0001-0000-0000-0000-000000000003', 'Close 5 enterprise deals', 'Target: Close 5 deals worth ₹50L+ each this quarter', 'performance', '2026-04-01', '2026-06-30', 40, 'in_progress'),
  ('goa0001-0000-0000-0000-000000000003', 'emp0001-0000-0000-0000-000000000002', 'Reduce attrition to under 10%', 'Implement new retention strategies', 'performance', '2026-01-01', '2026-12-31', 75, 'in_progress'),
  ('goa0001-0000-0000-0000-000000000004', 'emp0001-0000-0000-0000-000000000008', 'Launch product analytics dashboard', 'Build and deploy real-time analytics for product team', 'performance', '2026-05-01', '2026-08-31', 30, 'in_progress'),
  ('goa0001-0000-0000-0000-000000000005', 'emp0001-0000-0000-0000-000000000005', 'Migrate 3 services to microservices', 'Break monolith into microservices architecture', 'development', '2026-03-01', '2026-09-30', 55, 'in_progress')
ON CONFLICT DO NOTHING;

-- Training Courses
INSERT INTO training_courses (id, title, code, description, duration_hours, is_mandatory, is_active) VALUES
  ('tc00001-0000-0000-0000-000000000001', 'POSH Training', 'POSH', 'Prevention of Sexual Harassment - mandatory annual training', 4, true, true),
  ('tc00001-0000-0000-0000-000000000002', 'Data Privacy & GDPR', 'DPRC', 'Data protection and privacy compliance', 3, true, true),
  ('tc00001-0000-0000-0000-000000000003', 'Leadership Workshop', 'LDR', 'Building effective leadership skills', 8, false, true),
  ('tc00001-0000-0000-0000-000000000004', 'Advanced Excel', 'AEXL', 'Master advanced Excel for data analysis', 6, false, true),
  ('tc00001-0000-0000-0000-000000000005', 'AWS Cloud Fundamentals', 'AWS', 'Introduction to AWS cloud services', 10, false, true)
ON CONFLICT DO NOTHING;

-- Campaigns
INSERT INTO campaigns (id, name, type, status, start_date, end_date, budget, expected_revenue, description) VALUES
  ('cmp0001-0000-0000-0000-000000000001', 'Monsoon Sale 2026', 'email', 'in_progress', '2026-06-15', '2026-07-15', 500000, 2500000, 'Seasonal email campaign targeting existing customers'),
  ('cmp0001-0000-0000-0000-000000000002', 'LinkedIn Thought Leadership', 'social', 'in_progress', '2026-06-01', '2026-08-31', 200000, 800000, 'Weekly posts and articles on industry trends'),
  ('cmp0001-0000-0000-0000-000000000003', 'Bangalore Tech Summit', 'event', 'planned', '2026-09-10', '2026-09-12', 1500000, 5000000, 'Exhibition at BIEC, Bangalore'),
  ('cmp0001-0000-0000-0000-000000000004', 'Google Ads - Enterprise', 'ads', 'completed', '2026-03-01', '2026-05-31', 300000, 1200000, 'PPC campaign targeting enterprise keywords')
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (id, name, code, description, unit_price, currency_id, is_active) VALUES
  ('prd0001-0000-0000-0000-000000000001', 'CloudBase Pro', 'CBP', 'Enterprise cloud hosting platform', 25000, 'cu00001-0000-0000-0000-000000000001', true),
  ('prd0001-0000-0000-0000-000000000002', 'DataInsight Analytics', 'DIA', 'Real-time business analytics suite', 15000, 'cu00001-0000-0000-0000-000000000001', true),
  ('prd0001-0000-0000-0000-000000000003', 'SecureShield Firewall', 'SSF', 'Next-gen network security appliance', 50000, 'cu00001-0000-0000-0000-000000000001', true),
  ('prd0001-0000-0000-0000-000000000004', 'WorkFlow Automation', 'WFA', 'Business process automation platform', 20000, 'cu00001-0000-0000-0000-000000000001', true)
ON CONFLICT DO NOTHING;
