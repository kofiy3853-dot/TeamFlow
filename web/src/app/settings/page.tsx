'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { User, Lock, Bell, Palette, CreditCard, Save, Loader2, CheckCircle } from 'lucide-react';

const NOTIF_PREFS_KEY = 'tf_notif_prefs';

const notifItems = [
  { key: 'messages', label: 'New messages', desc: 'Get notified when someone sends you a message' },
  { key: 'tasks', label: 'Task assignments', desc: 'Get notified when a task is assigned to you' },
  { key: 'teams', label: 'Team invitations', desc: 'Get notified when you are invited to a team' },
  { key: 'billing', label: 'Subscription reminders', desc: 'Get notified before your subscription expires' },
];

function NotificationToggles() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    messages: true, tasks: true, teams: true, billing: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIF_PREFS_KEY);
      if (stored) setPrefs(JSON.parse(stored));
    } catch {}
  }, []);

  const toggle = (key: string) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-4">
      {notifItems.map((item) => (
        <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
          <div>
            <h4 className="font-medium text-sm">{item.label}</h4>
            <p className="text-xs text-foreground/50 mt-0.5">{item.desc}</p>
          </div>
          <button
            onClick={() => toggle(item.key)}
            className={`w-12 h-6 rounded-full transition-colors relative ${prefs[item.key] ? 'bg-primary' : 'bg-border'}`}
            aria-label={`Toggle ${item.label}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      ))}
      {saved && (
        <div className="flex items-center gap-2 text-emerald-500 text-sm">
          <CheckCircle className="w-4 h-4" /> Preferences saved
        </div>
      )}
    </div>
  );
}

const sections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const { theme, toggleTheme, user, setUser } = useStore();

  // Profile state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullname || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fullname: fullName, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser({ ...user!, fullname: data.user.fullname });
      setProfileMsg('Profile updated successfully');
    } catch (err: any) {
      setProfileMsg(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(''), 3000);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordMsg('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPasswordMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
      setTimeout(() => setPasswordMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold font-outfit tracking-tight">Settings</h2>
        <p className="text-foreground/60 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-56 shrink-0">
          <div className="glass-panel rounded-2xl border border-border p-2 space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  activeSection === s.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/60 hover:bg-surface-hover hover:text-foreground'
                }`}
              >
                <s.icon className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel rounded-2xl border border-border p-6"
          >
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <h3 className="font-bold text-xl font-outfit">Profile Information</h3>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold font-outfit shadow-lg">
                    {user?.fullname?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground/80 block mb-1.5">Full Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground/80 block mb-1.5">Email</label>
                    <input type="email" value={email} disabled
                      className="w-full px-4 py-3 bg-surface/50 border border-border rounded-xl outline-none text-sm text-foreground/50 cursor-not-allowed" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground/80 block mb-1.5">Phone Number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm" />
                  </div>
                </div>
                {profileMsg && (
                  <div className="flex items-center gap-2 text-emerald-500 text-sm">
                    <CheckCircle className="w-4 h-4" /> {profileMsg}
                  </div>
                )}
                <button onClick={handleSaveProfile} disabled={profileSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70">
                  {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <h3 className="font-bold text-xl font-outfit">Security Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground/80 block mb-1.5">Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground/80 block mb-1.5">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground/80 block mb-1.5">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm" />
                  </div>
                  {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                  {passwordMsg && (
                    <div className="flex items-center gap-2 text-emerald-500 text-sm">
                      <CheckCircle className="w-4 h-4" /> {passwordMsg}
                    </div>
                  )}
                  <button onClick={handleChangePassword} disabled={passwordSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70">
                    {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h3 className="font-bold text-xl font-outfit">Notification Preferences</h3>
                <NotificationToggles />
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <h3 className="font-bold text-xl font-outfit">Appearance</h3>
                <div>
                  <p className="text-sm font-medium text-foreground/80 mb-3">Theme</p>
                  <div className="flex gap-4">
                    {(['dark', 'light'] as const).map((t) => (
                      <button key={t} onClick={toggleTheme}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all capitalize font-medium text-sm ${
                          theme === t ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-foreground/60'
                        }`}>
                        {t} Mode
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'billing' && (
              <div className="space-y-6">
                <h3 className="font-bold text-xl font-outfit">Billing & Subscription</h3>
                <div className="p-5 rounded-xl border-2 border-primary bg-primary/5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-lg">Monthly Plan</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      user?.subscriptionStatus === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {user?.subscriptionStatus || 'PENDING'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-primary font-outfit">
                    GHS 100 <span className="text-sm font-normal text-foreground/50">/month</span>
                  </p>
                </div>
                <button className="px-6 py-2.5 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors">
                  Cancel Subscription
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
