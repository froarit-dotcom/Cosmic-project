import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, Plus, Search, Edit2, Trash, X } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', address: '' });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const { data } = await api.get('/customers');
            setCustomers(data);
        } finally { setLoading(false); }
    };

    const handleCreateNew = () => {
        setIsEditing(false);
        setEditingId(null);
        setForm({ name: '', phone: '', address: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (c) => {
        setIsEditing(true);
        setEditingId(c.customerId);
        setForm({ name: c.name, phone: c.phone, address: c.address || '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/customers/${editingId}`, { name: form.name, phone: form.phone, address: form.address });
            } else {
                await api.post('/customers', { ...form });
            }
            setIsModalOpen(false);
            setForm({ name: '', phone: '', address: '' });
            loadCustomers();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save customer');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete('/customers/' + id);
            setConfirmDelete(null);
            loadCustomers();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete customer');
            setConfirmDelete(null);
        }
    };

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.customerId.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Customers Directory</h1>
                <button onClick={handleCreateNew} className="flex justify-center w-full sm:w-auto flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <Plus className="w-5 h-5 mr-2" /> New Customer
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="relative mb-6 max-w-md">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 w-full rounded-lg border-gray-300 shadow-sm p-2.5 border focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Customer ID</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Name</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Phone</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Address</th>
                                <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase text-xs">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filtered.length === 0 ? <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No customers found</td></tr> : null}
                            {filtered.map(c => (
                                <tr key={c.customerId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.customerId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{c.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.address || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit2 className="w-4 h-4 inline-block" /></button>
                                        <button onClick={() => setConfirmDelete(c.customerId)} className="text-red-600 hover:text-red-900"><Trash className="w-4 h-4 inline-block" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Customer' : 'Add New Customer'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isEditing && (
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-2">
                            <p className="text-sm text-indigo-800 italic">Customer ID will be auto-generated by the system.</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company / Person Name</label>
                        <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" placeholder="e.g. John Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input required type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" placeholder="e.g. +91 9876543210" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                        <textarea rows="3" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" placeholder="Address..."></textarea>
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mt-4">Save Customer</button>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!confirmDelete}
                title="Delete Customer"
                message="Are you sure you want to delete this Customer? This action cannot be undone."
                onConfirm={() => handleDelete(confirmDelete)}
                onCancel={() => setConfirmDelete(null)}
                confirmText="Delete"
                confirmColor="red"
            />
        </div>
    );
};

export default Customers;
