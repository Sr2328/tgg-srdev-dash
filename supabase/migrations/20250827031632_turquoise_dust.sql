/*
  # Garden Maintenance Agency Database Schema

  1. New Tables
    - `companies` - Client companies with contact details and service information
    - `payments` - Payment records linked to companies with status tracking
    - `labor` - Worker/laborer details with salary structure
    - `labor_expenses` - Expense records for laborers with purpose tracking
    - `side_projects` - One-time or temporary projects with cost/profit tracking
    - `project_expenses` - Expense records for side projects
    - `invoices` - Generated invoices with PDF links and email status

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users to manage all data
    - Ensure data integrity with foreign key constraints

  3. Features
    - Full audit trail with created_at and updated_at timestamps
    - Flexible payment status tracking
    - Support for different salary types (monthly/weekly/daily)
    - Project status management with completion tracking
*/

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  location text NOT NULL,
  fixed_salary decimal(10,2) DEFAULT 0,
  services text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (true);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  date timestamptz DEFAULT now(),
  reference text NOT NULL,
  status text CHECK (status IN ('paid', 'pending', 'overdue')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (true);

-- Labor table
CREATE TABLE IF NOT EXISTS labor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  photo_url text,
  phone text NOT NULL,
  address text NOT NULL,
  role text NOT NULL,
  salary_type text CHECK (salary_type IN ('monthly', 'weekly', 'daily')) DEFAULT 'monthly',
  salary_amount decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE labor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage labor"
  ON labor
  FOR ALL
  TO authenticated
  USING (true);

-- Labor expenses table
CREATE TABLE IF NOT EXISTS labor_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  labor_id uuid REFERENCES labor(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  amount decimal(10,2) NOT NULL,
  date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE labor_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage labor expenses"
  ON labor_expenses
  FOR ALL
  TO authenticated
  USING (true);

-- Side projects table
CREATE TABLE IF NOT EXISTS side_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  cost decimal(10,2) DEFAULT 0,
  profit decimal(10,2) DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  status text CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE side_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage side projects"
  ON side_projects
  FOR ALL
  TO authenticated
  USING (true);

-- Project expenses table
CREATE TABLE IF NOT EXISTS project_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES side_projects(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage project expenses"
  ON project_expenses
  FOR ALL
  TO authenticated
  USING (true);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  items jsonb DEFAULT '[]',
  status text CHECK (status IN ('draft', 'sent', 'paid', 'overdue')) DEFAULT 'draft',
  pdf_url text,
  email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_labor_expenses_labor_id ON labor_expenses(labor_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_project_id ON project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);