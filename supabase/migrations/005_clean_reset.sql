-- ============================================================
-- CLEAN RESET: Deletes all sample data, then re-inserts
-- Safe to run multiple times
-- Run AFTER 001_initial_schema.sql and 002_auth_trigger.sql
-- ============================================================

-- Delete in reverse order of dependencies
DELETE FROM attendance;
DELETE FROM leave_requests;
DELETE FROM help_desk_tickets;
DELETE FROM goals;
DELETE FROM training_courses;
DELETE FROM campaigns;
DELETE FROM products;
DELETE FROM quotes;
DELETE FROM quote_items;
DELETE FROM leads;
DELETE FROM deals;
DELETE FROM contacts;
DELETE FROM employees;
DELETE FROM organizations;
DELETE FROM deal_stages;
DELETE FROM pipelines;
DELETE FROM lead_sources;
DELETE FROM currencies;
DELETE FROM shift_types;
DELETE FROM leave_types;
DELETE FROM designations;
DELETE FROM departments;

-- Departments
INSERT INTO departments (id, name, code, description, is_active) VALUES
  ('a1000001-0000-4000-8000-000000000001', 'Engineering', 'ENG', 'Software development and infrastructure', true),
  ('a1000001-0000-4000-8000-000000000002', 'Human Resources', 'HR', 'People operations and recruitment', true),
  ('a1000001-0000-4000-8000-000000000003', 'Sales', 'SALES', 'Business development and client acquisition', true),
  ('a1000001-0000-4000-8000-000000000004', 'Marketing', 'MKT', 'Brand, digital marketing and campaigns', true),
  ('a1000001-0000-4000-8000-000000000005', 'Finance', 'FIN', 'Accounting, billing and financial planning', true),
  ('a1000001-0000-4000-8000-000000000006', 'Operations', 'OPS', 'Supply chain and daily operations', true),
  ('a1000001-0000-4000-8000-000000000007', 'Product', 'PROD', 'Product management and design', true),
  ('a1000001-0000-4000-8000-000000000008', 'Customer Support', 'CS', 'Client support and issue resolution', true);

-- Designations
INSERT INTO designations (id, name, code, department_id, is_active) VALUES
  ('b1000001-0000-4000-8000-000000000001', 'Software Engineer', 'SE', 'a1000001-0000-4000-8000-000000000001', true),
  ('b1000001-0000-4000-8000-000000000002', 'Senior Software Engineer', 'SSE', 'a1000001-0000-4000-8000-000000000001', true),
  ('b1000001-0000-4000-8000-000000000003', 'Tech Lead', 'TL', 'a1000001-0000-4000-8000-000000000001', true),
  ('b1000001-0000-4000-8000-000000000004', 'HR Manager', 'HRM', 'a1000001-0000-4000-8000-000000000002', true),
  ('b1000001-0000-4000-8000-000000000005', 'HR Executive', 'HRE', 'a1000001-0000-4000-8000-000000000002', true),
  ('b1000001-0000-4000-8000-000000000006', 'Sales Manager', 'SM', 'a1000001-0000-4000-8000-000000000003', true),
  ('b1000001-0000-4000-8000-000000000007', 'Sales Executive', 'SE2', 'a1000001-0000-4000-8000-000000000003', true),
  ('b1000001-0000-4000-8000-000000000008', 'Marketing Manager', 'MM', 'a1000001-0000-4000-8000-000000000004', true),
  ('b1000001-0000-4000-8000-000000000009', 'Finance Analyst', 'FA', 'a1000001-0000-4000-8000-000000000005', true),
  ('b1000001-0000-4000-8000-00000000000a', 'Product Manager', 'PM', 'a1000001-0000-4000-8000-000000000007', true),
  ('b1000001-0000-4000-8000-00000000000b', 'Support Engineer', 'CSE', 'a1000001-0000-4000-8000-000000000008', true);

