import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Video, Calendar, Users, Plus, Send,
  Mic, Paperclip, Search, Phone, MoreVertical, Clock,
  CheckCheck, ChevronRight, Loader2, X
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

export default function MeetingsModule() {
  const { company } = useCompany();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'meetings'>('chat');

  // ─── Chat state ────────────────────────────────────────────────────
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loadingChat, setLoadingChat] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Meetings state ────────────────────────────────────────────────
  const [meetings, setMeetings] = useState<any[]>([]);
  const [meetingStats, setMeetingStats] = useState({ today: 0, week: 0 });
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ title: '', scheduled_at: '', duration_minutes: '30' });
  const [meetingSaving, setMeetingSaving] = useState(false);

  // Load channels
  useEffect(() => {
    if (!company?.id) return;
    supabase
      .from('chats')
      .select('id, name, type, last_message, updated_at')
      .eq('company_id', company.id)
      .order('updated_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        const ch = data ?? [];
        setChannels(ch);
        if (ch.length > 0 && !selectedChannel) setSelectedChannel(ch[0]);
        setLoadingChat(false);
      });
  }, [company?.id]);

  // Load messages for selected channel
  useEffect(() => {
    if (!selectedChannel?.id) return;
    supabase
      .from('chat_messages')
      .select('id, content, sender_id, created_at, profiles(full_name)')
      .eq('chat_id', selectedChannel.id)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => setMessages(data ?? []));
  }, [selectedChannel?.id]);

  // Real-time messages subscription
  useEffect(() => {
    if (!selectedChannel?.id) return;
    const sub = supabase
      .channel(`chat-${selectedChannel.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${selectedChannel.id}` },
        (payload) => setMessages(prev => [...prev, payload.new])
      )
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [selectedChannel?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load meetings
  useEffect(() => {
    if (!company?.id) return;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    supabase
      .from('meetings')
      .select('id, title, scheduled_at, duration_minutes, participant_count, status')
      .eq('company_id', company.id)
      .gte('scheduled_at', todayStr)
      .order('scheduled_at', { ascending: true })
      .limit(20)
      .then(({ data }) => {
        const m = data ?? [];
        setMeetings(m);
        setMeetingStats({
          today: m.filter((x: any) => x.scheduled_at?.startsWith(todayStr)).length,
          week: m.length,
        });
        setLoadingMeetings(false);
      });
  }, [company?.id]);

  const sendMessage = async () => {
    if (!message.trim() || !selectedChannel?.id || !user?.id) return;
    const text = message;
    setMessage('');
    await supabase.from('chat_messages').insert({
      chat_id: selectedChannel.id,
      sender_id: user.id,
      content: text,
    });
    // Update last_message on chat
    await supabase.from('chats').update({ last_message: text, updated_at: new Date().toISOString() }).eq('id', selectedChannel.id);
  };

  const scheduleMeeting = async () => {
    if (!meetingForm.title.trim() || !meetingForm.scheduled_at || !company?.id) return;
    setMeetingSaving(true);
    try {
      const { data, error } = await supabase.from('meetings').insert({
        title: meetingForm.title.trim(),
        scheduled_at: meetingForm.scheduled_at,
        duration_minutes: parseInt(meetingForm.duration_minutes) || 30,
        participant_count: 0,
        status: 'scheduled',
        company_id: company.id,
      }).select().single();
      if (!error && data) {
        setMeetings(prev => [...prev, data].sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? '')));
        const todayStr = new Date().toISOString().slice(0, 10);
        setMeetingStats(prev => ({
          today: data.scheduled_at?.startsWith(todayStr) ? prev.today + 1 : prev.today,
          week: prev.week + 1,
        }));
      }
      setMeetingForm({ title: '', scheduled_at: '', duration_minutes: '30' });
      setShowSchedule(false);
    } finally {
      setMeetingSaving(false);
    }
  };

  const cancelMeeting = async (id: string) => {
    await supabase.from('meetings').delete().eq('id', id);
    setMeetings(prev => prev.filter(m => m.id !== id));
    setMeetingStats(prev => ({ today: Math.max(0, prev.today - 1), week: Math.max(0, prev.week - 1) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Meetings & Chat</h1>
          <p className="text-zinc-500 mt-1 text-sm">Team communication, meetings, and video calls</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSchedule(true)} className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
            <Calendar size={14} /> Schedule Meeting
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {(['chat', 'meetings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
          >
            {tab === 'chat' && <MessageSquare size={14} className="inline mr-2" />}
            {tab === 'meetings' && <Video size={14} className="inline mr-2" />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'chat' && (
        <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden" style={{ height: '600px' }}>
          {/* Channel List */}
          <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="p-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input type="text" placeholder="Search channels..." className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-2 pl-9 pr-3 text-xs font-medium" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingChat && <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-zinc-400" /></div>}
              {!loadingChat && channels.length === 0 && <p className="text-center text-xs text-zinc-400 py-8">No channels yet</p>}
              {channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch)}
                  className={`w-full text-left p-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all ${selectedChannel?.id === ch.id ? 'bg-blue-50 dark:bg-blue-600/10' : ''
                    }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {(ch.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">{ch.name}</span>
                      <span className="text-[10px] text-zinc-400">{ch.updated_at ? new Date(ch.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{ch.last_message || 'No messages'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedChannel ? (
              <>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-bold">
                      {(selectedChannel.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{selectedChannel.name}</h4>
                      <p className="text-[10px] text-zinc-500">{selectedChannel.type === 'group' ? 'Group' : 'Direct'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"><Phone size={16} className="text-zinc-500" /></button>
                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"><Video size={16} className="text-zinc-500" /></button>
                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"><MoreVertical size={16} className="text-zinc-500" /></button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && <p className="text-center text-zinc-400 text-xs py-8">No messages yet. Start the conversation!</p>}
                  {messages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    const senderName = (msg as any).profiles?.full_name || 'Unknown';
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs rounded-2xl px-4 py-2.5 ${isMe ? 'bg-blue-600 text-white rounded-br-md' : 'bg-zinc-100 dark:bg-zinc-800 rounded-bl-md'}`}>
                          {!isMe && <div className="text-[10px] font-bold text-blue-600 mb-1">{senderName}</div>}
                          <p className="text-sm">{msg.content}</p>
                          <div className={`text-[9px] mt-1 flex items-center gap-1 ${isMe ? 'text-blue-200 justify-end' : 'text-zinc-400'}`}>
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            {isMe && <CheckCheck size={10} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"><Paperclip size={18} className="text-zinc-400" /></button>
                    <input
                      type="text"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-2.5 px-4 text-sm font-medium"
                    />
                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"><Mic size={18} className="text-zinc-400" /></button>
                    <button onClick={sendMessage} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all"><Send size={16} /></button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">Select a channel to start chatting</div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Meeting Form */}
      {showSchedule && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">Schedule New Meeting</h3>
            <button onClick={() => setShowSchedule(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Meeting title"
              value={meetingForm.title}
              onChange={e => setMeetingForm(f => ({ ...f, title: e.target.value }))}
              className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-2.5 px-4 text-sm font-medium"
            />
            <input
              type="datetime-local"
              value={meetingForm.scheduled_at}
              onChange={e => setMeetingForm(f => ({ ...f, scheduled_at: e.target.value }))}
              className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-2.5 px-4 text-sm font-medium"
            />
            <select
              value={meetingForm.duration_minutes}
              onChange={e => setMeetingForm(f => ({ ...f, duration_minutes: e.target.value }))}
              className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-2.5 px-4 text-sm font-medium"
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={scheduleMeeting}
              disabled={meetingSaving || !meetingForm.title.trim() || !meetingForm.scheduled_at}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {meetingSaving ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
              Schedule
            </button>
          </div>
        </div>
      )}

      {activeTab === 'meetings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Today's Meetings</div>
              <div className="text-2xl font-black mt-2">{loadingMeetings ? '-' : meetingStats.today}</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">This Week</div>
              <div className="text-2xl font-black mt-2">{loadingMeetings ? '-' : meetingStats.week}</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Total Hours</div>
              <div className="text-2xl font-black mt-2">{loadingMeetings ? '-' : (meetings.reduce((s, m) => s + (m.duration_minutes || 0), 0) / 60).toFixed(1)}</div>
            </div>
          </div>
          {loadingMeetings && <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-zinc-400" /></div>}
          {!loadingMeetings && meetings.length === 0 && <p className="text-center text-zinc-400 text-sm py-8">No upcoming meetings</p>}
          {meetings.map(meeting => (
            <div key={meeting.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${meeting.status === 'live' ? 'bg-red-50 text-red-600 dark:bg-red-500/10' : 'bg-blue-50 text-blue-600 dark:bg-blue-600/10'
                  }`}>
                  <Video size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{meeting.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Clock size={12} /> {meeting.scheduled_at ? new Date(meeting.scheduled_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    <span>{meeting.duration_minutes || 0} min</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {meeting.participant_count || 0}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {meeting.status === 'live' ? (
                  <button className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Join Now</button>
                ) : (
                  <>
                    <button onClick={() => cancelMeeting(meeting.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-2 rounded-xl text-xs font-bold transition-all">Cancel</button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Details</button>
                  </>
                )}
                <ChevronRight size={16} className="text-zinc-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
