'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Link, MoreHorizontal, Copy, Check, X, Loader2, Crown, Shield, UserMinus } from 'lucide-react';
import { useRBAC } from '@/hooks/useRBAC';

interface Member {
  _id: string;
  fullname: string;
  email: string;
  role: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  owner: Member;
  members: Member[];
  admins: Member[];
  inviteCode: string;
}

const avatarColors = ['from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600', 'from-emerald-500 to-teal-600'];

const roleIcon = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: Users,
};

export default function TeamsPage() {
  const { isAdmin, user } = useRBAC();
  const [teams, setTeams] = useState<Team[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showMembers, setShowMembers] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await fetch('/api/teams', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch teams');
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    const res = await fetch(`/api/teams/${teamId}/members`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setShowMembers(data.team);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: teamName, description: teamDesc }),
      });
      if (!res.ok) throw new Error('Failed to create team');
      setTeamName(''); setTeamDesc(''); setShowCreate(false);
      await fetchTeams();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    setJoinError('');
    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteCode(''); setShowJoin(false);
      await fetchTeams();
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : String(err));
    } finally {
      setJoining(false);
    }
  };

  const handleRoleChange = async (teamId: string, userId: string, role: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      await fetchTeamMembers(teamId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Failed to remove member');
      await fetchTeamMembers(teamId);
      await fetchTeams();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => { 
    const timer = setTimeout(() => fetchTeams(), 0);
    return () => clearTimeout(timer);
  }, []);

  const copyInvite = (team: Team) => {
    navigator.clipboard.writeText(team.inviteCode);
    setCopiedId(team._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-outfit tracking-tight">Your Teams</h2>
          <p className="text-foreground/60 mt-1">Manage and collaborate with your teams</p>
        </div>
        {isAdmin() && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> New Team
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} aria-label="Dismiss error" title="Dismiss error"><X className="w-4 h-4" /></button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {teams.map((team, i) => (
            <motion.div key={team._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${avatarColors[i % 3]} flex items-center justify-center text-white font-bold font-outfit text-lg shadow-md`}>
                  {team.name.substring(0, 3).toUpperCase()}
                </div>
                <button
                  onClick={() => fetchTeamMembers(team._id)}
                  className="p-1.5 rounded-lg text-foreground/40 hover:bg-surface-hover hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                  title="Manage members"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <h3 className="font-bold text-xl font-outfit mb-1">{team.name}</h3>
              <p className="text-sm text-foreground/60 mb-5 leading-relaxed line-clamp-2">{team.description || 'No description'}</p>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => fetchTeamMembers(team._id)}
                  className="flex items-center gap-2 text-sm text-foreground/60 hover:text-primary transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>{team.members.length} members</span>
                </button>
              </div>
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-foreground/40 font-mono truncate max-w-[120px]">{team.inviteCode}</span>
                <button onClick={() => copyInvite(team)} className="flex items-center gap-1.5 text-xs text-primary hover:underline transition-all">
                  {copiedId === team._id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === team._id ? 'Copied!' : 'Copy invite'}
                </button>
              </div>
            </motion.div>
          ))}

          {teams.length === 0 && (
            <div className="col-span-full text-center py-12 text-foreground/60">
              No teams yet. {isAdmin() ? 'Create one to get started!' : 'Ask your team leader for an invite code.'}
            </div>
          )}

          {/* Join a Team card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            onClick={() => setShowJoin(true)}
            className="rounded-2xl border-2 border-dashed border-border hover:border-primary/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group min-h-[220px]">
            <div className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
              <Link className="w-6 h-6 text-foreground/40 group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-semibold font-outfit mb-1 text-foreground/80">Join a Team</h3>
            <p className="text-sm text-foreground/50">Enter an invite code to join an existing team</p>
          </motion.div>
        </div>
      )}

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md glass-panel rounded-2xl border border-border p-6"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold font-outfit">Create a New Team</h3>
                <button onClick={() => setShowCreate(false)} aria-label="Close modal" title="Close modal" className="p-1 rounded-lg hover:bg-surface-hover"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="teamName" className="text-sm font-medium text-foreground/80 block mb-1.5">Team Name</label>
                  <input id="teamName" type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    placeholder="e.g. Product Team" autoFocus />
                </div>
                <div>
                  <label htmlFor="teamDesc" className="text-sm font-medium text-foreground/80 block mb-1.5">Description</label>
                  <textarea id="teamDesc" value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)} rows={3}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none"
                    placeholder="What does this team work on?" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCreate(false)}
                    className="flex-1 py-3 rounded-xl border border-border hover:bg-surface-hover text-sm font-medium">Cancel</button>
                  <button onClick={handleCreateTeam} disabled={creating || !teamName.trim()}
                    className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />} Create Team
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Team Modal */}
      <AnimatePresence>
        {showJoin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowJoin(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md glass-panel rounded-2xl border border-border p-6"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold font-outfit">Join a Team</h3>
                <button onClick={() => setShowJoin(false)} aria-label="Close modal" title="Close modal" className="p-1 rounded-lg hover:bg-surface-hover"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="inviteCode" className="text-sm font-medium text-foreground/80 block mb-1.5">Invite Code</label>
                  <input id="inviteCode" type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono"
                    placeholder="Paste invite code here" autoFocus />
                </div>
                {joinError && <p className="text-red-500 text-sm">{joinError}</p>}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowJoin(false)}
                    className="flex-1 py-3 rounded-xl border border-border hover:bg-surface-hover text-sm font-medium">Cancel</button>
                  <button onClick={handleJoinTeam} disabled={joining || !inviteCode.trim()}
                    className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                    {joining && <Loader2 className="w-4 h-4 animate-spin" />} Join Team
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members Management Modal */}
      <AnimatePresence>
        {showMembers && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMembers(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg glass-panel rounded-2xl border border-border p-6 max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold font-outfit">{showMembers.name}</h3>
                  <p className="text-sm text-foreground/50">{showMembers.members.length} members</p>
                </div>
                <button onClick={() => setShowMembers(null)} aria-label="Close modal" title="Close modal" className="p-1 rounded-lg hover:bg-surface-hover"><X className="w-5 h-5" /></button>
              </div>

              <div className="overflow-y-auto space-y-2 flex-1">
                {showMembers.members.map((member) => {
                  const isOwner = showMembers.owner._id === member._id;
                  const isAdmin = showMembers.admins.some((a) => a._id === member._id);
                  const currentRole = isOwner ? 'OWNER' : isAdmin ? 'ADMIN' : 'MEMBER';
                  const RoleIcon = roleIcon[currentRole] || Users;
                  const canManage = user?.role === 'OWNER' && !isOwner;

                  return (
                    <div key={member._id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {member.fullname.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.fullname}</p>
                          <p className="text-xs text-foreground/50">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                          currentRole === 'OWNER' ? 'bg-yellow-500/10 text-yellow-500' :
                          currentRole === 'ADMIN' ? 'bg-primary/10 text-primary' :
                          'bg-surface-hover text-foreground/50'
                        }`}>
                          <RoleIcon className="w-3 h-3" />
                          {currentRole}
                        </span>
                        {canManage && (
                          <div className="flex items-center gap-1">
                            <select
                              value={currentRole}
                              onChange={(e) => handleRoleChange(showMembers._id, member._id, e.target.value)}
                              aria-label="Change member role"
                              title="Change member role"
                              className="text-xs bg-surface border border-border rounded-lg px-2 py-1 outline-none"
                            >
                              <option value="MEMBER">MEMBER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                            <button
                              onClick={() => handleRemoveMember(showMembers._id, member._id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Remove member"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-foreground/40 text-center">
                  Invite code: <span className="font-mono text-foreground/60">{showMembers.inviteCode}</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