-- Leave Types
INSERT INTO leave_types (id, name, code, days_per_year, is_paid, is_active) VALUES
  ('c1000001-0000-4000-8000-000000000001', 'Casual Leave', 'CL', 12, true, true),
  ('c1000001-0000-4000-8000-000000000002', 'Sick Leave', 'SL', 6, true, true),
  ('c1000001-0000-4000-8000-000000000003', 'Earned Leave', 'EL', 15, true, true),
  ('c1000001-0000-4000-8000-000000000004', 'Maternity Leave', 'ML', 182, true, true),
  ('c1000001-0000-4000-8000-000000000005', 'Paternity Leave', 'PL', 15, true, true),
  ('c1000001-0000-4000-8000-000000000006', 'Work From Home', 'WFH', 0, false, true);

-- Shift Types
INSERT INTO shift_types (id, name, code, start_time, end_time, break_minutes, is_active) VALUES
  ('d1000001-0000-4000-8000-000000000001', 'General Shift', 'GEN', '09:00', '18:00', 60, true),
  ('d1000001-0000-4000-8000-000000000002', 'Morning Shift', 'MOR', '06:00', '15:00', 60, true),
  ('d1000001-0000-4000-8000-000000000003', 'Evening Shift', 'EVE', '14:00', '23:00', 60, true),
  ('d1000001-0000-4000-8000-000000000004', 'Night Shift', 'NIT', '22:00', '07:00', 60, true);

-- Lead Sources
INSERT INTO lead_sources (id, name, code, description, is_active) VALUES
  ('e1000001-0000-4000-8000-000000000001', 'Website', 'WEB', 'Inbound leads from company website', true),
  ('e1000001-0000-4000-8000-000000000002', 'Referral', 'REF', 'Referrals from existing clients', true),
  ('e1000001-0000-4000-8000-000000000003', 'LinkedIn', 'LI', 'Leads from LinkedIn campaigns', true),
  ('e1000001-0000-4000-8000-000000000004', 'Trade Show', 'TS', 'Leads from exhibitions and trade fairs', true),
  ('e1000001-0000-4000-8000-000000000005', 'Cold Call', 'CC', 'Outbound telesales', true),
  ('e1000001-0000-4000-8000-000000000006', 'Google Ads', 'GA', 'Paid search campaigns', true);

-- Pipelines
INSERT INTO pipelines (id, name, code, description, is_default, is_active) VALUES
  ('f1000001-0000-4000-8000-000000000001', 'Sales Pipeline', 'SALES', 'Standard sales pipeline', true, true);

-- Deal Stages
INSERT INTO deal_stages (id, name, code, pipeline_id, probability, stage_order, is_active) VALUES
  ('a2000001-0000-4000-8000-000000000001', 'Prospecting', 'PROSP', 'f1000001-0000-4000-8000-000000000001', 10, 1, true),
  ('a2000001-0000-4000-8000-000000000002', 'Qualification', 'QUAL', 'f1000001-0000-4000-8000-000000000001', 25, 2, true),
  ('a2000001-0000-4000-8000-000000000003', 'Proposal', 'PROP', 'f1000001-0000-4000-8000-000000000001', 50, 3, true),
  ('a2000001-0000-4000-8000-000000000004', 'Negotiation', 'NEG', 'f1000001-0000-4000-8000-000000000001', 75, 4, true),
  ('a2000001-0000-4000-8000-000000000005', 'Closed Won', 'WON', 'f1000001-0000-4000-8000-000000000001', 100, 5, true),
  ('a2000001-0000-4000-8000-000000000006', 'Closed Lost', 'LOST', 'f1000001-0000-4000-8000-000000000001', 0, 6, true);

-- Currencies
INSERT INTO currencies (id, name, code, symbol, is_default, is_active) VALUES
  ('b2000001-0000-4000-8000-000000000001', 'Indian Rupee', 'INR', '₹', true, true),
  ('b2000001-0000-4000-8000-000000000002', 'US Dollar', 'USD', '$', false, true);

