import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';
import { supabase } from '../services/supabase';
import { generateRAREAnalysis, RAREAgentType } from '../services/geminiService';
import { 
  Clock, Calendar, Wallet, FileText, 
  CheckCircle2, AlertCircle, User, LayoutDashboard,
  BarChart3, Users, Globe2, MessageSquare, 
  Map as MapIcon, Settings, LogOut, Search,
  Plus, Filter, Download, Bell, Briefcase,
  TrendingUp, ShieldCheck, Zap, Video,
  Truck, Navigation, Smartphone, Car,
  Phone, Send, Menu, X, MoreVertical, ChevronRight,
  Sparkles, Bot, BrainCircuit, GraduationCap
} from 'lucide-react';
import PayrollPage from './employee/PayrollPage';
import AcademicPage from './employee/AcademicPage';
import LogisticsMap from '../components/LogisticsMap';

type Tab = 'dashboard' | 'accounting' | 'hr' | 'sales' | 'logistics' | 'chat' | 'payroll' | 'academic';

interface Message {
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
}

export default function EmployeePortal({ user }: { user: any }) {
  const { language, mode, t: translate } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // Sync tab with URL
  useEffect(() => {
    const path = window.location.pathname.replace('/portal', '').replace('/', '');
    if (path && ['dashboard', 'accounting', 'hr', 'sales', 'logistics', 'chat', 'payroll', 'academic'].includes(path)) {
      setActiveTab(path as Tab);
    } else if (!path || path === '') {
      setActiveTab('dashboard');
    }
  }, [window.location.pathname]);

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Real-time Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('timestamp', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Subscribe to new messages
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const { error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: user.id || 'anonymous',
          receiver_id: 'broadcast',
          content: chatInput,
          timestamp: new Date().toISOString()
        }
      ]);

    if (error) console.error('Error sending message:', error);
    setChatInput('');
  };

  // RARE AI Assistant State
  const [isRareOpen, setIsRareOpen] = useState(false);
  const [rareQuery, setRareQuery] = useState('');
  const [rareResponse, setRareResponse] = useState('');
  const [isRareLoading, setIsRareLoading] = useState(false);

  const handleRareAsk = async () => {
    if (!rareQuery.trim()) return;
    setIsRareLoading(true);
    setRareResponse('');
    
    const agentType: RAREAgentType = activeTab === 'dashboard' ? 'gm' : 
                                     activeTab === 'accounting' ? 'accounting' :
                                     activeTab === 'hr' ? 'hr' :
                                     activeTab === 'sales' ? 'sales' :
                                     activeTab === 'logistics' ? 'fleet' : 'secretary';

    const response = await generateRAREAnalysis(agentType, rareQuery, {
      pageCode: 'employee_portal',
      moduleCode: activeTab,
      companyName: user?.companyName || 'ZIEN Tenant',
      userRole: user?.role || 'employee',
      language,
      theme: mode,
      mode: 'analyze',
      additionalData: { activeTab }
    });

    setRareResponse(response);
    setIsRareLoading(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Working Hours', value: '164.5h', icon: Clock, color: 'text-blue-600', sub: '+12h this month' },
                { label: 'Leaves Balance', value: '14 Days', icon: Calendar, color: 'text-orange-600', sub: 'Next reset: Jan 2025' },
                { label: 'Next Payout', value: 'AED 12,400', icon: Wallet, color: 'text-green-600', sub: 'Estimated: Nov 30' },
                { label: 'Active Tasks', value: '8', icon: CheckCircle2, color: 'text-purple-600', sub: '3 due today' },
              ].map((stat, i) => (
                <div key={i} className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-4 font-bold text-sm opacity-80">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    {stat.label}
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-xs font-medium mt-1 opacity-60">{stat.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="glass-card p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Assigned Tasks</h2>
                    <button className="text-blue-600 text-sm font-bold">View All</button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { title: 'Update API Documentation', project: 'ZIEN Core', priority: 'High', due: 'Tomorrow' },
                      { title: 'Fix Mobile Navigation Bug', project: 'ZIEN UI', priority: 'Medium', due: 'Friday' },
                      { title: 'Implement RLS Policies', project: 'Security', priority: 'Critical', due: 'Today' },
                    ].map((task, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-black/5 rounded-xl border border-[var(--border-soft)]">
                        <div>
                          <div className="font-bold text-sm">{task.title}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{task.project}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md inline-block mb-1 ${
                            task.priority === 'Critical' ? 'bg-red-100 text-red-600' : 
                            task.priority === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {task.priority}
                          </div>
                          <div className="text-[10px] text-[var(--text-secondary)]">Due: {task.due}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="glass-card p-8 bg-blue-600 text-white border-0 relative overflow-hidden">
                  <img 
                    src={ASSETS.RARE_CHARACTER} 
                    alt="RARE Character" 
                    className="absolute -right-4 -bottom-4 w-32 h-auto opacity-30 pointer-events-none" 
                    {...IMAGE_PROPS}
                  />
                  <h2 className="text-xl font-bold mb-4 relative z-10">RARE AI Assistant</h2>
                  <p className="text-sm opacity-80 mb-6 relative z-10">
                    "You have 3 pending tasks for this week. Would you like me to help you prioritize them?"
                  </p>
                  <button 
                    onClick={() => setIsRareOpen(true)}
                    className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all relative z-10 flex items-center justify-center gap-2"
                  >
                    <Bot className="w-5 h-5" /> Chat with RARE
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'accounting':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Accounting & Finance</h2>
              <div className="flex gap-3">
                <button className="glass-card px-4 py-2 flex items-center gap-2 text-sm font-bold">
                  <Download className="w-4 h-4" /> Export
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold">
                  <Plus className="w-4 h-4" /> New Invoice
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 border-blue-500/20">
                <div className="text-sm font-bold text-blue-600 mb-2 uppercase tracking-wider">Total Revenue</div>
                <div className="text-3xl font-bold">AED 1,240,500</div>
                <div className="text-xs text-green-500 font-bold mt-2">↑ 12.5% from last quarter</div>
              </div>
              <div className="glass-card p-6">
                <div className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wider">Total Expenses</div>
                <div className="text-3xl font-bold">AED 450,200</div>
                <div className="text-xs text-red-500 font-bold mt-2">↑ 4.2% from last month</div>
              </div>
              <div className="glass-card p-6">
                <div className="text-sm font-bold text-green-600 mb-2 uppercase tracking-wider">Tax Liability (VAT)</div>
                <div className="text-3xl font-bold">AED 62,025</div>
                <div className="text-xs text-[var(--text-secondary)] font-bold mt-2">Due in 14 days</div>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-[var(--border-soft)] flex items-center justify-between">
                <h3 className="font-bold">Recent Invoices</h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search invoices..." className="bg-black/5 border border-[var(--border-soft)] rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <button className="p-2 glass-card rounded-lg"><Filter className="w-4 h-4" /></button>
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-black/5 text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Invoice ID</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {[
                    { id: 'INV-2024-001', client: 'TechFlow Solutions', amount: 'AED 12,500', status: 'Paid', date: 'Nov 15, 2024' },
                    { id: 'INV-2024-002', client: 'Global Trade Co', amount: 'AED 45,000', status: 'Pending', date: 'Nov 18, 2024' },
                    { id: 'INV-2024-003', client: 'Emirates Retail', amount: 'AED 8,200', status: 'Overdue', date: 'Nov 10, 2024' },
                  ].map((inv, i) => (
                    <tr key={i} className="hover:bg-black/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-600">{inv.id}</td>
                      <td className="px-6 py-4">{inv.client}</td>
                      <td className="px-6 py-4 font-bold">{inv.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          inv.status === 'Paid' ? 'bg-green-100 text-green-600' : 
                          inv.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">{inv.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'hr':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">HR & People Operations</h2>
              <div className="flex gap-3">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold">
                  <Plus className="w-4 h-4" /> Add Employee
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="glass-card p-6">
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Total Employees</div>
                    <div className="text-2xl font-bold">124</div>
                    <div className="text-[10px] text-green-500 font-bold mt-1">+4 this month</div>
                  </div>
                  <div className="glass-card p-6">
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Attendance Today</div>
                    <div className="text-2xl font-bold">92%</div>
                    <div className="text-[10px] text-orange-500 font-bold mt-1">10 employees on leave</div>
                  </div>
                  <div className="glass-card p-6">
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Payroll Status</div>
                    <div className="text-2xl font-bold text-green-600">Ready</div>
                    <div className="text-[10px] text-[var(--text-secondary)] font-bold mt-1">Next run: Nov 28</div>
                  </div>
                </div>

                <div className="glass-card p-8">
                  <h3 className="font-bold mb-6">Employee Directory</h3>
                  <div className="space-y-4">
                    {[ 
                      { name: 'Sarah Ahmed', role: 'Senior Accountant', dept: 'Finance', status: 'Active' },
                      { name: 'John Doe', role: 'Sales Manager', dept: 'Sales', status: 'On Leave' },
                      { name: 'Fatima Hassan', role: 'HR Specialist', dept: 'HR', status: 'Active' },
                    ].map((emp, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-black/5 rounded-xl border border-[var(--border-soft)]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                            {emp.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{emp.name}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{emp.role} • {emp.dept}</div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          emp.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {emp.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-card p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> Document Vault
                  </h3>
                  <div className="space-y-3">
                    {['Employee Handbook.pdf', 'Tax Forms 2024.zip', 'Health Insurance.pdf'].map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-black/5 rounded-lg text-xs hover:bg-black/10 transition-all cursor-pointer">
                        <span className="truncate">{doc}</span>
                        <Download className="w-3 h-3 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-600" /> Reminders
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-1 h-10 bg-orange-500 rounded-full" />
                      <div>
                        <div className="text-xs font-bold">Visa Renewal: Ahmed Ali</div>
                        <div className="text-[10px] text-red-500">Expires in 5 days</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-1 h-10 bg-blue-500 rounded-full" />
                      <div>
                        <div className="text-xs font-bold">Probation Review: Fatima</div>
                        <div className="text-[10px] text-[var(--text-secondary)]">Scheduled: Tomorrow</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'payroll':
        return <PayrollPage />;

      case 'logistics':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Logistics & Fleet Tracking</h2>
              <div className="flex gap-3">
                <button className="glass-card px-4 py-2 flex items-center gap-2 text-sm font-bold hover:bg-black/5 transition-all">
                  <Car className="w-4 h-4" /> CarPlay Mode
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                  <Navigation className="w-4 h-4" /> Dispatch Task
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-card h-[600px] relative overflow-hidden bg-slate-900 border-0 shadow-2xl">
                {/* Real Map Integration */}
                <LogisticsMap />
                
                {/* Overlay UI */}
                <div className="absolute top-6 left-6 glass-card p-6 bg-black/60 backdrop-blur-xl border-white/10 text-white max-w-xs pointer-events-none z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                    <span className="text-xs font-bold uppercase tracking-widest">Live Fleet Grounding</span>
                  </div>
                  <div className="text-3xl font-bold mb-2">12 Active</div>
                  <p className="text-[10px] text-blue-300 leading-relaxed">RARE is currently grounding fleet data with real-time Google Maps traffic and routing information.</p>
                </div>

                {/* Driver Cards Overlay */}
                <div className="absolute bottom-6 left-6 right-6 flex gap-4 overflow-x-auto pb-4 no-scrollbar z-10">
                  {[
                    { name: 'Mohammed K.', status: 'On Route', location: 'Sheikh Zayed Rd', battery: '85%', eta: '12m' },
                    { name: 'Saeed A.', status: 'Delivering', location: 'DIFC Area', battery: '42%', eta: '5m' },
                    { name: 'Ali H.', status: 'Idle', location: 'Warehouse A', battery: '100%', eta: '-' },
                    { name: 'Omar F.', status: 'Charging', location: 'Tesla Supercharger', battery: '12%', eta: '45m' },
                  ].map((driver, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -5 }}
                      className="glass-card p-4 min-w-[220px] bg-black/60 backdrop-blur-xl border-white/10 text-white shadow-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-sm">{driver.name}</span>
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${driver.status === 'Idle' ? 'bg-gray-400' : 'bg-green-500'}`} />
                          <span className="text-[10px] opacity-60">{driver.eta}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-blue-400 font-bold mb-1">{driver.status}</div>
                      <div className="text-[10px] opacity-60 mb-3 truncate">{driver.location}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: driver.battery }} />
                        </div>
                        <span className="text-[9px] font-bold">{driver.battery}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-card p-8 bg-black/5 border-[var(--border-soft)]">
                  <h3 className="font-bold mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" /> RARE Fleet Intelligence
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-600/5 rounded-xl border border-blue-600/20">
                      <p className="text-xs text-blue-600 font-bold mb-2 uppercase tracking-widest">AI Optimization Alert</p>
                      <p className="text-sm leading-relaxed">RARE has detected heavy traffic on E11. Re-routing Driver 04 through Al Khail Road to save 18 minutes.</p>
                      <button className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">Apply Optimization</button>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Recent Activity</p>
                      {[
                        { id: 'SHP-9021', destination: 'Dubai Mall', status: 'Arrived' },
                        { id: 'SHP-9025', destination: 'JLT Cluster V', status: 'In Transit' },
                        { id: 'SHP-9030', destination: 'Business Bay', status: 'Delayed' },
                      ].map((shp, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-black/5 rounded-lg border border-[var(--border-soft)]">
                          <div className="text-xs font-bold">{shp.id}</div>
                          <div className="text-[10px] opacity-60">{shp.destination}</div>
                          <div className={`text-[9px] font-bold ${shp.status === 'Delayed' ? 'text-red-500' : 'text-green-500'}`}>{shp.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-card p-8 bg-gradient-to-br from-slate-900 to-black text-white border-0 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Smartphone className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-600 rounded-xl">
                        <Car className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold">CarPlay Interface</h3>
                    </div>
                    <p className="text-xs opacity-70 mb-8 leading-relaxed">
                      Optimized UI for in-vehicle displays. Drivers can accept tasks and navigate hands-free using RARE Voice.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Simulator</button>
                      <button className="py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Pair Device</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="h-[calc(100vh-12rem)] flex flex-col lg:flex-row gap-6">
            {/* Chat List - Hidden on mobile when chat is active */}
            <div className="w-full lg:w-80 glass-card flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[var(--border-soft)]">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search chats..." className="w-full bg-black/5 border border-[var(--border-soft)] pl-10 pr-4 py-2 rounded-lg text-sm outline-none" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {[
                  { name: 'General Group', lastMsg: 'Welcome to the team!', time: '10:30 AM', active: true },
                  { name: 'RARE AI Assistant', lastMsg: 'How can I help you today?', time: 'Yesterday', active: false },
                  { name: 'Finance Team', lastMsg: 'Q4 reports are ready.', time: 'Monday', active: false },
                ].map((chat, i) => (
                  <button key={i} className={`w-full p-4 flex items-center gap-3 hover:bg-black/5 transition-all border-b border-[var(--border-soft)] ${chat.active ? 'bg-blue-600/5 border-l-4 border-l-blue-600' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                      {chat.name[0]}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm">{chat.name}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{chat.time}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] truncate">{chat.lastMsg}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 glass-card flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[var(--border-soft)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">G</div>
                  <div>
                    <div className="font-bold text-sm">General Group</div>
                    <div className="text-[10px] text-green-500 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      12 Online
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-black/5 rounded-lg"><Video className="w-5 h-5" /></button>
                  <button className="p-2 hover:bg-black/5 rounded-lg"><Phone className="w-5 h-5" /></button>
                  <button className="p-2 hover:bg-black/5 rounded-lg"><MoreVertical className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                      msg.sender_id === user?.id 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-black/5 border border-[var(--border-soft)] rounded-tl-none'
                    }`}>
                      <p>{msg.content}</p>
                      <div className={`text-[10px] mt-2 ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-[var(--text-muted)]'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-[var(--border-soft)]">
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-black/5 rounded-lg text-gray-400"><Plus className="w-5 h-5" /></button>
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..." 
                    className="flex-1 bg-black/5 border border-[var(--border-soft)] p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                  <button 
                    onClick={sendMessage}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'academic':
        return <AcademicPage />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] flex flex-col lg:flex-row">
      {/* Sidebar - Responsive */}
      <aside className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'} 
        bg-[var(--surface-2)] border-r border-[var(--border-soft)] 
        transition-all duration-300 flex flex-col sticky top-20 h-[calc(100vh-80px)] z-50
        hidden lg:flex
      `}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          {isSidebarOpen && <span className="text-xl font-bold tracking-tight hidden lg:block">ZIEN Portal</span>}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'accounting', label: 'Accounting', icon: BarChart3 },
            { id: 'hr', label: 'HR & People', icon: Users },
            { id: 'payroll', label: 'Payroll', icon: Wallet },
            { id: 'sales', label: 'Sales & CRM', icon: TrendingUp },
            { id: 'logistics', label: 'Logistics', icon: Truck },
            { id: 'chat', label: 'Messages', icon: MessageSquare },
            { id: 'academic', label: 'Academic Center', icon: GraduationCap },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as Tab);
                navigate(`/${item.id === 'dashboard' ? '' : item.id}`);
              }}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'hover:bg-black/5 text-[var(--text-secondary)]'
              }`}
            >
              <item.icon className="w-6 h-6 shrink-0" />
              {isSidebarOpen && <span className="font-bold text-sm hidden lg:block">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border-soft)]">
          <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 text-red-600 transition-all">
            <LogOut className="w-6 h-6 shrink-0" />
            {isSidebarOpen && <span className="font-bold text-sm hidden lg:block">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-[var(--surface-1)] border-t border-[var(--border-soft)] px-4 py-2 flex justify-around items-center z-50 backdrop-blur-xl">
        {[
          { id: 'dashboard', icon: LayoutDashboard },
          { id: 'accounting', icon: BarChart3 },
          { id: 'hr', icon: Users },
          { id: 'logistics', icon: Truck },
          { id: 'academic', icon: GraduationCap },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id as Tab);
              navigate(`/${item.id === 'dashboard' ? '' : item.id}`);
            }}
            className={`p-3 rounded-xl ${activeTab === item.id ? 'text-blue-600 bg-blue-600/10' : 'text-[var(--text-secondary)]'}`}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RARE AI Floating Assistant */}
        <AnimatePresence>
          {isRareOpen && (
            <motion.div
              key="rare-assistant"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-24 right-8 w-96 glass-card shadow-2xl z-[60] flex flex-col overflow-hidden border-blue-500/30"
            >
              <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BrainCircuit className="w-6 h-6" />
                  <div>
                    <div className="font-bold text-sm">RARE AI Assistant</div>
                    <div className="text-[10px] opacity-80 uppercase tracking-widest">Tenant Isolated • Role Aware</div>
                  </div>
                </div>
                <button onClick={() => setIsRareOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 h-96 overflow-y-auto p-4 space-y-4 bg-white/50 backdrop-blur-sm">
                {rareResponse ? (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-900 leading-relaxed">
                    <div className="prose prose-sm max-w-none">
                      {rareResponse}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                    <Bot className="w-12 h-12 mb-2" />
                    <p className="text-xs font-medium">How can I assist you with {activeTab} today?</p>
                  </div>
                )}
                {isRareLoading && (
                  <div className="flex items-center gap-2 text-blue-600 text-xs font-bold animate-pulse">
                    <Sparkles className="w-4 h-4" /> RARE is thinking...
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[var(--border-soft)] bg-white/80">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={rareQuery}
                    onChange={(e) => setRareQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRareAsk()}
                    placeholder="Ask RARE anything..." 
                    className="flex-1 bg-black/5 border border-[var(--border-soft)] p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button 
                    onClick={handleRareAsk}
                    disabled={isRareLoading}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
