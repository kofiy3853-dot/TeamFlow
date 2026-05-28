'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { useStore } from '@/store/useStore';
import { Send, Hash, Users, Wifi, WifiOff, ChevronDown, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  content: string;
  sender: { id: string; fullname: string };
  createdAt: string;
}

interface TeamMember {
  _id: string;
  fullname: string;
}

interface Team {
  _id: string;
  name: string;
  members: TeamMember[];
}

// Group consecutive messages from same sender within 5 minutes
function groupMessages(messages: Message[]) {
  const groups: { sender: Message['sender']; messages: Message[]; date: string }[] = [];
  messages.forEach((msg) => {
    const last = groups[groups.length - 1];
    const msgDate = new Date(msg.createdAt);
    const sameDay = last && new Date(last.messages[0].createdAt).toDateString() === msgDate.toDateString();
    const sameSender = last && last.sender.id === msg.sender.id;
    const within5min = last && (msgDate.getTime() - new Date(last.messages[last.messages.length - 1].createdAt).getTime()) < 5 * 60 * 1000;

    if (sameSender && within5min && sameDay) {
      last.messages.push(msg);
    } else {
      groups.push({
        sender: msg.sender,
        messages: [msg],
        date: msgDate.toDateString(),
      });
    }
  });
  return groups;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function Avatar({ name, size = 'md', online }: { name: string; size?: 'sm' | 'md' | 'lg'; online?: boolean }) {
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-11 h-11 text-sm' };
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  // Deterministic color from name
  const colors = ['from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600', 'from-emerald-500 to-teal-600', 'from-orange-500 to-red-600', 'from-primary to-purple-500'];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div className="relative shrink-0">
      <div className={`${sizes[size]} rounded-full bg-linear-to-br ${color} flex items-center justify-center text-white font-bold`}>
        {initials}
      </div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface ${online ? 'bg-emerald-500' : 'bg-foreground/30'}`} />
      )}
    </div>
  );
}

export default function ChatPage() {
  const user = useStore((state) => state.user);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{_id: string; fullname: string; email: string}>>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: groupName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create group');
      const data = await res.json();
      const newTeam = data.team;
      if (newTeam && newTeam._id) {
        setTeams(prev => [...prev, newTeam]);
        switchTeam(newTeam._id);
        setShowCreate(false);
        setGroupName('');
      }
    } catch (err) {
      console.error('Failed to create group:', err);
      setError('Failed to create group. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Search for users
  const handleUserSearch = async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('User search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Add member to current team
  const handleAddMember = async (userId: string) => {
    if (!selectedTeam || selectedTeam === 'global') return;
    
    try {
      const res = await fetch(`/api/teams/${selectedTeam}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add member');
      }
      
      const data = await res.json();
      // Update teams list with new member
      setTeams(prev => prev.map(t => t._id === selectedTeam ? data.team : t));
      setShowAddMember(false);
      setUserSearch('');
      setSearchResults([]);
      setError('Member added successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err: any) {
      console.error('Add member error:', err);
      setError(err.message || 'Failed to add member');
      setTimeout(() => setError(''), 3000);
    }
  };
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Fetch teams then immediately load messages — don't wait for socket
  useEffect(() => {
    fetch('/api/teams', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const t = d.teams || [];
        setTeams(t);
        setSelectedTeam('global');
        fetchMessages('global');
      })
      .catch(() => {
        setIsLoading(false);
        setSelectedTeam('global');
        fetchMessages('global');
      });
  }, []);

  const fetchMessages = async (tid: string) => {
    if (!tid) { setIsLoading(false); return; }
    try {
      setIsLoading(true);
      setError('');
      const res = await fetch(`/api/chat/messages?teamId=${tid}&limit=100`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      const sorted = [...(data.messages || [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sorted);
    } catch (err: unknown) {
      // Don't show error if it's just an auth issue — user will see empty state
      console.error('fetchMessages error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Socket connection - connect once when user is available
  useEffect(() => {
    if (!user) { 
      router.push('/login'); 
      return; 
    }

    const token = document.cookie.split('token=')[1]?.split(';')[0] || '';
    const newSocket = io('/', {
      path: '/socket.io',
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      transports: ['polling'],
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('[Socket.IO] Connected:', newSocket.id);
      setConnected(true);
      setError('');
      // Rejoin current team on reconnect
      if (selectedTeam) {
        newSocket.emit('join-team', selectedTeam, user.id);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err.message);
      setConnected(false);
      setError('Connecting...');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
      setConnected(false);
      setError('Reconnecting...');
    });

    newSocket.on('reconnect', () => {
      setConnected(true);
      setError('');
      if (selectedTeam) newSocket.emit('join-team', selectedTeam, user.id);
    });

    newSocket.on('new-message', (msg: Message) => {
      // Deduplicate: skip if message already exists OR if it's from current user (already added optimistically)
      setMessages(prev => {
        const exists = prev.some(m => m.id === msg.id);
        if (exists) return prev;
        
        // Check if this is our own message that was already added optimistically
        // by checking if there's a recent message with same content from same sender
        const isOwnRecent = prev.some(m => 
          m.sender.id === msg.sender.id && 
          m.content === msg.content &&
          Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5000
        );
        if (isOwnRecent && msg.sender.id === user.id) return prev;
        
        return [...prev, msg];
      });
    });

    newSocket.on('user-typing', ({ userName }: { userName: string }) => {
      setTypingUsers(prev => prev.includes(userName) ? prev : [...prev, userName]);
    });

    newSocket.on('user-stop-typing', ({ userName }: { userName: string }) => {
      setTypingUsers(prev => prev.filter(u => u !== userName));
    });

    return () => { 
      newSocket.disconnect(); 
      socketRef.current = null;
    };
  }, [user, router]); // Only reconnect when user changes

  // Handle team switching
  useEffect(() => {
    if (selectedTeam && socketRef.current?.connected && user) {
      socketRef.current.emit('join-team', selectedTeam, user.id);
    }
  }, [selectedTeam, user]);


  // Switch team
  const switchTeam = (tid: string) => {
    if (tid === selectedTeam) return;
    setSelectedTeam(tid);
    setMessages([]);
    setTypingUsers([]);
    fetchMessages(tid);
  };

  // Auto-scroll
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  };

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSend = async () => {
    if (!input.trim() || !user || !selectedTeam) return;

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      content: input.trim(),
      sender: { id: user.id, fullname: user.fullname },
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    const content = input.trim();
    setInput('');

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teamId: selectedTeam, content }),
      });
      if (!res.ok) throw new Error('Failed to send');
      const data = await res.json();
      
      // Replace optimistic with real message from API
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data.message : m));
      
      // Emit to socket for real-time delivery to OTHER users
      // (we already have the message from the API response)
      socketRef.current?.emit('send-message', { 
        teamId: selectedTeam, 
        content, 
        sender: { id: user.id, fullname: user.fullname, email: user.email } 
      });
      
      socketRef.current?.emit('stop-typing', { 
        teamId: selectedTeam, 
        userId: user.id, 
        userName: user.fullname 
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setInput(content);
      setError('Failed to send message. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (socketRef.current && user && selectedTeam) {
      socketRef.current.emit('typing', { 
        teamId: selectedTeam, 
        userId: user.id, 
        userName: user.fullname 
      });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socketRef.current?.emit('stop-typing', { 
          teamId: selectedTeam, 
          userId: user.id, 
          userName: user.fullname 
        });
      }, 2000);
    }
  };

  const currentTeam = selectedTeam === 'global'
    ? { _id: 'global', name: 'Global Chat', members: [] } as any
    : teams.find(t => t._id === selectedTeam);
  const grouped = groupMessages(messages);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 rounded-2xl overflow-hidden border border-border">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div className="w-64 shrink-0 bg-surface border-r border-border flex-col hidden lg:flex">
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-outfit font-bold text-base">Team Chat</h3>
            {user?.role === 'ADMIN' && (
              <button 
                onClick={() => setShowCreate(true)} 
                className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
                title="Create new group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {connected
              ? <><Wifi className="w-3 h-3 text-emerald-500" /><span className="text-xs text-emerald-500">Connected</span></>
              : <><WifiOff className="w-3 h-3 text-foreground/40" /><span className="text-xs text-foreground/40">{error || 'Offline'}</span></>
            }
          </div>
        </div>

        {/* Teams list */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider px-2 mb-2">Channels</p>

          <button onClick={() => switchTeam('global')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all group mb-1 ${
              selectedTeam === 'global' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/60 hover:bg-surface-hover hover:text-foreground'
            }`}>
            <Hash className={`w-4 h-4 shrink-0 ${selectedTeam === 'global' ? 'text-primary' : 'text-foreground/30 group-hover:text-foreground/60'}`} />
            <span className="truncate">Global Chat</span>
            {selectedTeam === 'global' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>

          {teams.length === 0 ? (
            <p className="text-xs text-foreground/30 px-3 py-2">No teams yet</p>
          ) : (
            teams.map((team) => {
              const isActive = selectedTeam === team._id;
              return (
                <button key={team._id} onClick={() => switchTeam(team._id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all group ${
                    isActive ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/60 hover:bg-surface-hover hover:text-foreground'
                  }`}>
                  <Hash className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-foreground/30 group-hover:text-foreground/60'}`} />
                  <span className="truncate">{team.name}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              );
            })
          )}
        </div>

        {/* Online members */}
        {currentTeam && selectedTeam !== 'global' && (
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-foreground/40" />
              <span className="text-xs text-foreground/40 font-medium">{currentTeam.members.length} members</span>
            </div>
            <div className="flex -space-x-2">
              {currentTeam.members.slice(0, 6).map((m: TeamMember, i: number) => (
                <div key={m._id || i} title={m.fullname || 'Member'}
                  className="w-7 h-7 rounded-full bg-linear-to-br from-primary to-purple-500 border-2 border-surface flex items-center justify-center text-white text-[10px] font-bold">
                  {(m.fullname || 'U').substring(0, 2).toUpperCase()}
                </div>
              ))}
              {currentTeam.members.length > 6 && (
                <div className="w-7 h-7 rounded-full bg-surface-hover border-2 border-surface flex items-center justify-center text-foreground/50 text-[10px] font-bold">
                  +{currentTeam.members.length - 6}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Chat ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-background min-w-0">

        {/* Chat header */}
        <div className="h-14 px-5 border-b border-border flex items-center justify-between shrink-0 bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/dashboard')} className="p-1 rounded-full hover:bg-surface-hover transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Hash className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold font-outfit text-sm leading-none">
                {currentTeam?.name || 'Select a team'}
              </h3>
              {typingUsers.length > 0 ? (
                <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                  <span className="flex gap-0.5">
                    {[0,1,2].map(i => (
                      <span key={i} className={`w-1 h-1 bg-primary rounded-full animate-bounce ${i === 1 ? 'animation-delay-150' : i === 2 ? 'animation-delay-300' : ''}`} />
                    ))}
                  </span>
                  {typingUsers.slice(0, 2).join(', ')} typing...
                </p>
              ) : (
                <p className="text-xs text-foreground/40 mt-0.5">{selectedTeam === 'global' ? 'Everyone' : `${currentTeam?.members?.length || 0} members`}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Add member button - only show for non-global teams */}
            {selectedTeam && selectedTeam !== 'global' && (
              <button 
                onClick={() => setShowAddMember(true)}
                className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                title="Add member"
              >
                <Users className="w-4 h-4 text-primary" />
              </button>
            )}
            
            {/* Mobile team switcher */}
            <div className="lg:hidden">
              <select 
                value={selectedTeam} 
                onChange={(e) => switchTeam(e.target.value)}
                aria-label="Select a team"
                title="Select a team"
                className="text-sm bg-surface border border-border rounded-lg px-3 py-1.5 outline-none">
                <option value="global">Global Chat</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div ref={messagesRef} onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-1 scroll-smooth">

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-foreground/40">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-foreground/40">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground/60">No messages yet</p>
                <p className="text-sm mt-1">Be the first to say something in #{currentTeam?.name || 'this channel'}</p>
              </div>
            </div>
          ) : (
            <>
              {grouped.map((group, gi) => {
                const isOwn = user?.id === group.sender.id;
                const showDateSep = gi === 0 || group.date !== grouped[gi - 1].date;

                return (
                  <div key={gi}>
                    {/* Date separator */}
                    {showDateSep && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-foreground/40 font-medium px-2 py-0.5 rounded-full bg-surface border border-border">
                          {formatDateLabel(group.date)}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}

                    {/* Message group */}
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`flex gap-3 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar — only show for first in group */}
                      <div className="shrink-0 mt-1">
                        <Avatar name={group.sender.fullname} size="md" />
                      </div>

                      {/* Bubble stack */}
                      <div className={`flex flex-col gap-1 max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        {/* Sender name + time */}
                        <div className={`flex items-baseline gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-semibold text-foreground/80">
                            {isOwn ? 'You' : group.sender.fullname}
                          </span>
                          <span className="text-[10px] text-foreground/30">
                            {formatTime(group.messages[0].createdAt)}
                          </span>
                        </div>

                        {/* Messages */}
                        {group.messages.map((msg, mi) => (
                          <div key={msg.id}
                          className={`px-4 py-2.5 text-sm leading-relaxed wrap-break-word ${
                              isOwn
                                ? `bg-primary text-white ${mi === 0 ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl'}`
                                : `bg-surface border border-border text-foreground ${mi === 0 ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl'}`
                            }`}
                          >
                            {msg.content}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-24 right-8 w-9 h-9 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-hover transition-colors z-10"
            >
              <ChevronDown className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Error banner */}
        {error && !connected && (
          <div className="mx-4 mb-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 text-xs text-center">
            {error}
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 pb-4 pt-2 shrink-0">
          <div className="flex items-end gap-3 bg-surface border border-border rounded-2xl px-4 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleTyping}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={currentTeam ? `Message #${currentTeam.name}` : 'Select a team to chat...'}
              disabled={!currentTeam}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-foreground/30 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !currentTeam}
              className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 hover:scale-105 active:scale-95"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-foreground/20 mt-1.5 text-center">
            Press Enter to send
          </p>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreate(false);
              setGroupName('');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowCreate(false);
              setGroupName('');
            }
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface p-6 rounded-2xl shadow-2xl w-96 border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold font-outfit mb-4">Create New Group</h3>
            <input
              autoFocus
              className="w-full mb-4 px-4 py-2.5 border border-border rounded-xl bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Enter group name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateGroup();
                if (e.key === 'Escape') {
                  setShowCreate(false);
                  setGroupName('');
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 rounded-xl bg-surface-hover hover:bg-surface text-foreground transition-colors"
                onClick={() => {
                  setShowCreate(false);
                  setGroupName('');
                }}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateGroup}
                disabled={!groupName.trim()}
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddMember(false);
              setUserSearch('');
              setSearchResults([]);
            }
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface p-6 rounded-2xl shadow-2xl w-96 border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold font-outfit mb-4">Add Member to {currentTeam?.name}</h3>
            
            <input
              autoFocus
              className="w-full mb-3 px-4 py-2.5 border border-border rounded-xl bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={e => handleUserSearch(e.target.value)}
            />

            {/* Search results */}
            <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
              {searchLoading ? (
                <div className="text-center py-4 text-foreground/40 text-sm">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(result => (
                  <div 
                    key={result._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {result.fullname.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{result.fullname}</p>
                        <p className="text-xs text-foreground/50">{result.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(result._id)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs hover:bg-primary-hover transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))
              ) : userSearch.length >= 2 ? (
                <div className="text-center py-4 text-foreground/40 text-sm">No users found</div>
              ) : (
                <div className="text-center py-4 text-foreground/40 text-sm">Type to search for users</div>
              )}
            </div>

            <div className="flex justify-end">
              <button 
                className="px-4 py-2 rounded-xl bg-surface-hover hover:bg-surface text-foreground transition-colors"
                onClick={() => {
                  setShowAddMember(false);
                  setUserSearch('');
                  setSearchResults([]);
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
