import React, { useState, useEffect } from 'react';
import { getAdminStats } from '../../api/admin';
import {
  Users,
  Zap,
  ShoppingBag,
  Wrench,
  ArrowUpRight,
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
  Plug
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
        console.log('DEBUG: Dashboard Stats Response:', response.data);
        setStats(response.data.data);
      } catch (error) {
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, path }) => (
    <div
      onClick={() => navigate(path)}
      className="workspace-card p-6 border border-[var(--border-color)] bg-[var(--bg-card)] group cursor-pointer hover:border-[var(--accent)] transition-all duration-500"
    >
      <div className="flex items-start justify-between">
        <div className={`p-4 rounded-2xl bg-${color}-500/10 text-${color}-500 group-hover:scale-110 transition-transform duration-500`}
          style={{ backgroundColor: `${color}10`, color: color }}>
          <Icon size={28} strokeWidth={2.5} />
        </div>
        <div className="text-right">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 mb-1">{title}</p>
          <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
            {loading ? '...' : value}
          </h3>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
        <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest">View Details</span>
        <ArrowUpRight size={14} className="text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0" />
      </div>
    </div>
  );

  const QuickLink = ({ title, description, icon: Icon, path }) => (
    <button
      onClick={() => navigate(path)}
      className="flex items-center gap-5 p-5 rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent)]/50 hover:bg-[var(--nav-hover)] transition-all duration-500 group text-left w-full"
    >
      <div className="p-3 bg-[var(--bg-workspace)] rounded-xl text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-500">
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h4 className="text-[13px] font-black text-[var(--text-main)] uppercase tracking-tight">{title}</h4>
        <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">{description}</p>
      </div>
      <ExternalLink size={14} className="text-[var(--text-dim)] opacity-0 group-hover:opacity-100 transition-all" />
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto pb-4 px-2">
      {/* Header - PREMIUM COMPACT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-entrance-down">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] shadow-lg shadow-[var(--accent)]/5 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <LayoutDashboard size={26} className="text-[var(--accent)] group-hover:scale-110 transition-transform duration-500 relative z-10" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-main)] tracking-tight leading-none uppercase flex items-center gap-3">
              Dashboard
              {/* <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" title="System Live" /> */}
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] font-black mt-2 uppercase tracking-[0.3em] opacity-60">Inventory Overview & Business Analytics</p>
          </div>
        </div>
      </div>

      {/* Stats Grid - PREMIUM GLASS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Products" value={stats?.products || 0} icon={Zap} color="blue" path="/admin/products" />
        <StatCard title="Customers" value={stats?.customers || 0} icon={Users} color="emerald" path="/admin/customers" />
        <StatCard title="Teams" value={stats?.teams || 0} icon={Layers} color="amber" path="/admin/teams" />
        <StatCard title="Maintenance" value={stats?.maintenance || 0} icon={Wrench} color="rose" path="/admin/maintenance" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Column 1: Quick Actions (3/12) */}
        <div className="lg:col-span-3">
          <div className="workspace-card p-6 border border-[var(--border-color)] bg-[var(--bg-card)] h-full relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-16 -mt-16" />
            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em] mb-6 flex items-center gap-2 relative z-10">
              <Zap size={14} className="text-[var(--accent)]" /> Actions
            </h3>
            <div className="space-y-3.5 flex-1 relative z-10">
              <QuickLink title="New Product" description="Add inventory" icon={Plus} path="/admin/products" />
              <QuickLink title="New Client" description="Onboard business" icon={Users} path="/admin/customers" />
              <QuickLink title="Manage Teams" description="Assign staff" icon={Layers} path="/admin/teams" />
            </div>
          </div>
        </div>

        {/* Column 2: Personnel Breakdown (4/12) */}
        <div className="lg:col-span-4">
          <div className="workspace-card p-6 border border-[var(--border-color)] bg-[var(--bg-card)] h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em] mb-6 flex items-center gap-2 relative z-10">
              <Clock size={14} className="text-[var(--accent)]" /> Personnel
            </h3>
            <div className="grid grid-cols-1 gap-3.5 flex-1 relative z-10">
              {[
                { label: 'Designers', val: stats?.designers, sub: 'Active Creative', icon: Cpu, color: 'text-blue-500' },
                { label: 'Sales', val: stats?.sales, sub: 'Field Officers', icon: Building2, color: 'text-emerald-500' },
                { label: 'Service', val: stats?.maintenance, sub: 'Tech Staff', icon: Wrench, color: 'text-rose-500' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-workspace)]/40 border border-[var(--border-color)] hover:border-[var(--accent)]/30 transition-all group">
                  <div className={`p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5">{item.sub}</p>
                    <h4 className="text-[13px] font-bold text-[var(--text-main)] uppercase tracking-tight">{item.label}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-[var(--text-main)] tracking-tighter">{item.val || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Inventory Breakdown (5/12) */}
        <div className="lg:col-span-5">
          <div className="workspace-card p-6 border border-[var(--border-color)] bg-[var(--bg-card)] h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em] mb-6 flex items-center gap-2 relative z-10">
              <Box size={14} className="text-[var(--accent)]" /> Inventory
            </h3>
            <div className="grid grid-cols-2 gap-4 flex-1 relative z-10">
              {[
                { label: 'PCB Units', val: stats?.inventory?.pcb, path: '/admin/inventory/pcb', icon: CircuitBoard, bg: 'bg-blue-500/5' },
                { label: 'Electronics', val: stats?.inventory?.electronics, path: '/admin/inventory/electronics', icon: Cpu, bg: 'bg-emerald-500/5' },
                { label: 'Electrical', val: stats?.inventory?.electrical, path: '/admin/inventory/electrical', icon: Plug, bg: 'bg-amber-500/5' },
                { label: 'Structural', val: stats?.inventory?.structural, path: '/admin/inventory/structural', icon: Building2, bg: 'bg-rose-500/5' }
              ].map((item, idx) => (
                <div key={idx}
                  onClick={() => navigate(item.path)}
                  className={`p-5 rounded-3xl border border-[var(--border-color)] flex flex-col justify-between group cursor-pointer hover:border-[var(--accent)] transition-all ${item.bg}`}>
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white transition-all">
                      <item.icon size={18} />
                    </div>
                    <ArrowUpRight size={14} className="text-[var(--text-dim)] opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-black text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors leading-none">{item.val || 0}</p>
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mt-2">{item.label}</p>
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