-- Organizations
INSERT INTO organizations (id, name, industry, website, email, city, country, employee_count, is_active) VALUES
  ('c2000001-0000-4000-8000-000000000001', 'Tata Consultancy Services', 'IT Services', 'https://www.tcs.com', 'info@tcs.com', 'Mumbai', 'India', 600000, true),
  ('c2000001-0000-4000-8000-000000000002', 'Reliance Industries', 'Conglomerate', 'https://www.ril.com', 'contact@ril.com', 'Mumbai', 'India', 250000, true),
  ('c2000001-0000-4000-8000-000000000003', 'Infosys', 'IT Services', 'https://www.infosys.com', 'info@infosys.com', 'Bengaluru', 'India', 300000, true),
  ('c2000001-0000-4000-8000-000000000004', 'HDFC Bank', 'Banking', 'https://www.hdfcbank.com', 'support@hdfcbank.com', 'Mumbai', 'India', 180000, true),
  ('c2000001-0000-4000-8000-000000000005', 'Wipro', 'IT Services', 'https://www.wipro.com', 'info@wipro.com', 'Bengaluru', 'India', 230000, true),
  ('c2000001-0000-4000-8000-000000000006', 'Bharti Airtel', 'Telecom', 'https://www.airtel.in', 'care@airtel.in', 'New Delhi', 'India', 150000, true),
  ('c2000001-0000-4000-8000-000000000007', 'Zomato', 'Food Tech', 'https://www.zomato.com', 'support@zomato.com', 'Gurugram', 'India', 5000, true),
  ('c2000001-0000-4000-8000-000000000008', 'Freshworks', 'SaaS', 'https://www.freshworks.com', 'info@freshworks.com', 'Chennai', 'India', 5000, true);

-- Contacts
INSERT INTO contacts (id, organization_id, first_name, last_name, email, phone, job_title, is_lead, is_customer) VALUES
  ('d2000001-0000-4000-8000-000000000001', 'c2000001-0000-4000-8000-000000000001', 'Rajesh', 'Kumar', 'rajesh.kumar@tcs.com', '+91 98765 43210', 'VP Engineering', false, true),
  ('d2000001-0000-4000-8000-000000000002', 'c2000001-0000-4000-8000-000000000002', 'Priya', 'Sharma', 'priya.sharma@ril.com', '+91 98123 45678', 'CTO', false, true),
  ('d2000001-0000-4000-8000-000000000003', 'c2000001-0000-4000-8000-000000000003', 'Amit', 'Patel', 'amit.patel@infosys.com', '+91 99876 54321', 'Director of IT', true, false),
  ('d2000001-0000-4000-8000-000000000004', 'c2000001-0000-4000-8000-000000000004', 'Sneha', 'Reddy', 'sneha.reddy@hdfcbank.com', '+91 98712 34567', 'Head of Digital', false, true),
  ('d2000001-0000-4000-8000-000000000005', 'c2000001-0000-4000-8000-000000000005', 'Vikram', 'Singh', 'vikram.singh@wipro.com', '+91 97654 32109', 'Senior Architect', true, false),
  ('d2000001-0000-4000-8000-000000000006', 'c2000001-0000-4000-8000-000000000006', 'Ananya', 'Nair', 'ananya.nair@airtel.in', '+91 96543 21098', 'Product Manager', true, false),
  ('d2000001-0000-4000-8000-000000000007', 'c2000001-0000-4000-8000-000000000007', 'Deepak', 'Gupta', 'deepak.gupta@zomato.com', '+91 95432 10987', 'Engineering Lead', false, true),
  ('d2000001-0000-4000-8000-000000000008', 'c2000001-0000-4000-8000-000000000008', 'Kavita', 'Iyer', 'kavita.iyer@freshworks.com', '+91 94321 09876', 'VP Sales', true, false);

