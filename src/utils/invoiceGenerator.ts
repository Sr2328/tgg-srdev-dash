import jsPDF from 'jspdf';
import type { Company, Payment } from '../types/database';

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  company: Company;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  dueDate: string;
  issueDate: string;
}

export const generateInvoicePDF = (invoiceData: InvoiceData): jsPDF => {
  const doc = new jsPDF();
  
  // Company Header
  doc.setFontSize(24);
  doc.setTextColor(16, 185, 129); // Emerald color
  doc.text('GreenCare Agency', 20, 25);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('Professional Garden Maintenance Services', 20, 35);
  doc.text('Email: admin@greencare.com | Phone: +1 (555) 123-4567', 20, 45);
  
  // Invoice Title
  doc.setFontSize(20);
  doc.setTextColor(0);
  doc.text('INVOICE', 20, 70);
  
  // Invoice Details
  doc.setFontSize(12);
  doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, 85);
  doc.text(`Issue Date: ${invoiceData.issueDate}`, 20, 95);
  doc.text(`Due Date: ${invoiceData.dueDate}`, 20, 105);
  
  // Bill To
  doc.setFontSize(14);
  doc.text('Bill To:', 20, 125);
  doc.setFontSize(12);
  doc.text(invoiceData.company.name, 20, 140);
  doc.text(invoiceData.company.contact_person, 20, 150);
  doc.text(invoiceData.company.email, 20, 160);
  doc.text(invoiceData.company.phone, 20, 170);
  doc.text(invoiceData.company.address, 20, 180);
  
  // Items Table Header
  let yPosition = 200;
  doc.setFontSize(12);
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition - 5, 170, 15, 'F');
  doc.text('Description', 25, yPosition + 5);
  doc.text('Qty', 120, yPosition + 5);
  doc.text('Rate', 140, yPosition + 5);
  doc.text('Amount', 165, yPosition + 5);
  
  // Items
  yPosition += 20;
  invoiceData.items.forEach(item => {
    doc.text(item.description, 25, yPosition);
    doc.text(item.quantity.toString(), 120, yPosition);
    doc.text(`$${item.rate.toFixed(2)}`, 140, yPosition);
    doc.text(`$${item.amount.toFixed(2)}`, 165, yPosition);
    yPosition += 15;
  });
  
  // Totals
  yPosition += 10;
  doc.line(120, yPosition, 190, yPosition);
  yPosition += 10;
  doc.text(`Subtotal: $${invoiceData.subtotal.toFixed(2)}`, 120, yPosition);
  yPosition += 10;
  doc.text(`Tax: $${invoiceData.tax.toFixed(2)}`, 120, yPosition);
  yPosition += 10;
  doc.setFontSize(14);
  doc.text(`Total: $${invoiceData.total.toFixed(2)}`, 120, yPosition);
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Thank you for your business!', 20, 270);
  doc.text('Payment terms: Net 30 days', 20, 280);
  
  return doc;
};

export const generateInvoiceNumber = (): string => {
  const prefix = 'GCA';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}-${timestamp}-${random}`;
};