'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface Payment {
  _id: string;
  amount: number;
  provider: string;
  reference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
  paidAt?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
}

const statusConfig = {
  SUCCESS: {
    label: 'Paid',
    icon: CheckCircle,
    className: 'text-emerald-400 bg-emerald-400/10',
  },
  PENDING: {
    label: 'Pending',
    icon: Clock,
    className: 'text-yellow-400 bg-yellow-400/10',
  },
  FAILED: {
    label: 'Failed',
    icon: XCircle,
    className: 'text-red-400 bg-red-400/10',
  },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payments', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load billing history.');
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-outfit font-bold tracking-tight mb-2"
          >
            Billing &amp; <span className="text-primary">Payments</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-foreground/70"
          >
            Your full payment and subscription history.
          </motion.p>
        </div>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={fetchPayments}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </motion.button>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel rounded-2xl overflow-hidden"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-foreground/50 text-sm">Loading billing history…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-red-400">
            <AlertCircle className="w-10 h-10" />
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchPayments}
              className="text-xs underline underline-offset-2 hover:text-red-300 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground/70 font-medium">No payments yet</p>
            <p className="text-foreground/40 text-sm">Your billing history will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-foreground/50 text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-4 font-medium">Date</th>
                  <th className="text-left px-6 py-4 font-medium">Reference</th>
                  <th className="text-left px-6 py-4 font-medium">Provider</th>
                  <th className="text-left px-6 py-4 font-medium">Amount</th>
                  <th className="text-left px-6 py-4 font-medium">Period</th>
                  <th className="text-left px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment, index) => {
                  const cfg = statusConfig[payment.status] || statusConfig.PENDING;
                  const Icon = cfg.icon;
                  return (
                    <motion.tr
                      key={payment._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-surface-hover transition-colors"
                    >
                      <td className="px-6 py-4 text-foreground/70">{formatDate(payment.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-foreground/50 bg-surface px-2 py-1 rounded-lg">
                          {payment.reference.slice(0, 16)}…
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground/80">{payment.provider}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold font-outfit">{formatAmount(payment.amount)}</td>
                      <td className="px-6 py-4 text-foreground/50 text-xs">
                        {payment.subscriptionStart
                          ? `${formatDate(payment.subscriptionStart)} → ${formatDate(payment.subscriptionEnd)}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