-- Employees
INSERT INTO employees (id, employee_id, first_name, last_name, email, phone, department_id, designation_id, hire_date, employment_type, status) VALUES
  ('e2000001-0000-4000-8000-000000000001', 'EMP-001', 'Arjun', 'Mehta', 'arjun.mehta@company.in', '+91 98765 11111', 'a1000001-0000-4000-8000-000000000001', 'b1000001-0000-4000-8000-000000000003', '2021-03-15', 'full_time', 'active'),
  ('e2000001-0000-4000-8000-000000000002', 'EMP-002', 'Neha', 'Joshi', 'neha.joshi@company.in', '+91 98765 22222', 'a1000001-0000-4000-8000-000000000002', 'b1000001-0000-4000-8000-000000000004', '2020-07-01', 'full_time', 'active'),
  ('e2000001-0000-4000-8000-000000000003', 'EMP-003', 'Rohit', 'Verma', 'rohit.verma@company.in', '+91 98765 33333', 'a1000001-0000-4000-8000-000000000003', 'b1000001-0000-4000-8000-000000000006', '2022-01-10', 'full_time', 'active'),
  ('e2000001-0000-4000-8000-000000000004', 'EMP-004', 'Pooja', 'Desai', 'pooja.desai@company.in', '+91 98765 44444', 'a1000001-0000-4000-8000-000000000004', 'b1000001-0000-4000-8000-000000000008', '2022-06-20', 'full_time', 'active'),
  ('e2000001-0000-4000-8000-000000000005', 'EMP-005', 'Karthik', 'Menon', 'karthik.menon@company.in', '+91 98765 55555', 'a1000001-0000-4000-8000-000000000001', 'b1000001-0000-4000-8000-000000000002', '2019-11-05', 'full_time', 'active'),
  ('e2000001-0000-4000-8000-000000000006', 'EMP-006', 'Divya', 'Rao', 'divya.rao@company.in', '+91 98765 66666', 'a1000001-0000-4000-8000-000000000005', 'b1000001-0000-4000-8000-000000000009', '2023-02-14', 'full_time', 'active'),
  ('e2000001-0000-4000-8000-000000000007', 'EMP-007', 'Suresh', 'Pandey', 'suresh.pandey@company.in', '+91 98765 77777', 'a1000001-0000-4000-8000-000000000001', 'b1000001-0000-4000-8000-000000000001', '2023-08-01', 'full_time', 'on_leave'),
  ('e2000001-0000-4000-8000-000000000008', 'EMP-008', 'Megha', 'Kulkarni', 'megha.kulkarni@company.in', '+91 98765 88888', 'a1000001-0000-4000-8000-000000000007', 'b1000001-0000-4000-8000-00000000000a', '2021-09-12', 'full_time', 'active'),
  ('e2000001-0000-4000-8000-000000000009', 'EMP-009', 'Tarun', 'Bhatia', 'tarun.bhatia@company.in', '+91 98765 99999', 'a1000001-0000-4000-8000-000000000008', 'b1000001-0000-4000-8000-00000000000b', '2024-01-05', 'full_time', 'active'),
  ('e2000001-0000-4000-8000-00000000000a', 'EMP-010', 'Ishita', 'Agarwal', 'ishita.agarwal@company.in', '+91 98765 00000', 'a1000001-0000-4000-8000-000000000006', 'b1000001-0000-4000-8000-000000000007', '2024-04-10', 'full_time', 'active');

-- Leads
INSERT INTO leads (id, contact_id, organization_id, lead_source_id, status, score) VALUES
  ('f2000001-0000-4000-8000-000000000001', 'd2000001-0000-4000-8000-000000000003', 'c2000001-0000-4000-8000-000000000003', 'e1000001-0000-4000-8000-000000000003', 'qualified', 85),
  ('f2000001-0000-4000-8000-000000000002', 'd2000001-0000-4000-8000-000000000005', 'c2000001-0000-4000-8000-000000000005', 'e1000001-0000-4000-8000-000000000001', 'contacted', 70),
  ('f2000001-0000-4000-8000-000000000003', 'd2000001-0000-4000-8000-000000000006', 'c2000001-0000-4000-8000-000000000006', 'e1000001-0000-4000-8000-000000000002', 'new', 60),
  ('f2000001-0000-4000-8000-000000000004', 'd2000001-0000-4000-8000-000000000008', 'c2000001-0000-4000-8000-000000000008', 'e1000001-0000-4000-8000-000000000006', 'new', 45);

