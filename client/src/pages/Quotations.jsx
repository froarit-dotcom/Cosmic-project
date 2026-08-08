import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash, FileText, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import Select from 'react-select';

const parseMaterialName = (name) => {
    let size = '';
    let brand = '';
    let extra = '';
    let core = name;

    const brandMatch = core.match(/ASTRAL|ASHIRVAD|SUPREME/i);
    if (brandMatch) {
        brand = brandMatch[0].toUpperCase();
        core = core.replace(brandMatch[0], '').trim();
    }

    const sdrMatch = core.match(/SDR[-\s]?\d+(\.\d+)?/i);
    if (sdrMatch) {
        extra = sdrMatch[0];
        core = core.replace(sdrMatch[0], '').trim();
    }

    const sizeMatch = core.match(/^\d+(\.\d+)?\s*(MM|"|INCH|')\s*(\(\s*\d+\/\d+.*?\))?/i) || core.match(/^\d+\/\d+.*?(MM|"|INCH|')/i);
    if (sizeMatch) {
        size = sizeMatch[0];
        core = core.replace(sizeMatch[0], '').trim();
    }

    core = core.replace(/^[-\s|()]+/, '').replace(/[|()]+$/, '').replace(/\s+/g, ' ').trim();
    return { size, brand, extra, core };
};

const Quotations = () => {
    const [view, setView] = useState('list'); // 'list' | 'create'
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);
    const navigate = useNavigate();

    const handleDelete = async (id) => {
        try {
            await api.delete('/quotations/' + id);
            setDeleteId(null);
            api.get('/quotations').then(({ data }) => setQuotations(data));
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete');
        }
    };

    useEffect(() => {
        if (view === 'list') {
            api.get('/quotations').then(({ data }) => {
                setQuotations(data);
                setLoading(false);
            });
        }
    }, [view]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Quotations</h1>
                {view === 'list' ? (
                    <button onClick={() => setView('create')} className="flex w-full sm:w-auto justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Plus className="w-5 h-5 mr-2" /> New Quotation
                    </button>
                ) : (
                    <button onClick={() => setView('list')} className="flex w-full sm:w-auto justify-center items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                        Back to List
                    </button>
                )}
            </div>

            {view === 'list' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">ID</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Date</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Customer</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Total Amount</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Created By</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {quotations.map(q => (
                                <tr key={q.quotationId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{q.quotationId}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(q.quotationDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{q.customer?.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 font-bold">₹{q.totalAmount}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{q.user?.fullName}</td>
                                    <td className="px-6 py-4 text-sm text-right space-x-2">
                                        <button onClick={() => navigate('/invoices', { state: { convertFromQuotation: q } })} className="text-blue-600 hover:text-blue-900">Make Invoice</button>
                                        <button onClick={() => setDeleteId(q.quotationId)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <QuotationBuilder onComplete={() => setView('list')} />}

            <ConfirmDialog
                isOpen={!!deleteId}
                title="Delete Quotation"
                message="Are you sure you want to permanently delete this quotation?"
                onConfirm={() => handleDelete(deleteId)}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
};

const QuotationBuilder = ({ onComplete }) => {
    const [customers, setCustomers] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [form, setForm] = useState({ customerId: '' });
    const [items, setItems] = useState([]);
    const [saving, setSaving] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '' });

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/customers', customerForm);
            setCustomers([...customers, res.data]);
            setForm({ ...form, customerId: res.data.customerId });
            setIsCustomerModalOpen(false);
            setCustomerForm({ name: '', phone: '', address: '' });
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create customer');
        }
    };

    useEffect(() => {
        api.get('/customers').then(res => setCustomers(res.data));
        api.get('/materials').then(res => setMaterials(res.data));
    }, []);

    const groupedOptions = React.useMemo(() => {
        const groups = {};
        materials.filter(m => m.status !== 'INACTIVE').forEach(m => {
            const groupName = m.company?.name || 'Unbranded / Generic';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(m);
        });

        return Object.keys(groups).sort().map(company => ({
            label: company,
            options: groups[company].map(m => ({
                value: m.materialId,
                label: m.name,
                data: m,
                parsed: parseMaterialName(m.name)
            }))
        }));
    }, [materials]);

    const formatOptionLabel = ({ label, data, parsed }) => {
        if (!parsed) return <div>{label}</div>;
        return (
            <div className="flex flex-col py-1">
                <div className="flex items-center space-x-2">
                    {parsed.size && <span className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-sm">{parsed.size}</span>}
                    <span className="font-semibold text-gray-800">{parsed.core || label}</span>
                </div>
                <div className="text-[10px] text-gray-500 flex gap-2 mt-1 uppercase tracking-wider font-semibold">
                    {parsed.brand && <span className="text-blue-600">{parsed.brand}</span>}
                    {parsed.brand && parsed.extra && <span>&bull;</span>}
                    {parsed.extra && <span className="text-gray-600">{parsed.extra}</span>}
                    {(parsed.brand || parsed.extra) && <span>&bull;</span>}
                    <span className="text-green-600">₹{data?.sellingPrice || 0}</span>
                </div>
            </div>
        );
    };

    const advancedFilterOption = (option, inputValue) => {
        if (!inputValue) return true;

        const m = option.data.data;
        if (!m) return option.label.toLowerCase().includes(inputValue.toLowerCase());

        const queryWords = inputValue.toLowerCase().split(' ').filter(Boolean);
        const rowDataStr = [
            m.name, m.materialId, m.company?.name, m.category?.name,
            m.sizeSpec, m.unit, m.sellingPrice
        ].filter(Boolean).join(' ').toLowerCase();

        return queryWords.every(word => rowDataStr.includes(word));
    };

    const handleAiUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsAiLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const { data } = await api.post('/ai/parse-quotation', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (data && data.items && data.items.length > 0) {
                // Map AI result to items array, linking to our available inventory materials
                const newItems = [...items];

                data.items.forEach(aiItem => {
                    let matchedMaterialId = '';
                    let matchedPrice = aiItem.price || 0;

                    if (aiItem.name) {
                        // Find a fuzzy match in our inventory using similar search logic
                        const aiWords = aiItem.name.toLowerCase().split(' ').filter(Boolean);
                        const matchedMat = materials.find(m => {
                            const dbStr = `${m.name} ${m.company?.name || ''} ${m.sizeSpec || ''}`.toLowerCase();
                            // If at least 60% of words match, accept it
                            const matches = aiWords.filter(w => dbStr.includes(w));
                            return matches.length >= Math.ceil(aiWords.length * 0.6);
                        });

                        if (matchedMat) {
                            matchedMaterialId = matchedMat.materialId;
                            if (matchedPrice === 0) matchedPrice = matchedMat.sellingPrice;
                        }
                    }

                    // Avoid adding if both completely empty/unmatched and we wanted to push it, but we'll inject it even if unmatched so they see it
                    newItems.push({
                        materialId: matchedMaterialId,
                        quantity: aiItem.quantity || 1,
                        unitPrice: matchedPrice,
                        discount: 0,
                        _aiNameFallback: !matchedMaterialId ? aiItem.name : null
                    });
                });

                // Clear the default empty row if present and we just added new ones
                const finalItems = newItems.filter(it => it.materialId || it._aiNameFallback);
                setItems(finalItems);
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'AI Failed to parse the image.');
        } finally {
            setIsAiLoading(false);
            e.target.value = ''; // reset input
        }
    };

    const addItem = () => setItems([...items, { materialId: '', quantity: 1, unitPrice: 0, discount: 0 }]);
    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        // Auto pull standard price
        if (field === 'materialId') {
            if (value) {
                const mat = materials.find(m => m.materialId === value);
                if (mat) newItems[index].unitPrice = mat.sellingPrice;
            } else {
                newItems[index].unitPrice = 0;
                newItems[index].discount = 0;
            }
        }
        setItems(newItems);
    };
    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

    const totalAmount = items.reduce((sum, it) => sum + ((it.unitPrice * it.quantity) - it.discount), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/quotations', {
                customerId: form.customerId,
                items: items.map(i => ({
                    ...i,
                    quantity: parseInt(i.quantity) || 0,
                    unitPrice: parseFloat(i.unitPrice) || 0,
                    discount: parseFloat(i.discount) || 0
                }))
            });
            onComplete();
        } catch (err) {
            alert('Failed to save quotation');
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Customer Details</h2>
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                    <div className="flex space-x-2">
                        <select required value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} className="flex-1 rounded-lg border-gray-300 border p-2.5">
                            <option value="">-- Choose Customer --</option>
                            {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.name} ({c.phone})</option>)}
                        </select>
                        <button type="button" onClick={() => setIsCustomerModalOpen(true)} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100 font-medium">
                            <Plus className="w-4 h-4 mr-1" /> New
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Line Items</h2>
                <div className="space-y-4">
                    {items.map((item, index) => {
                        const lineTotal = (item.unitPrice * item.quantity) - item.discount;
                        return (
                            <div key={index} className="flex flex-wrap md:flex-nowrap items-end gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50">
                                <div className="w-full md:w-2/5">
                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Material Item</label>
                                    <Select
                                        options={groupedOptions}
                                        formatOptionLabel={formatOptionLabel}
                                        filterOption={advancedFilterOption}
                                        value={
                                            item.materialId
                                                ? { value: item.materialId, label: materials.find(m => m.materialId === item.materialId)?.name }
                                                : (item._aiNameFallback ? { value: '', label: `AI Suggests: ${item._aiNameFallback}` } : null)
                                        }
                                        onChange={(selected) => updateItem(index, 'materialId', selected?.value || '')}
                                        placeholder="Multi-word search (Brand, PVC, SDR...)"
                                        isClearable
                                        className="text-sm"
                                        menuPosition="fixed"
                                    />
                                </div>
                                <div className="w-1/4 md:w-24">
                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Qty</label>
                                    <input required type="number" min="1" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className="w-full rounded-lg border-gray-300 p-2" />
                                </div>
                                <div className="w-1/4 md:w-32">
                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Unit Price</label>
                                    <input required type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', e.target.value)} className="w-full rounded-lg border-gray-300 p-2" />
                                </div>
                                <div className="w-1/4 md:w-24">
                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Discount</label>
                                    <input type="number" min="0" step="any" value={item.discount} onChange={e => updateItem(index, 'discount', e.target.value)} className="w-full rounded-lg border-gray-300 p-2 text-red-600" />
                                </div>
                                <div className="w-full md:w-32 py-2">
                                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total</span>
                                    <span className="font-bold text-gray-900 border-b border-transparent">₹{lineTotal.toFixed(2)}</span>
                                </div>
                                <div className="pb-1">
                                    <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash className="w-5 h-5" /></button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button type="button" onClick={addItem} className="flex items-center justify-center px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl font-medium transition w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" /> Add Line Item manually
                    </button>

                    <div className="relative w-full sm:w-auto">
                        <input type="file" id="ai-upload" accept="image/*" onChange={handleAiUpload} className="hidden" disabled={isAiLoading} />
                        <label htmlFor="ai-upload" className={`flex w-full sm:w-auto justify-center cursor-pointer border-2 border-dashed items-center px-5 py-2 rounded-xl font-bold transition-all ${isAiLoading ? 'bg-indigo-100 text-indigo-400 border-indigo-200' : 'text-indigo-700 bg-indigo-50 hover:bg-white border-indigo-300 shadow-sm hover:shadow-md'}`}>
                            {isAiLoading ? (
                                <span className="flex items-center"><span className="animate-spin h-4 w-4 mr-2 border-2 border-indigo-500 border-t-transparent rounded-full block"></span> Analyzing Image...</span>
                            ) : (
                                <span className="flex items-center">✨ AI Scan Bill/Invoice</span>
                            )}
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end border-t pt-6">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xl font-bold text-gray-900 mb-6 bg-green-50 p-4 rounded-xl">
                        <span>Total Amount:</span>
                        <span className="text-green-700 px-3 py-1 bg-white rounded-lg shadow-sm border border-green-100 flex items-center justify-center"><IndianRupee className="w-5 h-5 mr-1" />{totalAmount.toFixed(2)}</span>
                    </div>
                    <button type="submit" disabled={saving || items.length === 0} className="w-full flex justify-center py-3 px-4 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/30 transition">
                        {saving ? 'Saving...' : 'Save Quotation'}
                    </button>
                </div>
            </div>

            <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Add New Customer">
                <div className="space-y-4">
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-2">
                        <p className="text-sm text-indigo-800 italic">Customer ID will be auto-generated by the system.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company / Person Name</label>
                        <input required type="text" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input required type="text" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                        <textarea required value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" rows="3" />
                    </div>
                    <button type="button" onClick={handleCreateCustomer} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mt-4">Save Customer</button>
                </div>
            </Modal>
        </form>
    );
};

export default Quotations;
