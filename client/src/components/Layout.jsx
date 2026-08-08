import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    LayoutDashboard, LogOut, Menu, X,
    Box, Users, FileText, ShoppingCart, Target, Factory
} from 'lucide-react';

const Layout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, adminOnly: true },
        { name: 'Invoices', path: '/invoices', icon: ShoppingCart, feature: 'invoices' },
        { name: 'Quotations', path: '/quotations', icon: FileText, feature: 'quotations' },
        { name: 'Customers', path: '/customers', icon: Users, feature: 'customers' },
        { name: 'Stock / Godowns', path: '/inventory', icon: Box, feature: 'inventory' },
        { name: 'Materials Master', path: '/materials', icon: Target, adminOnly: true },
        { name: 'Staff & Roles', path: '/staff', icon: Users, adminOnly: true },
    ];

    const currentNav = navItems.filter(item => {
        if (user?.role === 'ADMIN') return true;
        if (item.adminOnly) return false;
        if (item.feature) return user?.permissions?.includes(item.feature);
        return true;
    });

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            {/* Sidebar Desktop */}
            <aside className="hidden w-[280px] bg-white/80 backdrop-blur-xl border-r border-slate-200 text-slate-800 md:flex md:flex-col shadow-[10px_0_30px_-15px_rgba(79,70,229,0.15)] print:hidden z-20 relative">
                <div className="h-20 flex items-center px-6 font-black text-2xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 border-b border-indigo-50/50">
                    COSMIC <span className="text-indigo-200 font-light ml-2">ERP</span>
                </div>
                <div className="flex-1 overflow-y-auto py-6">
                    <nav className="px-4 space-y-1.5">
                        {currentNav.map(item => {
                            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={"group flex items-center px-4 py-3.5 text-[0.9rem] font-semibold rounded-2xl transition-all duration-300 " + (isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-200 translate-x-1' : 'text-slate-500 hover:bg-slate-100/80 hover:text-indigo-600')}
                                >
                                    <item.icon className={"mr-3 h-[22px] w-[22px] transition-transform duration-300 " + (isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 group-hover:scale-110')} />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
                <div className="p-5 bg-white/50 border-t border-slate-100 flex flex-col space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-inner text-lg">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <span className="text-sm font-bold text-slate-800 truncate">{user?.fullName}</span>
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-full w-fit mt-0.5">{user?.role}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-4 py-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all duration-300 text-sm font-bold hover:shadow-lg hover:shadow-rose-100 hover:-translate-y-0.5"
                    >
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </button>
                </div>
            </aside >

            {/* Main Content */}
            < main className="flex-1 flex flex-col h-screen overflow-hidden" >
                {/* Mobile Header */}
                <header className="md:hidden h-16 bg-white shadow-sm flex items-center justify-between px-4 z-10 print:hidden">
                    <span className="font-bold text-lg text-blue-600">COSMIC</span>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500">
                        {sidebarOpen ? <X /> : <Menu />}
                    </button>
                </header >
                {/* Mobile Menu Overlay */}
                {
                    sidebarOpen && (
                        <div className="md:hidden absolute inset-0 z-40 bg-white/90 backdrop-blur-xl text-slate-800 flex flex-col animate-in fade-in slide-in-from-left-4 duration-300 shadow-2xl">
                            <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
                                <span className="font-black text-2xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">COSMIC ERP</span>
                                <button onClick={() => setSidebarOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X className="text-slate-600" /></button>
                            </div>
                            <nav className="flex-1 px-6 py-8 space-y-3">
                                {currentNav.map(item => (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        onClick={() => setSidebarOpen(false)}
                                        className="flex items-center px-4 py-4 text-lg font-bold rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                    >
                                        <item.icon className="h-6 w-6 mr-4 text-indigo-400" />
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                            <div className="p-6 border-t border-slate-100">
                                <button onClick={handleLogout} className="flex items-center justify-center w-full px-4 py-4 text-rose-500 font-bold bg-rose-50 hover:bg-rose-500 hover:text-white rounded-2xl transition-colors shadow-sm">
                                    <LogOut className="h-5 w-5 mr-3" /> Logout
                                </button>
                            </div>
                        </div>
                    )
                }

                <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8 print:p-0 print:bg-white print:overflow-visible">
                    <Outlet />
                </div>
            </main >
        </div >
    );
};

export default Layout;
