export interface Company {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  fixed_salary: number;
  services: string[];
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  company_id: string;
  amount: number;
  date: string;
  reference: string;
  status: 'paid' | 'pending' | 'overdue';
  created_at: string;
}

export interface Labor {
  id: string;
  name: string;
  photo_url?: string;
  phone: string;
  address: string;
  role: string;
  salary_type: 'monthly' | 'weekly' | 'daily';
  salary_amount: number;
  created_at: string;
  updated_at: string;
}

export interface LaborExpense {
  id: string;
  labor_id: string;
  purpose: string;
  amount: number;
  date: string;
  created_at: string;
}

export interface SalaryPayment {
  id: string;
  labor_id: string;
  amount: number;
  month: string;
  year: number;
  status: 'paid' | 'pending';
  payment_date?: string;
  created_at: string;
}

export interface SideProject {
  id: string;
  name: string;
  location: string;
  cost: number;
  profit: number;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ProjectExpense {
  id: string;
  project_id: string;
  description: string;
  amount: number;
  date: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  company_id: string;
  amount: number;
  items: InvoiceItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  pdf_url?: string;
  email_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Settings {
  id: string;
  user_id: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  currency: string;
  tax_rate: number;
  invoice_prefix: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalIncome: number;
  weeklyIncome: number;
  monthlyIncome: number;
  activeProjects: number;
  permanentClients: number;
  oneTimeProjects: number;
  activeWorkers: number;
  pendingSalaries: number;
  totalExpenses: number;
  paidInvoices: number;
  unpaidInvoices: number;
  completedProjects: number;
}