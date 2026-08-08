import React, { useEffect, useState } from 'react';
import api from '../api';
import { IndianRupee, TrendingUp, Package, AlertTriangle, ArrowRight } from 'lucide-react';

const DashboardCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex items-center space-x-5 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(79,70,229,0.1)] hover:-translate-y-1">
        <div className={"p-4 rounded-2xl shadow-inner " + colorClass}>
            <Icon className="h-7 w-7" />
        </div>
        <div>
            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
        </div>
    </div >
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [range, setRange] = useState('monthly');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/dashboard/stats?range=' + range);
                setStats(data);
            } catch (err) {
                console.error('Error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [range]);

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading dashboard metrics...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">Failed to load metrics.</div>;

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/70 backdrop-blur-xl px-6 py-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 gap-4">
                <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-blue-600">Business Overview</h1>
                <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="px-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all cursor-pointer w-full sm:w-auto"
                >
                    <option value="daily">Today's Pulse</option>
                    <option value="monthly">Monthly Overview</option>
                    <option value="yearly">Year to Date</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard
                    title="Revenue"
                    value={formatCurrency(stats.metrics.revenue)}
                    icon={IndianRupee}
                    colorClass="bg-blue-100 text-blue-600"
                />
                <DashboardCard
                    title="Gross Profit"
                    value={formatCurrency(stats.metrics.profit)}
                    icon={TrendingUp}
                    colorClass="bg-green-100 text-green-600"
                />
                <DashboardCard
                    title="Sales Count"
                    value={stats.metrics.salesCount}
                    icon={Package}
                    colorClass="bg-indigo-100 text-indigo-600"
                />
                <DashboardCard
                    title="Items Sold"
                    value={stats.metrics.totalQuantitySold}
                    icon={ArrowRight}
                    colorClass="bg-orange-100 text-orange-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                {/* Top Selling */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden flex flex-col transition-all hover:shadow-lg">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white flex justify-between items-center">
                        <h2 className="font-bold text-slate-800 text-xl tracking-tight">Top Selling Materials</h2>
                    </div>
                    <ul className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                        {stats.topSelling.length === 0 ? <li className="p-8 text-slate-500 text-center font-medium">No sales metrics available for this period.</li> : null}
                        {stats.topSelling.map(item => (
                            <li key={item.materialId} className="flex justify-between items-center px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                                <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{item.name || item.materialId}</span>
                                <span className="text-sm font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{item.quantity} units</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100/50 overflow-hidden flex flex-col relative transition-all hover:shadow-lg hover:shadow-rose-100/20">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-rose-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
                    <div className="p-6 border-b border-rose-100/50 bg-gradient-to-br from-rose-50/50 to-white flex items-center space-x-3 z-10 relative">
                        <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shadow-inner">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <h2 className="font-bold text-rose-700 text-xl tracking-tight">Rapid Low Stock Alerts</h2>
                    </div>
                    <ul className="divide-y divide-slate-100 flex-1 overflow-y-auto z-10 relative">
                        {stats.lowStock.length === 0 ? <li className="p-8 text-emerald-600 text-center font-medium bg-emerald-50/30">All stock levels are perfectly healthy.</li> : null}
                        {stats.lowStock.map(stock => (
                            <li key={stock.materialId + '-' + stock.locationId} className="flex justify-between items-center px-6 py-4 hover:bg-rose-50/30 transition-colors">
                                <div>
                                    <p className="font-bold text-slate-800">{stock.material?.name || stock.materialId}</p>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{stock.location?.name || stock.locationId}</p>
                                </div>
                                <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-black bg-rose-100 text-rose-700 shadow-sm border border-rose-200/50">
                                    {stock.quantity} left
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
