import React, { useState, useEffect } from 'react';
import { getAdminStats } from '../../api/admin';
import {
  Users,
  Zap,
  ShoppingBag,
  Wrench,
  ArrowRight,
  Activity,
  Layers,
  LayoutDashboard,
  Clock,
  ExternalLink,
  Plus,
  Box,
  Cpu,
  Building2,
  CircuitBoard,
  Plug,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getAdminStats();
        setStats(response.data.data);
      } catch (error) {
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, path, accentBg, accentText }) => (
    <div
      onClick={() => navigate(path)}
      className="workspace-card p-6 border border-[var(--border-color)] group cursor-pointer hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1">{title}</p>
          <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
            {loading ? '...' : value}
          </h3>
        </div>
        <div 
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
          style={{ background: accentBg, color: accentText }}
        >
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
      <div className="mt-6 flex items-center gap-1 group/link">
        <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[var(--accent)]">View details</span>
        <ChevronRight size={12} className="text-[var(--accent)] transition-transform duration-300 group-hover/link:translate-x-1" />
      </div>
    </div>
  );

  const QuickAction = ({ title, icon: Icon, path }) => (
    <button
      onClick={() => navigate(path)}
      className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-workspace)] hover:border-[var(--accent)] hover:bg-[var(--nav-hover)] transition-all duration-300 group w-full"
    >
      <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-dim)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] transition-all shadow-sm">
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <span className="text-[12px] font-black uppercase tracking-[0.1em] text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">{title}</span>
    </button>
  );

  return (
    <div className="space-y-8 pb-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-entrance-down mb-2">
        <div className="flex items-center gap-5">
          <div className="p-3 md:p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-sm group animate-float">
            <LayoutDashboard size={24} className="md:w-[28px] md:h-[28px] group-hover:scale-110 transition-transform duration-300 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-main)] tracking-tight leading-none uppercase">
               Dashboard
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] font-bold mt-2 uppercase tracking-[0.2em] opacity-70">
              System Overview & Analytics Hub
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total products" 
          value={stats?.products || 0} 
          icon={Zap} 
          path="/admin/products" 
          accentBg="var(--badge-admin-bg)"
          accentText="var(--badge-admin-text)"
        />
        <StatCard 
          title="Active customers" 
          value={stats?.customers || 0} 
          icon={Users} 
          path="/admin/customers" 
          accentBg="var(--badge-sales-bg)"
          accentText="var(--badge-sales-text)"
        />
        <StatCard 
          title="Project teams" 
          value={stats?.teams || 0} 
          icon={Layers} 
          path="/admin/teams" 
          accentBg="var(--badge-teams-bg)"
          accentText="var(--badge-teams-text)"
        />
        <StatCard 
          title="Maintenance logs" 
          value={stats?.maintenance || 0} 
          icon={Wrench} 
          path="/admin/maintenance" 
          accentBg="var(--badge-maint-bg)"
          accentText="var(--badge-maint-text)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Quick Actions */}
        <div className="lg:col-span-3">
          <div className="workspace-card p-6 h-full flex flex-col">
            <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em] mb-5 flex items-center gap-2">
              <Activity size={14} className="text-[var(--accent)]" /> Quick actions
            </h3>
            <div className="space-y-3 flex-1">
              <QuickAction title="New product" icon={Plus} path="/admin/products" />
              <QuickAction title="New customer" icon={Users} path="/admin/customers" />
              <QuickAction title="Manage teams" icon={Layers} path="/admin/teams" />
            </div>
          </div>
        </div>

        {/* Personnel Section */}
        <div className="lg:col-span-4">
          <div className="workspace-card p-6 h-full flex flex-col">
            <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em] mb-5 flex items-center gap-2">
              <Users size={14} className="text-[var(--accent)]" /> Personnel overview
            </h3>
            <div className="space-y-4 flex-1">
              {[
                { label: 'Designers', val: stats?.designers, role: 'Active creative', icon: Cpu, accentBg: 'var(--badge-teams-bg)', accentText: 'var(--badge-teams-text)' },
                { label: 'Sales', val: stats?.sales, role: 'Field officers', icon: Building2, accentBg: 'var(--badge-sales-bg)', accentText: 'var(--badge-sales-text)' },
                { label: 'Service', val: stats?.maintenance, role: 'Tech staff', icon: Wrench, accentBg: 'var(--badge-maint-bg)', accentText: 'var(--badge-maint-text)' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-workspace)] hover:border-[var(--accent)] hover:shadow-md transition-all group">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"
                    style={{ background: item.accentBg, color: item.accentText }}
                  >
                    <item.icon size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-0.5">{item.role}</p>
                    <h4 className="text-[13px] font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">{item.label}</h4>
                  </div>
                  <div className="text-right px-2">
                    <p className="text-xl font-black text-[var(--text-main)]">{item.val || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="lg:col-span-5">
          <div className="workspace-card p-6 h-full flex flex-col">
            <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em] mb-5 flex items-center gap-2">
              <Box size={14} className="text-[var(--accent)]" /> Inventory breakdown
            </h3>
            <div className="grid grid-cols-2 gap-4 flex-1">
              {[
                { label: 'PCB units', val: stats?.inventory?.pcb, path: '/admin/inventory/pcb', icon: CircuitBoard, accentText: '#00d2ff' },
                { label: 'Electronics', val: stats?.inventory?.electronics, path: '/admin/inventory/electronics', icon: Cpu, accentText: '#34d399' },
                { label: 'Electrical', val: stats?.inventory?.electrical, path: '/admin/inventory/electrical', icon: Plug, accentText: '#fbbf24' },
                { label: 'Structural', val: stats?.inventory?.structural, path: '/admin/inventory/structural', icon: Layers, accentText: '#a78bfa' }
              ].map((item, idx) => (
                <div key={idx}
                  onClick={() => navigate(item.path)}
                  className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-workspace)] group cursor-pointer hover:border-[var(--accent)] hover:shadow-lg transition-all flex flex-col justify-between h-32 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: item.accentText }} />
                  <div className="flex items-start justify-between relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center transition-all group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] shadow-sm" style={{ color: item.accentText }}>
                      <item.icon size={16} className="group-hover:text-[var(--text-main)] transition-colors" />
                    </div>
                    <ArrowRight size={14} className="text-[var(--text-dim)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="relative z-10 mt-3">
                    <p className="text-2xl font-black text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors leading-none">{item.val || 0}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--text-muted)] mt-2">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
