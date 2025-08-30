import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Company } from "../../types/database";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  company: Company | null;
}

export default function AddPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  company,
}: AddPaymentModalProps) {
  const [amount, setAmount] = useState<string>(""); // store as string for formatting
  const [status, setStatus] = useState("paid");
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");

  if (!isOpen || !company) return null;

  const formatCurrency = (value: string) => {
    const numberValue = Number(value.replace(/\D/g, "")); // remove non-digits
    if (!numberValue) return "";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(numberValue);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setAmount(formatCurrency(rawValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return alert("Enter amount");
    if (!reference) return alert("Enter reference"); // ✅ ensure reference entered

    const numericAmount = Number(amount.replace(/[^0-9]/g, "")); // strip ₹ and commas

    setLoading(true);
    try {
      const { error } = await supabase.from("payments").insert([
        {
          company_id: company.id,
          amount: numericAmount, // save only number to DB
          reference, // ✅ add reference
          status,
          date: new Date().toISOString(),
        },
      ]);
      if (error) throw error;

      onSuccess();
      onClose();
      setAmount(""); // reset
      setReference(""); // ✅ reset reference too
    } catch (err) {
      console.error("Error adding payment:", err);
      alert("Failed to add payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          Add Payment for {company.name}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="₹ 10,000"
              required
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Transaction ID / Cheque No."
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
