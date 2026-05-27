'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useRBAC } from '@/hooks/useRBAC';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const { isMember } = useRBAC();
  const router = useRouter();

  const home = isMember() ? '/workspace' : '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-border">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl mx-auto flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold font-outfit tracking-tight mb-2">Access Denied</h1>
          <p className="text-foreground/60 mb-8">
            You don't have permission to access this page. Contact your team administrator if you think this is a mistake.
          </p>
          <button
            onClick={() => router.push(home)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors"
          >
            Go to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