-- Deals
INSERT INTO deals (id, title, organization_id, contact_id, pipeline_id, stage_id, amount, currency_id, probability, close_date, status) VALUES
  ('a3000001-0000-4000-8000-000000000001', 'TCS Cloud Migration', 'c2000001-0000-4000-8000-000000000001', 'd2000001-0000-4000-8000-000000000001', 'f1000001-0000-4000-8000-000000000001', 'a2000001-0000-4000-8000-000000000003', 4500000, 'b2000001-0000-4000-8000-000000000001', 50, '2026-08-30', 'open'),
  ('a3000001-0000-4000-8000-000000000002', 'Reliance Digital Transform', 'c2000001-0000-4000-8000-000000000002', 'd2000001-0000-4000-8000-000000000002', 'f1000001-0000-4000-8000-000000000001', 'a2000001-0000-4000-8000-000000000004', 8200000, 'b2000001-0000-4000-8000-000000000001', 75, '2026-07-15', 'open'),
  ('a3000001-0000-4000-8000-000000000003', 'HDFC Mobile Banking App', 'c2000001-0000-4000-8000-000000000004', 'd2000001-0000-4000-8000-000000000004', 'f1000001-0000-4000-8000-000000000001', 'a2000001-0000-4000-8000-000000000005', 3200000, 'b2000001-0000-4000-8000-000000000001', 100, '2026-06-01', 'won'),
  ('a3000001-0000-4000-8000-000000000004', 'Zomato Analytics Platform', 'c2000001-0000-4000-8000-000000000007', 'd2000001-0000-4000-8000-000000000007', 'f1000001-0000-4000-8000-000000000001', 'a2000001-0000-4000-8000-000000000002', 1800000, 'b2000001-0000-4000-8000-000000000001', 25, '2026-09-30', 'open'),
  ('a3000001-0000-4000-8000-000000000005', 'Wipro ERP System', 'c2000001-0000-4000-8000-000000000005', 'd2000001-0000-4000-8000-000000000005', 'f1000001-0000-4000-8000-000000000001', 'a2000001-0000-4000-8000-000000000006', 6000000, 'b2000001-0000-4000-8000-000000000001', 0, '2026-05-01', 'lost');

-- Leave Requests
INSERT INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, days, reason, status) VALUES
  ('b3000001-0000-4000-8000-000000000001', 'e2000001-0000-4000-8000-000000000001', 'c1000001-0000-4000-8000-000000000001', '2026-06-20', '2026-06-24', 5, 'Family function in native place', 'approved'),
  ('b3000001-0000-4000-8000-000000000002', 'e2000001-0000-4000-8000-000000000007', 'c1000001-0000-4000-8000-000000000002', '2026-06-18', '2026-06-18', 1, 'Fever and cold', 'approved'),
  ('b3000001-0000-4000-8000-000000000003', 'e2000001-0000-4000-8000-000000000003', 'c1000001-0000-4000-8000-000000000001', '2026-06-25', '2026-06-27', 3, 'Vacation to Goa with family', 'pending'),
  ('b3000001-0000-4000-8000-000000000004', 'e2000001-0000-4000-8000-000000000005', 'c1000001-0000-4000-8000-000000000003', '2026-07-01', '2026-07-05', 5, 'Personal work', 'pending'),
  ('b3000001-0000-4000-8000-000000000005', 'e2000001-0000-4000-8000-000000000004', 'c1000001-0000-4000-8000-000000000001', '2026-06-16', '2026-06-16', 1, 'Temple visit', 'approved');

