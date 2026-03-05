import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  Shield, Building2, Users, BarChart3, 
  Settings, Zap, Megaphone, Wrench,
  CheckCircle2, XCircle, Clock, Search, Link as LinkIcon, Server, Activity,
  Mail, MessageSquare, Globe, Database, HardDrive, Cpu, Plus, Edit2, Trash2, LayoutTemplate, Box, RefreshCw, Video, Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { HeaderControls } from '../components/HeaderControls';

const TenantManagement = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Tenant Management</h2>
      <div className="flex gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input type="text" placeholder="Search companies..." className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium w-64" />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus size={16} /> Add Tenant
        </button>
      </div>
    </div>
    <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Company</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Type</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Plan</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Payment</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {[
            { name: 'Acme Corp', type: 'Retail', plan: 'Business', status: 'Active', payment: 'Stripe (Active)' },
            { name: 'Global Tech', type: 'Trading', plan: 'Pro', status: 'Active', payment: 'Stripe (Active)' },
            { name: 'New Startup', type: 'Engineering', plan: 'Starter', status: 'Pending Review', payment: 'Pending' },
          ].map((tenant, i) => (
            <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-xs">{tenant.name.charAt(0)}</div>
                  <span className="text-sm font-bold">{tenant.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-xs font-medium text-zinc-500">{tenant.type}</td>
              <td className="px-6 py-4 text-xs font-bold text-blue-500 uppercase tracking-widest">{tenant.plan}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  tenant.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>{tenant.status}</span>
              </td>
              <td className="px-6 py-4 text-xs font-medium text-zinc-500">
                <span className={`flex items-center gap-1 ${tenant.payment.includes('Stripe') ? 'text-blue-500' : 'text-amber-500'}`}>
                  {tenant.payment.includes('Stripe') ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {tenant.payment}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-emerald-500" title="Approve">
                    <CheckCircle2 size={16} />
                  </button>
                  <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-blue-500" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-red-500" title="Suspend">
                    <XCircle size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ModulesProvisioning = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Modules & Provisioning</h2>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-2">
        <Plus size={16} /> New Company Type
      </button>
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {[
        { type: 'Retail / Shop', modules: ['POS', 'Inventory', 'Accounting', 'HR'], active: 45 },
        { type: 'Trading Company', modules: ['CRM', 'Logistics', 'Accounting', 'B2B Portal'], active: 12 },
        { type: 'Engineering', modules: ['Projects', 'Contracts', 'HR', 'Accounting'], active: 8 },
      ].map((ct, i) => (
        <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center">
                <LayoutTemplate size={20} />
              </div>
              <h3 className="font-black text-lg">{ct.type}</h3>
            </div>
            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">{ct.active} Active</span>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Provisioned Modules</p>
            <div className="flex flex-wrap gap-2">
              {ct.modules.map(m => (
                <span key={m} className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Box size={12} className="text-blue-500" /> {m}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
            <button className="text-xs font-bold text-zinc-500 hover:text-blue-600 transition-colors">Edit Template</button>
            <button className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors">Delete</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AIBuilder = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black uppercase tracking-tighter">RARE AI Builder</h2>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-2">
        <Plus size={16} /> Create Agent
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h3 className="font-black uppercase tracking-tight mb-6">Active Agents & Prompts</h3>
        <div className="space-y-4">
          {['RARE GM', 'RARE Accounting', 'RARE HR', 'RARE Sales'].map((t) => (
            <div key={t} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-blue-500 border border-transparent transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center">
                  <Zap size={14} />
                </div>
                <span className="text-sm font-bold uppercase tracking-tight">{t}</span>
              </div>
              <Settings size={16} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-zinc-900 text-white p-8 rounded-[40px] flex flex-col justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 pointer-events-none" />
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg shadow-blue-600/30">
          <Cpu size={32} />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight mb-2 relative z-10">Global AI Engine</h3>
        <p className="text-blue-200 text-sm mb-8 relative z-10 font-medium">Gemini 3.1 Pro Preview Active</p>
        <button className="bg-white text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-100 transition-all relative z-10">
          Configure Global Parameters
        </button>
      </div>
    </div>
  </div>
);

const MarketingSystem = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Marketing & Comms</h2>
      <div className="flex gap-2">
        <button className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
          <Globe size={16} /> Landing Page
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Megaphone size={16} /> New Campaign
        </button>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* RARE AI Content Creation & Publishing */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-sm md:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
              <Zap size={20} />
            </div>
            <h3 className="font-black uppercase tracking-tight">RARE AI Content Creation & Publishing</h3>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><Globe size={12}/> Google Ads</span>
            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><Video size={12}/> YouTube</span>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><Users size={12}/> Meta</span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <input type="text" placeholder="Campaign Topic or Goal (e.g., 'Promote new HR module to retail businesses')" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors" />
            <div className="flex gap-4">
              <select className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors">
                <option>Tone: Professional</option>
                <option>Tone: Engaging & Fun</option>
                <option>Tone: Urgent & Direct</option>
              </select>
              <select className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors">
                <option>Target: All Platforms</option>
                <option>Target: Google Search Ads</option>
                <option>Target: LinkedIn & Meta</option>
              </select>
            </div>
            <button className="w-full bg-purple-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
              <Sparkles size={16} /> Generate Campaign Assets with RARE
            </button>
          </div>
          
          <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Connected Platforms</h4>
            <div className="space-y-2">
              {[
                { name: 'Google Ads Manager', status: 'Connected', color: 'text-blue-500' },
                { name: 'Meta Business Suite', status: 'Connected', color: 'text-blue-600' },
                { name: 'YouTube Studio', status: 'Connected', color: 'text-red-500' },
                { name: 'LinkedIn Ads', status: 'Needs Auth', color: 'text-amber-500' },
                { name: 'TikTok Ads', status: 'Not Configured', color: 'text-zinc-400' },
              ].map((platform, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <span className={`text-xs font-bold ${platform.color}`}>{platform.name}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{platform.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Internal Marketing */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
            <MessageSquare size={20} />
          </div>
          <h3 className="font-black uppercase tracking-tight">Internal Announcements</h3>
        </div>
        <p className="text-sm text-zinc-500 mb-6">Send push notifications or dashboard alerts to all active tenants or specific company types.</p>
        <div className="space-y-4">
          <input type="text" placeholder="Announcement Title" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors" />
          <textarea placeholder="Message content..." rows={3} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors resize-none" />
          <button className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
            Broadcast to Tenants
          </button>
        </div>
      </div>

      {/* External Marketing / Leads */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
              <Users size={20} />
            </div>
            <h3 className="font-black uppercase tracking-tight">External Leads</h3>
          </div>
          <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">+12 Today</span>
        </div>
        
        <div className="flex-1 space-y-3 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
          {[
            { email: 'contact@techflow.com', phone: '+971 50 111 2222', time: '2 mins ago', source: 'Landing Page' },
            { email: 'info@buildsmart.ae', phone: '+971 55 333 4444', time: '1 hour ago', source: 'Google Ads' },
            { email: 'sales@megamart.com', phone: '+966 50 999 8888', time: '3 hours ago', source: 'Referral' },
          ].map((lead, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
              <div>
                <p className="text-sm font-bold">{lead.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{lead.phone}</span>
                  <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{lead.source}</span>
                </div>
              </div>
              <button className="p-2 text-zinc-400 hover:text-blue-600 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 transition-colors">
                <Mail size={14} />
              </button>
            </div>
          ))}
        </div>
        <button className="mt-4 w-full py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest transition-colors">
          View All Leads
        </button>
      </div>
    </div>
  </div>
);

const IntegrationsManager = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Integrations & Add-ons</h2>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-2">
        <Plus size={16} /> Add Integration
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { name: 'Stripe', status: 'Active', type: 'Payment', icon: '💳', desc: 'Global billing and subscriptions.' },
        { name: 'Vonage', status: 'Active', type: 'Communication', icon: '📞', desc: 'Video meetings and SMS.' },
        { name: 'Google Workspace', status: 'Configured', type: 'Productivity', icon: 'G', desc: 'SSO and calendar sync.' },
        { name: 'OpenAI', status: 'Active', type: 'AI', icon: '🤖', desc: 'Fallback AI models.' },
        { name: 'Meta WhatsApp', status: 'Pending', type: 'Messaging', icon: '💬', desc: 'WhatsApp Business API.' },
        { name: 'Cloudflare', status: 'Active', type: 'Infrastructure', icon: '☁️', desc: 'CDN, WAF, and Workers.' },
      ].map((integration, i) => (
        <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between group hover:border-blue-500 transition-colors">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {integration.icon}
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                integration.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 
                integration.status === 'Pending' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
              }`}>{integration.status}</span>
            </div>
            <h3 className="font-black text-lg">{integration.name}</h3>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2">{integration.type}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{integration.desc}</p>
          </div>
          <div className="mt-6 flex gap-2">
            <button className="flex-1 py-2.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors border border-zinc-200 dark:border-zinc-700">
              Settings
            </button>
            <button className="p-2.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-500 hover:text-red-500 transition-colors border border-zinc-200 dark:border-zinc-700" title="Disable">
              <XCircle size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DemoRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('demo_requests')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setRequests(data || []);
      } catch (err) {
        console.error('Error fetching demo requests:', err);
        // Fallback mock data
        setRequests([
          { id: '1', company_name: 'TechFlow', industry: 'Consulting', status: 'pending', created_at: new Date().toISOString(), services: ['Accounting', 'CRM'] },
          { id: '2', company_name: 'BuildSmart', industry: 'Contracting', status: 'approved', created_at: new Date(Date.now() - 86400000).toISOString(), services: ['HR', 'Logistics'] },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Demo Requests</h2>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input type="text" placeholder="Search requests..." className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium w-64" />
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Company</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Industry</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Requested Modules</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Date</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-zinc-500">Loading...</td></tr>
            ) : requests.map((req, i) => (
              <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm font-bold">{req.company_name}</span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-zinc-500">{req.industry}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {req.services?.map((s: string) => (
                      <span key={s} className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded-md font-bold">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-zinc-500">{new Date(req.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 
                    req.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>{req.status}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-emerald-500" title="Approve & Provision">
                      <CheckCircle2 size={16} />
                    </button>
                    <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-red-500" title="Reject">
                      <XCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MaintenanceControl = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-black uppercase tracking-tighter">System Maintenance</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* System Status */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight">System Status</h3>
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">All services operational</p>
            </div>
          </div>
          <button className="p-2 text-zinc-400 hover:text-blue-600 transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="space-y-4">
          {[
            { service: 'API Gateway (Cloudflare)', uptime: '99.99%', latency: '45ms', icon: Globe },
            { service: 'Database (Supabase)', uptime: '100%', latency: '12ms', icon: Database },
            { service: 'AI Engine (Gemini)', uptime: '99.95%', latency: '850ms', icon: Cpu },
            { service: 'Storage (R2)', uptime: '100%', latency: '25ms', icon: HardDrive },
          ].map((stat, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <stat.icon size={16} className="text-zinc-400" />
                <span className="text-sm font-bold">{stat.service}</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-emerald-500">{stat.uptime}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{stat.latency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Controls */}
      <div className="space-y-6">
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-8 rounded-[32px] shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
              <Wrench size={24} />
            </div>
            <div>
              <h3 className="font-black text-amber-700 dark:text-amber-500 uppercase tracking-tight mb-2">Maintenance Mode</h3>
              <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mb-6">Enable this to lock out all non-founder users for system upgrades. A maintenance page will be shown.</p>
              <button className="bg-amber-500 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20">
                Enable Maintenance Mode
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="font-black uppercase tracking-tight mb-6">Cache & Optimization</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-2xl transition-colors border border-zinc-100 dark:border-zinc-700 group">
              <div className="flex items-center gap-3">
                <Server size={18} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
                <div className="text-left">
                  <span className="block text-sm font-bold">Clear Global Cache</span>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Cloudflare Edge & Redis</span>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Execute</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-2xl transition-colors border border-zinc-100 dark:border-zinc-700 group">
              <div className="flex items-center gap-3">
                <Search size={18} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
                <div className="text-left">
                  <span className="block text-sm font-bold">Rebuild Search Indexes</span>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Supabase Full-Text Search</span>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Execute</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ... (Keep the rest of the file the same, just add the new route and import RefreshCw)


export default function FounderPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-72 h-[calc(100vh-80px)] bg-zinc-900 text-white flex flex-col sticky top-20">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-xl">Z</div>
            <span className="text-xl font-black tracking-tighter uppercase">Zien Founder</span>
          </Link>
          <nav className="space-y-2">
            {[
              { icon: Building2, label: 'Tenants', path: '' },
              { icon: LayoutTemplate, label: 'Modules', path: 'modules' },
              { icon: Users, label: 'Demo Requests', path: 'demos' },
              { icon: Zap, label: 'AI Builder', path: 'ai' },
              { icon: Megaphone, label: 'Marketing', path: 'marketing' },
              { icon: LinkIcon, label: 'Integrations', path: 'integrations' },
              { icon: Wrench, label: 'Maintenance', path: 'maintenance' },
              { icon: Shield, label: 'Security', path: 'security' },
              { icon: BarChart3, label: 'Analytics', path: 'analytics' },
            ].map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                end
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
                `}
              >
                <item.icon size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Founder Access</p>
            <p className="text-xs font-bold truncate">gm@zien-ai.app</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="p-8">
          <Routes>
            <Route path="/" element={<TenantManagement />} />
            <Route path="/modules" element={<ModulesProvisioning />} />
            <Route path="/demos" element={<DemoRequests />} />
            <Route path="/ai" element={<AIBuilder />} />
            <Route path="/marketing" element={<MarketingSystem />} />
            <Route path="/integrations" element={<IntegrationsManager />} />
            <Route path="/maintenance" element={<MaintenanceControl />} />
            {/* Add other routes */}
          </Routes>
        </div>
      </main>
    </div>
  );
}
