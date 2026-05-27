'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle2, MessageSquare, Users, Zap, Shield, TrendingUp } from 'lucide-react';

const features = [
  { icon: MessageSquare, title: 'Real-time Chat', desc: 'Communicate instantly with your team via channel-based messaging.' },
  { icon: Users, title: 'Team Management', desc: 'Create teams, invite members, and manage roles with ease.' },
  { icon: CheckCircle2, title: 'Task Boards', desc: 'Visualize and track work with powerful Kanban-style task boards.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Built on Next.js 15 with optimized performance for real-world use.' },
  { icon: Shield, title: 'Secure by Default', desc: 'JWT auth, encrypted passwords, and verified Mobile Money payments.' },
  { icon: TrendingUp, title: 'Analytics', desc: 'Track team productivity, task completion, and subscription health.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold font-outfit shadow-lg shadow-primary/30">
              TF
            </div>
            <span className="font-outfit font-bold text-xl tracking-tight">TeamFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors shadow-md shadow-primary/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            The modern teamwork platform
          </div>

          <h1 className="text-5xl md:text-7xl font-bold font-outfit tracking-tight leading-[1.1] mb-6">
            Collaborate without
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500"> limits</span>
          </h1>

          <p className="text-xl text-foreground/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            TeamFlow is a subscription-based platform combining real-time chat, task management, and team collaboration — powered by Mobile Money payments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-semibold text-lg transition-all shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1"
            >
              Start for GHS 100/mo →
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-surface hover:bg-surface-hover border border-border rounded-2xl font-semibold text-lg transition-all hover:-translate-y-1"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Mock Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="relative z-10 mt-20 max-w-5xl mx-auto"
        >
          <div className="glass-panel rounded-3xl border border-border overflow-hidden shadow-2xl shadow-black/40 p-1">
            <div className="bg-surface rounded-2xl overflow-hidden">
              {/* Mock top bar */}
              <div className="h-12 bg-surface-hover flex items-center px-4 gap-2 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/70"></div>
                <div className="flex-1 mx-4 h-6 bg-border/50 rounded-md"></div>
              </div>
              {/* Mock content */}
              <div className="grid grid-cols-4 gap-0 h-64">
                <div className="border-r border-border p-4 space-y-3">
                  {['Dashboard', 'Teams', 'Chat', 'Tasks'].map(n => (
                    <div key={n} className="h-8 rounded-lg bg-border/30 flex items-center px-3">
                      <div className="w-2 h-2 rounded-full bg-primary/60 mr-2"></div>
                      <span className="text-xs text-foreground/40">{n}</span>
                    </div>
                  ))}
                </div>
                <div className="col-span-3 p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-border/50"></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-32 rounded-xl bg-border/20 border border-border/40"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow below card */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-primary/20 blur-3xl pointer-events-none"></div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-outfit tracking-tight mb-4">Everything your team needs</h2>
            <p className="text-foreground/60 text-lg max-w-xl mx-auto">One platform. Every tool. No context switching.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-6 rounded-2xl border border-border hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feat.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg font-outfit mb-2">{feat.title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center relative">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold font-outfit tracking-tight mb-6">
            Ready to flow with your team?
          </h2>
          <p className="text-foreground/60 text-lg mb-10">Get started today for just GHS 100/month. Cancel anytime.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-semibold text-lg transition-all shadow-2xl shadow-primary/30 hover:-translate-y-1"
          >
            Create your workspace →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm font-outfit">TF</div>
            <span className="font-outfit font-semibold">TeamFlow</span>
          </div>
          <p className="text-sm text-foreground/40">© 2025 TeamFlow. Built for modern teams.</p>
        </div>
      </footer>
    </div>
  );
}