-- Help Desk Tickets
INSERT INTO help_desk_tickets (id, ticket_number, subject, description, category, priority, status, raised_by_type, raised_by_id) VALUES
  ('c3000001-0000-4000-8000-000000000001', 'TKT-001', 'Laptop screen flickering', 'My laptop screen keeps flickering during video calls. Need replacement.', 'IT', 'high', 'open', 'employee', 'e2000001-0000-4000-8000-000000000001'),
  ('c3000001-0000-4000-8000-000000000002', 'TKT-002', 'WiFi not connecting on 3rd floor', 'The office WiFi on 3rd floor has been down since morning.', 'Facilities', 'urgent', 'in_progress', 'employee', 'e2000001-0000-4000-8000-000000000003'),
  ('c3000001-0000-4000-8000-000000000003', 'TKT-003', 'Salary slip not received', 'Did not receive salary slip for May 2026. Please check.', 'HR', 'medium', 'open', 'employee', 'e2000001-0000-4000-8000-000000000006'),
  ('c3000001-0000-4000-8000-000000000004', 'TKT-004', 'Access to Jira board needed', 'Need access to the ABC project Jira board for sprint planning.', 'IT', 'low', 'resolved', 'employee', 'e2000001-0000-4000-8000-000000000008'),
  ('c3000001-0000-4000-8000-000000000005', 'TKT-005', 'AC not working in conference room', 'The AC in Banyan Hall is not cooling properly.', 'Facilities', 'medium', 'open', 'employee', 'e2000001-0000-4000-8000-000000000009');

-- Attendance (recent entries)
INSERT INTO attendance (employee_id, date, check_in, check_out, status, hours_worked) VALUES
  ('e2000001-0000-4000-8000-000000000001', '2026-06-16', '2026-06-16T09:05:00', NULL, 'present', NULL),
  ('e2000001-0000-4000-8000-000000000002', '2026-06-16', '2026-06-16T08:55:00', '2026-06-16T18:10:00', 'present', 9.25),
  ('e2000001-0000-4000-8000-000000000003', '2026-06-16', '2026-06-16T09:30:00', '2026-06-16T18:15:00', 'late', 8.75),
  ('e2000001-0000-4000-8000-000000000004', '2026-06-16', '2026-06-16T08:50:00', '2026-06-16T17:55:00', 'present', 9.08),
  ('e2000001-0000-4000-8000-000000000005', '2026-06-16', '2026-06-16T09:00:00', '2026-06-16T18:30:00', 'present', 9.5),
  ('e2000001-0000-4000-8000-000000000006', '2026-06-16', '2026-06-16T09:10:00', '2026-06-16T18:05:00', 'present', 8.92),
  ('e2000001-0000-4000-8000-000000000007', '2026-06-16', NULL, NULL, 'on_leave', NULL),
  ('e2000001-0000-4000-8000-000000000008', '2026-06-16', '2026-06-16T09:00:00', '2026-06-16T18:00:00', 'present', 9.0),
  ('e2000001-0000-4000-8000-000000000009', '2026-06-16', '2026-06-16T08:45:00', '2026-06-16T17:50:00', 'present', 9.08),
  ('e2000001-0000-4000-8000-00000000000a', '2026-06-16', '2026-06-16T09:15:00', '2026-06-16T18:20:00', 'present', 9.08)
ON CONFLICT (employee_id, date) DO NOTHING;

