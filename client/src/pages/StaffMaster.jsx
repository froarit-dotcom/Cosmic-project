import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash, Edit2, X, Link } from 'lucide-react';
import Select from 'react-select';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

const StaffAccountsManager = () => {
    const [items, setItems] = useState([]);
    const [salesPersons, setSalesPersons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ id: '', username: '', password: '', fullName: '', phone: '', permissions: [] });
    const [linkedSalesPerson, setLinkedSalesPerson] = useState(null);

    useEffect(() => { loadAll(); }, []);
    const loadAll = async () => {
        try {
            const res = await api.get('/auth/users');
            const resSP = await api.get('/sales-persons');
            setItems(res.data);
            setSalesPersons(resSP.data);
        } finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this Employee Account? They will no longer be able to log in!')) return;
        await api.delete('/auth/users/' + id);
        loadAll();
    };

    const handleCreateNew = () => {
        setIsEditing(false);
        setForm({ id: '', username: '', password: '', fullName: '', phone: '', permissions: [] });
        setLinkedSalesPerson(null);
        setIsModalOpen(true);
    }

    const handleEdit = (item) => {
        setIsEditing(true);
        let perms = [];
        try { perms = JSON.parse(item.permissions || '[]'); } catch (e) { }
        setForm({ id: item.id, username: item.username, password: '', fullName: item.fullName, phone: item.phone || '', permissions: perms });
        setIsModalOpen(true);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) await api.put('/auth/users/' + form.id, form);
            else await api.post('/auth/users', form);
            setIsModalOpen(false);
            loadAll();
        } catch (err) { alert(err.response?.data?.error || 'Failed to save user'); }
    };

    const togglePermission = (id) => {
        if (form.permissions.includes(id)) setForm({ ...form, permissions: form.permissions.filter(p => p !== id) });
        else setForm({ ...form, permissions: [...form.permissions, id] });
    }

    if (loading) return <div>Loading Staff Accounts...</div>;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-semibold text-gray-800">System Access Accounts</h2>
                <button onClick={handleCreateNew} className="flex justify-center w-full sm:w-auto items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" /> Add Employee Login</button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.length === 0 ? <tr><td colSpan="4" className="py-8 text-center text-gray-500">No accounts found.</td></tr> : null}
                        {items.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.username}</td>
                                <td className="px-6 py-4 text-sm text-gray-700">{item.fullName} <span className="text-gray-400">({item.phone || '-'})</span></td>
                                <td className="px-6 py-4 text-sm font-semibold"><span className={item.role === 'ADMIN' ? 'text-purple-600 font-bold' : 'text-blue-600'}>{item.role}</span></td>
                                <td className="px-6 py-4 text-right text-sm space-x-4">
                                    {item.role !== 'ADMIN' && <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 inline-block"><Edit2 className="w-4 h-4" /></button>}
                                    {item.role !== 'ADMIN' && <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 inline-block"><Trash className="w-4 h-4" /></button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Edit System Access" : "Create Employee Login"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isEditing && salesPersons.length > 0 && (
                        <div className="mb-4 pb-4 border-b border-gray-100">
                            <label className="block text-sm font-semibold text-indigo-700 mb-1 flex items-center">
                                <Link className="w-3 h-3 mr-1" /> Auto-fill from Sales Person Profile
                            </label>
                            <Select
                                value={linkedSalesPerson}
                                onChange={(sel) => {
                                    setLinkedSalesPerson(sel);
                                    if (sel && sel.data) {
                                        setForm(prev => ({
                                            ...prev,
                                            fullName: sel.data.name,
                                            phone: sel.data.phone || prev.phone,
                                            username: prev.username || sel.data.name.split(' ')[0].toLowerCase()
                                        }));
                                    }
                                }}
                                options={salesPersons.map(sp => ({ value: sp.salesPersonId, label: `${sp.name} (${sp.phone || 'No Phone'})`, data: sp }))}
                                isClearable
                                placeholder="Select an employee..."
                                className="text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1 italic">Selecting a profile will automatically fill in the name and contact details below.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username (For Login)</label>
                        <input required type="text" disabled={isEditing} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2 bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{isEditing ? "Reset Password (Optional)" : "Temporary Password"}</label>
                        <input required={!isEditing} type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input required type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" />
                        </div>
                    </div>

                    <div className="mt-6 border-t pt-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Module Permissions</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {['invoices', 'quotations', 'customers', 'inventory'].map(p => (
                                <label key={p} className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer p-2 rounded-lg border hover:bg-gray-50 transition-colors">
                                    <input type="checkbox" checked={form.permissions.includes(p)} onChange={() => togglePermission(p)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                    <span className="capitalize font-medium">{p === 'inventory' ? 'Stock Manager' : p}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mt-4">{isEditing ? "Update Account" : "Create Account"}</button>
                </form>
            </Modal>
        </div>
    );
};

const SalesPersonsManager = () => {
    const [items, setItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ id: '', name: '', phone: '', salary: '', locationId: '' });

    useEffect(() => { loadAll(); }, []);
    const loadAll = async () => {
        try {
            const resSp = await api.get('/sales-persons');
            const resLoc = await api.get('/locations');
            setItems(resSp.data);
            setLocations(resLoc.data);
        } finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this Sales Person?')) return;
        await api.delete('/sales-persons/' + id);
        loadAll();
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        setForm({
            id: item.salesPersonId,
            name: item.name,
            phone: item.phone || '',
            salary: item.salary || 0,
            locationId: item.locationId || ''
        });
        setIsModalOpen(true);
    };

    const handleCreateNew = () => {
        setIsEditing(false);
        setForm({ id: '', name: '', phone: '', salary: '', locationId: '' });
        setIsModalOpen(true);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                salesPersonId: form.id, name: form.name,
                phone: form.phone, salary: parseFloat(form.salary) || 0,
                locationId: form.locationId || null
            };
            if (isEditing) {
                await api.put('/sales-persons/' + form.id, payload);
            } else {
                await api.post('/sales-persons', payload);
            }
            setIsModalOpen(false);
            loadAll();
        } catch (err) { alert(err.response?.data?.error || 'Failed to save'); }
    };

    if (loading) return <div>Loading Sales Persons...</div>;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Sales Persons</h2>
                <button onClick={handleCreateNew} className="flex justify-center w-full sm:w-auto flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" /> Add Sales Person</button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name (Phone)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Loc.</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.length === 0 ? <tr><td colSpan="5" className="py-8 text-center text-gray-500">No Sales Persons added.</td></tr> : null}
                        {items.map(item => (
                            <tr key={item.salesPersonId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">{item.salesPersonId}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name} <span className="text-gray-500 font-normal">({item.phone || '-'})</span></td>
                                <td className="px-6 py-4 text-sm text-green-600 font-semibold">₹{item.salary}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{item.locationId ? locations.find(l => l.locationId === item.locationId)?.name || item.locationId : 'Main (All)'}</td>
                                <td className="px-6 py-4 text-right text-sm">
                                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 mr-4 inline-block"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(item.salesPersonId)} className="text-red-600 hover:text-red-900 inline-block"><Trash className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={(isEditing ? "Edit " : "Add ") + "Sales Person"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isEditing && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-2">
                            <p className="text-sm text-green-800 italic">Employee ID will be auto-generated by the system.</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary (₹)</label>
                        <input required type="number" step="0.01" min="0" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Location</label>
                        <select value={form.locationId} onChange={e => setForm({ ...form, locationId: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2">
                            <option value="">Main Branch (Default)</option>
                            {locations.map(l => <option key={l.locationId} value={l.locationId}>{l.name} ({l.type})</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mt-4">Save Employee</button>
                </form>
            </Modal>
        </div>
    );
};

const StaffMaster = () => {
    const [activeTab, setActiveTab] = useState('staffs');

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Staff & Users</h1>
            <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 max-w-full overflow-x-auto whitespace-nowrap w-full md:w-auto overflow-y-hidden pb-1 mb-2">
                {['staffs', 'salespersons'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={"px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize " + (activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-blue-50')}
                    >
                        {tab === 'staffs' ? 'System Logins' : 'Sales Persons'}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {activeTab === 'staffs' && <StaffAccountsManager />}
                {activeTab === 'salespersons' && <SalesPersonsManager />}
            </div>
        </div>
    );
};

export default StaffMaster;
