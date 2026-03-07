import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    MessageSquare, Plus, Send, Search, Hash, Lock,
    Users, Settings, Loader2, MoreVertical, Smile,
    Paperclip, ChevronLeft, Circle, UserPlus, Bell, BellOff,
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

interface Channel {
    id: string;
    name: string;
    description?: string;
    channel_type: 'direct' | 'group' | 'department' | 'announcement';
    is_archived: boolean;
    lastMessage?: { body: string; sender_id: string; created_at: string };
    myRole?: string;
    muted?: boolean;
}

interface Message {
    id: string;
    body: string;
    message_type: string;
    file_url?: string;
    reply_to_id?: string;
    is_edited: boolean;
    sender_id: string;
    created_at: string;
    company_members?: { profiles?: { full_name: string; avatar_url?: string } };
}

async function apiRequest(path: string, method = 'GET', body?: unknown) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
}

export default function ChatModule() {
    const { company } = useCompany();
    const { user, profile } = useAuth();

    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState('');
    const [showNewChannel, setShowNewChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelType, setNewChannelType] = useState<'group' | 'department' | 'announcement'>('group');
    const [onlineMembers, setOnlineMembers] = useState<Record<string, string>>({});
    const [showMobileList, setShowMobileList] = useState(true);
    const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
    const [presenceUsers, setPresenceUsers] = useState<Record<string, 'online' | 'away'>>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load channels
    const loadChannels = useCallback(async () => {
        const res = await apiRequest('/api/chat/channels');
        if (res.channels) {
            setChannels(res.channels);
            if (res.channels.length > 0 && !selectedChannel) {
                setSelectedChannel(res.channels[0]);
            }
        }
        setLoading(false);
    }, [selectedChannel]);

    useEffect(() => {
        loadChannels();
    }, [loadChannels]);

    // Load messages for selected channel
    useEffect(() => {
        if (!selectedChannel?.id) return;
        setLoadingMessages(true);
        apiRequest(`/api/chat/channels/${selectedChannel.id}/messages`).then(res => {
            setMessages(res.messages ?? []);
            setLoadingMessages(false);
        });
    }, [selectedChannel?.id]);

    // Real-time subscription for new messages
    useEffect(() => {
        if (!selectedChannel?.id) return;
        const sub = supabase
            .channel(`chat-${selectedChannel.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `channel_id=eq.${selectedChannel.id}`,
                },
                (payload) => {
                    setMessages(prev => [...prev, payload.new as Message]);
                },
            )
            .subscribe();

        return () => { supabase.removeChannel(sub); };
    }, [selectedChannel?.id]);

    // Presence for online status & typing indicators
    useEffect(() => {
        if (!selectedChannel?.id || !user?.id) return;
        const presenceChannel = supabase.channel(`presence-${selectedChannel.id}`, {
            config: { presence: { key: user.id } },
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                const onlineMap: Record<string, 'online' | 'away'> = {};
                const typingMap: Record<string, string> = {};
                Object.entries(state).forEach(([key, arr]) => {
                    const latest = (arr as any)[0];
                    onlineMap[key] = latest?.status || 'online';
                    if (latest?.typing && key !== user?.id) {
                        typingMap[key] = latest.name || 'Someone';
                    }
                });
                setPresenceUsers(onlineMap);
                setTypingUsers(typingMap);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        status: 'online',
                        name: profile?.full_name || 'User',
                        typing: false,
                    });
                }
            });

        return () => { supabase.removeChannel(presenceChannel); };
    }, [selectedChannel?.id, user?.id, profile?.full_name]);

    // Broadcast typing indicator
    const broadcastTyping = useCallback(() => {
        if (!selectedChannel?.id || !user?.id) return;
        const ch = supabase.channel(`presence-${selectedChannel.id}`);
        ch.track({
            status: 'online',
            name: profile?.full_name || 'User',
            typing: true,
        });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            ch.track({
                status: 'online',
                name: profile?.full_name || 'User',
                typing: false,
            });
        }, 2000);
    }, [selectedChannel?.id, user?.id, profile?.full_name]);

    // Load presence
    useEffect(() => {
        apiRequest('/api/chat/presence').then(res => {
            const map: Record<string, string> = {};
            for (const p of res.presence ?? []) {
                map[p.member_id] = p.status;
            }
            setOnlineMembers(map);
        });
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!message.trim() || !selectedChannel?.id || sending) return;
        const text = message;
        setMessage('');
        setSending(true);
        await apiRequest(`/api/chat/channels/${selectedChannel.id}/messages`, 'POST', { text });
        setSending(false);
    };

    const createChannel = async () => {
        if (!newChannelName.trim()) return;
        const res = await apiRequest('/api/chat/channels', 'POST', {
            name: newChannelName.trim(),
            channel_type: newChannelType,
        });
        if (res.channel) {
            setChannels(prev => [res.channel, ...prev]);
            setSelectedChannel(res.channel);
            setShowNewChannel(false);
            setNewChannelName('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const filteredChannels = channels.filter(ch =>
        ch.name.toLowerCase().includes(search.toLowerCase()),
    );

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'direct': return <Circle size={14} className="text-green-500" />;
            case 'announcement': return <Bell size={14} className="text-amber-500" />;
            case 'department': return <Users size={14} className="text-blue-500" />;
            default: return <Hash size={14} className="text-zinc-400" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Chat</h1>
                    <p className="text-zinc-500 mt-1 text-sm">Team communication and messaging</p>
                </div>
                <button
                    onClick={() => setShowNewChannel(true)}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
                >
                    <Plus size={14} /> New Channel
                </button>
            </div>

            {/* New Channel Modal */}
            {showNewChannel && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">Create Channel</h3>
                        <input
                            type="text"
                            value={newChannelName}
                            onChange={e => setNewChannelName(e.target.value)}
                            placeholder="Channel name"
                            className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-transparent text-sm mb-3"
                            autoFocus
                        />
                        <div className="flex gap-2 mb-4">
                            {(['group', 'department', 'announcement'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setNewChannelType(t)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${newChannelType === t
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowNewChannel(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createChannel}
                                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Layout */}
            <div
                className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden"
                style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}
            >
                {/* Channel List */}
                <div className={`w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col ${!showMobileList && selectedChannel ? 'hidden md:flex' : 'flex'
                    } ${showMobileList ? 'w-full md:w-80' : ''}`}>
                    {/* Search */}
                    <div className="p-3">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search channels..."
                                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Channel List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredChannels.length === 0 ? (
                            <div className="text-center text-zinc-400 text-sm py-12">No channels yet</div>
                        ) : (
                            filteredChannels.map(ch => (
                                <button
                                    key={ch.id}
                                    onClick={() => {
                                        setSelectedChannel(ch);
                                        setShowMobileList(false);
                                    }}
                                    className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 ${selectedChannel?.id === ch.id
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600'
                                        : ''
                                        }`}
                                >
                                    <div className="mt-0.5">{getChannelIcon(ch.channel_type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold truncate">{ch.name}</span>
                                            {ch.lastMessage && (
                                                <span className="text-[10px] text-zinc-400 shrink-0 ml-2">
                                                    {formatTime(ch.lastMessage.created_at)}
                                                </span>
                                            )}
                                        </div>
                                        {ch.lastMessage && (
                                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                                                {ch.lastMessage.body}
                                            </p>
                                        )}
                                    </div>
                                    {ch.muted && <BellOff size={12} className="text-zinc-300 mt-1" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Message Area */}
                <div className={`flex-1 flex flex-col ${showMobileList && selectedChannel ? 'hidden md:flex' : 'flex'
                    }`}>
                    {!selectedChannel ? (
                        <div className="flex-1 flex items-center justify-center text-zinc-400">
                            <div className="text-center">
                                <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="text-sm">Select a channel to start chatting</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Channel Header */}
                            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                                <button
                                    onClick={() => setShowMobileList(true)}
                                    className="md:hidden p-1"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                {getChannelIcon(selectedChannel.channel_type)}
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold">{selectedChannel.name}</h3>
                                    {selectedChannel.description && (
                                        <p className="text-[11px] text-zinc-400">{selectedChannel.description}</p>
                                    )}
                                    {Object.keys(presenceUsers).length > 0 && (
                                        <p className="text-[10px] text-green-500 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                            {Object.keys(presenceUsers).length} online
                                        </p>
                                    )}
                                </div>
                                <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                    <UserPlus size={16} className="text-zinc-400" />
                                </button>
                                <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                    <Settings size={16} className="text-zinc-400" />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                                {loadingMessages ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="animate-spin text-blue-600" size={24} />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                                        No messages yet. Say hello!
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.sender_id === user?.id ||
                                            msg.company_members?.profiles?.full_name === profile?.full_name;
                                        const showAvatar = idx === 0 ||
                                            messages[idx - 1]?.sender_id !== msg.sender_id;
                                        const senderName = msg.company_members?.profiles?.full_name || 'User';

                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                                            >
                                                {showAvatar ? (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMe
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                                                        }`}>
                                                        {senderName.charAt(0).toUpperCase()}
                                                    </div>
                                                ) : (
                                                    <div className="w-8 shrink-0" />
                                                )}
                                                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                    {showAvatar && !isMe && (
                                                        <span className="text-[11px] font-medium text-zinc-500 mb-0.5 block">
                                                            {senderName}
                                                        </span>
                                                    )}
                                                    <div
                                                        className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${isMe
                                                            ? 'bg-blue-600 text-white rounded-tr-md'
                                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-md'
                                                            }`}
                                                    >
                                                        {msg.body}
                                                        {msg.is_edited && (
                                                            <span className="text-[10px] opacity-60 ml-2">(edited)</span>
                                                        )}
                                                    </div>
                                                    <span className={`text-[10px] text-zinc-400 mt-0.5 block ${isMe ? 'text-right' : ''
                                                        }`}>
                                                        {formatTime(msg.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
                                {/* Typing Indicator */}
                                {Object.keys(typingUsers).length > 0 && (
                                    <div className="text-[11px] text-blue-500 mb-1.5 px-1 animate-pulse">
                                        {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
                                    </div>
                                )}
                                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 py-2">
                                    <button className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                        <Paperclip size={16} className="text-zinc-400" />
                                    </button>
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={e => { setMessage(e.target.value); broadcastTyping(); }}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-0"
                                    />
                                    <button className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                        <Smile size={16} className="text-zinc-400" />
                                    </button>
                                    <button
                                        onClick={sendMessage}
                                        disabled={!message.trim() || sending}
                                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all"
                                    >
                                        {sending ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Send size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