-- Goals
INSERT INTO goals (id, employee_id, title, description, category, start_date, due_date, progress, status) VALUES
  ('d3000001-0000-4000-8000-000000000001', 'e2000001-0000-4000-8000-000000000001', 'Complete AWS Certification', 'Get AWS Solutions Architect certification', 'development', '2026-04-01', '2026-07-31', 60, 'in_progress'),
  ('d3000001-0000-4000-8000-000000000002', 'e2000001-0000-4000-8000-000000000003', 'Close 5 enterprise deals', 'Target: Close 5 deals worth Rs 50L+ each this quarter', 'performance', '2026-04-01', '2026-06-30', 40, 'in_progress'),
  ('d3000001-0000-4000-8000-000000000003', 'e2000001-0000-4000-8000-000000000002', 'Reduce attrition to under 10%', 'Implement new retention strategies', 'performance', '2026-01-01', '2026-12-31', 75, 'in_progress'),
  ('d3000001-0000-4000-8000-000000000004', 'e2000001-0000-4000-8000-000000000008', 'Launch product analytics dashboard', 'Build and deploy real-time analytics for product team', 'performance', '2026-05-01', '2026-08-31', 30, 'in_progress'),
  ('d3000001-0000-4000-8000-000000000005', 'e2000001-0000-4000-8000-000000000005', 'Migrate 3 services to microservices', 'Break monolith into microservices architecture', 'development', '2026-03-01', '2026-09-30', 55, 'in_progress');

-- Training Courses
INSERT INTO training_courses (id, title, code, description, duration_hours, is_mandatory, is_active) VALUES
  ('e3000001-0000-4000-8000-000000000001', 'POSH Training', 'POSH', 'Prevention of Sexual Harassment - mandatory annual training', 4, true, true),
  ('e3000001-0000-4000-8000-000000000002', 'Data Privacy & GDPR', 'DPRC', 'Data protection and privacy compliance', 3, true, true),
  ('e3000001-0000-4000-8000-000000000003', 'Leadership Workshop', 'LDR', 'Building effective leadership skills', 8, false, true),
  ('e3000001-0000-4000-8000-000000000004', 'Advanced Excel', 'AEXL', 'Master advanced Excel for data analysis', 6, false, true),
  ('e3000001-0000-4000-8000-000000000005', 'AWS Cloud Fundamentals', 'AWS', 'Introduction to AWS cloud services', 10, false, true);

-- Campaigns
INSERT INTO campaigns (id, name, type, status, start_date, end_date, budget, expected_revenue, description) VALUES
  ('f3000001-0000-4000-8000-000000000001', 'Monsoon Sale 2026', 'email', 'in_progress', '2026-06-15', '2026-07-15', 500000, 2500000, 'Seasonal email campaign targeting existing customers'),
  ('f3000001-0000-4000-8000-000000000002', 'LinkedIn Thought Leadership', 'social', 'in_progress', '2026-06-01', '2026-08-31', 200000, 800000, 'Weekly posts and articles on industry trends'),
  ('f3000001-0000-4000-8000-000000000003', 'Bangalore Tech Summit', 'event', 'planned', '2026-09-10', '2026-09-12', 1500000, 5000000, 'Exhibition at BIEC, Bangalore'),
  ('f3000001-0000-4000-8000-000000000004', 'Google Ads - Enterprise', 'ads', 'completed', '2026-03-01', '2026-05-31', 300000, 1200000, 'PPC campaign targeting enterprise keywords');

-- Products
INSERT INTO products (id, name, code, description, unit_price, currency_id, is_active) VALUES
  ('a4000001-0000-4000-8000-000000000001', 'CloudBase Pro', 'CBP', 'Enterprise cloud hosting platform', 25000, 'b2000001-0000-4000-8000-000000000001', true),
  ('a4000001-0000-4000-8000-000000000002', 'DataInsight Analytics', 'DIA', 'Real-time business analytics suite', 15000, 'b2000001-0000-4000-8000-000000000001', true),
  ('a4000001-0000-4000-8000-000000000003', 'SecureShield Firewall', 'SSF', 'Next-gen network security appliance', 50000, 'b2000001-0000-4000-8000-000000000001', true),
  ('a4000001-0000-4000-8000-000000000004', 'WorkFlow Automation', 'WFA', 'Business process automation platform', 20000, 'b2000001-0000-4000-8000-000000000001', true);
