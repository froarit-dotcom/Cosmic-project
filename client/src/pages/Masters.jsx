import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash, Edit2, X } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const Masters = () => {
    const [activeTab, setActiveTab] = useState('materials');

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Masters Management</h1>
            <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 max-w-full overflow-x-auto whitespace-nowrap w-full md:w-auto overflow-y-hidden pb-2 mb-2">
                {['materials', 'companies', 'categories'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={"px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize " + (activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-blue-50')}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {activeTab === 'materials' && <MaterialsManager />}
                {activeTab === 'companies' && <CompaniesManager />}
                {activeTab === 'categories' && <CategoriesManager />}
            </div>
        </div>
    );
};

// Generic Modal Wrapper
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
}

// Generic Manager for Companies and Categories
const GenericManager = ({ title, endpoint, idKey, columns }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [form, setForm] = useState({ id: '', name: '', contactInfo: '' });

    useEffect(() => { loadItems(); }, []);

    const loadItems = async () => {
        try {
            const { data } = await api.get(endpoint);
            setItems(data);
        } finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(endpoint + '/' + id);
            setConfirmDelete(null);
            loadItems();
        } catch (err) {
            alert(err.response?.data?.error || 'Database Constraint: Cannot delete this item because it is linked to existing stock or invoices.');
            setConfirmDelete(null);
        }
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        setForm({
            id: item[idKey],
            name: item.name,
            contactInfo: item.contactInfo || ''
        });
        setIsModalOpen(true);
    };

    const handleCreateNew = () => {
        setIsEditing(false);
        setForm({ id: '', name: '', contactInfo: '' });
        setIsModalOpen(true);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = endpoint === '/companies'
                ? { companyId: form.id, name: form.name, contactInfo: form.contactInfo }
                : { categoryId: form.id, name: form.name };

            if (isEditing) {
                await api.put(endpoint + '/' + form.id, { name: form.name, contactInfo: form.contactInfo });
            } else {
                await api.post(endpoint, payload);
            }
            setIsModalOpen(false);
            loadItems();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save');
        }
    };

    if (loading) return <div>Loading {title}...</div>;

    const singleName = title.slice(0, -1);

    const filteredItems = items.filter(item => {
        if (!searchQuery) return true;
        const queryWords = searchQuery.toLowerCase().split(' ').filter(Boolean);
        const rowDataStr = columns.map(col => item[col.key]).filter(Boolean).join(' ').toLowerCase();
        return queryWords.every(word => rowDataStr.includes(word));
    });

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-3">
                    <input
                        type="text"
                        placeholder={`Search ${title.toLowerCase()}...`}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={handleCreateNew} className="flex justify-center flex-shrink-0 w-full sm:w-auto items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" /> Add {singleName}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map(col => <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{col.label}</th>)}
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredItems.length === 0 ? <tr><td colSpan={columns.length + 2} className="py-8 text-center text-gray-500">No {title.toLowerCase()} match your search.</td></tr> : null}
                        {filteredItems.map(item => (
                            <tr key={item[idKey]} className="hover:bg-gray-50">
                                {columns.map(col => (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item[col.key]}</td>
                                ))}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => setConfirmDelete(item[idKey])} className="text-red-600 hover:text-red-900"><Trash className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={(isEditing ? "Edit " : "Add ") + singleName}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isEditing && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                            <p className="text-sm text-blue-800 italic">ID will be auto-generated by the system.</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" />
                    </div>
                    {endpoint === '/companies' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                            <input type="text" value={form.contactInfo} onChange={e => setForm({ ...form, contactInfo: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" />
                        </div>
                    )}
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mt-4">Save {singleName}</button>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!confirmDelete}
                title={`Delete ${singleName}`}
                message={`Are you sure you want to delete this ${singleName}? This action cannot be undone.`}
                onConfirm={() => handleDelete(confirmDelete)}
                onCancel={() => setConfirmDelete(null)}
                confirmText="Delete"
                confirmColor="red"
            />
        </div>
    );
};

const CompaniesManager = () => <GenericManager title="Companies" endpoint="/companies" idKey="companyId" columns={[{ key: 'companyId', label: 'ID' }, { key: 'name', label: 'Brand Name' }, { key: 'contactInfo', label: 'Contact' }]} />;
const CategoriesManager = () => <GenericManager title="Categories" endpoint="/categories" idKey="categoryId" columns={[{ key: 'categoryId', label: 'ID' }, { key: 'name', label: 'Category Name' }]} />;

const MaterialsManager = () => {
    const [items, setItems] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [form, setForm] = useState({ materialId: '', name: '', categoryId: '', companyId: '', sizeSpec: '', unit: '', purchasePrice: '', sellingPrice: '', gstPercentage: '', reorderLevel: '' });

    useEffect(() => { loadAll(); }, []);

    const loadAll = () => {
        api.get('/materials').then(({ data }) => setItems(data));
        api.get('/companies').then(({ data }) => setCompanies(data));
        api.get('/categories').then(({ data }) => setCategories(data));
    };

    const handleDelete = async (id) => {
        try {
            await api.delete('/materials/' + id);
            setConfirmDelete(null);
            loadAll();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete material');
            setConfirmDelete(null);
        }
    }

    const handleEdit = (m) => {
        setIsEditing(true);
        setForm({
            materialId: m.materialId, name: m.name, categoryId: m.categoryId, companyId: m.companyId,
            sizeSpec: m.sizeSpec, unit: m.unit, purchasePrice: m.purchasePrice, sellingPrice: m.sellingPrice,
            gstPercentage: m.gstPercentage, reorderLevel: m.reorderLevel
        });
        setIsModalOpen(true);
    };

    const handleCreateNew = () => {
        setIsEditing(false);
        setForm({ materialId: '', name: '', categoryId: '', companyId: '', sizeSpec: '', unit: '', purchasePrice: '', sellingPrice: '', gstPercentage: '', reorderLevel: '' });
        setIsModalOpen(true);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...form,
                purchasePrice: parseFloat(form.purchasePrice),
                sellingPrice: parseFloat(form.sellingPrice),
                gstPercentage: parseFloat(form.gstPercentage),
                reorderLevel: parseInt(form.reorderLevel) || 0
            };
            if (isEditing) {
                await api.put('/materials/' + form.materialId, payload);
            } else {
                await api.post('/materials', payload);
            }
            setIsModalOpen(false);
            loadAll();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save');
        }
    };

    const filteredItems = items.filter(m => {
        if (m.status === 'INACTIVE') return false;

        // Literal Column Filters
        if (categoryFilter && m.categoryId !== categoryFilter) return false;
        if (companyFilter && m.companyId !== companyFilter) return false;

        // Advanced Multi-word Search across all columns
        if (searchQuery) {
            const queryWords = searchQuery.toLowerCase().split(' ').filter(Boolean);
            const rowDataStr = [
                m.name, m.materialId, m.company?.name, m.category?.name,
                m.sizeSpec, m.unit, m.sellingPrice, m.purchasePrice
            ].filter(Boolean).join(' ').toLowerCase();

            // Every word typed must exist SOMEWHERE in this row's data
            const matchesAllWords = queryWords.every(word => rowDataStr.includes(word));
            if (!matchesAllWords) return false;
        }

        return true;
    });

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Materials</h2>
                <div className="flex flex-col sm:flex-row items-center w-full md:w-auto space-y-2 sm:space-y-0 sm:space-x-3">
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-auto bg-white">
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                    </select>
                    <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-auto bg-white">
                        <option value="">All Brands</option>
                        {companies.map(c => <option key={c.companyId} value={c.companyId}>{c.name}</option>)}
                    </select>
                    <input
                        type="text"
                        placeholder="Multi-word search (e.g. 'pipe astral')..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64"
                    />
                    <button onClick={handleCreateNew} className="flex justify-center flex-shrink-0 w-full sm:w-auto flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Material
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">ID</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Name & Size</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Category & Brand</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Price</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Stock Lvl</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredItems.length === 0 ? <tr><td colSpan="6" className="py-8 text-center text-gray-500">No materials match your search.</td></tr> : null}
                        {filteredItems.map(m => (
                            <tr key={m.materialId} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-500">{m.materialId}</td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="font-semibold text-gray-900">{m.name}</div>
                                    <div className="text-xs text-gray-500">Spec: {m.sizeSpec} | Unit: {m.unit}</div>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="text-gray-900">{m.category?.name}</div>
                                    <div className="text-xs font-semibold text-blue-600">{m.company?.name}</div>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="text-green-600 font-medium">Sell: ₹{m.sellingPrice}</div>
                                    <div className="text-xs text-gray-500">Cost: ₹{m.purchasePrice} | GST: {m.gstPercentage}%</div>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {m.reorderLevel > 0 && <span className="inline-block px-2 text-xs rounded-full bg-yellow-100 text-yellow-800">Min: {m.reorderLevel}</span>}
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <button onClick={() => handleEdit(m)} className="text-blue-600 hover:text-blue-900 mr-4 inline-block"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => setConfirmDelete(m.materialId)} className="text-red-600 hover:text-red-900 inline-block"><Trash className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={(isEditing ? "Edit " : "Create New ") + "Material"}>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {!isEditing && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                            <p className="text-sm text-blue-800 italic">Material ID will be auto-generated by the system.</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                            <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="e.g. PVC Pipe" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                            <select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-md border-gray-300 border p-2 text-sm">
                                <option value="">Select...</option>
                                {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Brand</label>
                            <select required value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })} className="w-full rounded-md border-gray-300 border p-2 text-sm">
                                <option value="">Select...</option>
                                {companies.map(c => <option key={c.companyId} value={c.companyId}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Unit</label>
                            <input required type="text" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="e.g. Pcs, Mtr" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Purchase Price</label>
                            <input required type="number" step="0.01" min="0" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} className="w-full rounded-md border-gray-300 border p-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Selling Price</label>
                            <input required type="number" step="0.01" min="0" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} className="w-full rounded-md border-gray-300 border p-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">GST Percentage</label>
                            <input required type="number" step="0.01" min="0" value={form.gstPercentage} onChange={e => setForm({ ...form, gstPercentage: e.target.value })} className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="e.g. 18" />
                        </div>
                    </div>
                    <button type="submit" className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save Material</button>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!confirmDelete}
                title="Delete Material"
                message="Are you sure you want to delete this Material? If it has existing stock or invoices, it will be marked as inactive instead."
                onConfirm={() => handleDelete(confirmDelete)}
                onCancel={() => setConfirmDelete(null)}
                confirmText="Delete"
                confirmColor="red"
            />
        </div>
    );
};

export default Masters;
