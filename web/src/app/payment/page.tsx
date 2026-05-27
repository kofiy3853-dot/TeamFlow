'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle2, Shield, Loader2, Smartphone } from 'lucide-react';

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 100,
    currency: 'GHS',
    description: 'Per month, billed monthly',
    features: ['Unlimited team members', 'Real-time messaging', 'Task management', 'File sharing', 'Priority support'],
  },
];

const networks = [
  { id: 'mtn', name: 'MTN MoMo', color: '#FFCC00', textColor: '#000' },
  { id: 'telecel', name: 'Telecel Cash', color: '#E4002B', textColor: '#fff' },
  { id: 'airteltigo', name: 'AirtelTigo', color: '#FF0000', textColor: '#fff' },
];

export default function PaymentPage() {
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Payment failed to initialize');

      // Redirect to Paystack's hosted payment page
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg z-10"
      >
        <div className="glass-panel p-8 rounded-3xl border border-border shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-2xl mx-auto flex items-center justify-center mb-5">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold font-outfit tracking-tight">Activate Your Account</h1>
            <p className="text-foreground/60 mt-2 text-sm">One step away from your workspace. Complete your subscription below.</p>
          </div>

          {/* Plan Card */}
          <div className="p-5 rounded-2xl border-2 border-primary bg-primary/5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg font-outfit">Monthly Plan</h3>
                <p className="text-foreground/60 text-sm">Full access to all features</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-primary font-outfit">GHS 100</span>
                <p className="text-foreground/50 text-xs">/month</p>
              </div>
            </div>
            <ul className="space-y-2">
              {plans[0].features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Network Selection */}
          <div className="mb-6">
            <p className="text-sm font-medium text-foreground/80 mb-3 pl-1">Select Mobile Money Network</p>
            <div className="grid grid-cols-3 gap-3">
              {networks.map((net) => (
                <button
                  key={net.id}
                  onClick={() => setSelectedNetwork(net.id)}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                    selectedNetwork === net.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface hover:border-primary/50 text-foreground/70'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mx-auto mb-1" />
                  {net.name}
                </button>
              ))}
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-surface border border-border mb-6">
            <Shield className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
            <p className="text-xs text-foreground/60 leading-relaxed">
              Your PIN is <strong className="text-foreground">never</strong> collected by TeamFlow. You will receive a secure USSD prompt directly from your network provider to confirm the payment.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center mb-5">
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-base disabled:opacity-70 shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay GHS 100 via Mobile Money
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
