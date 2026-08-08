import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Printer, Trash, Receipt, IndianRupee } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import html2pdf from 'html2pdf.js';
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

const Invoices = () => {
    const location = useLocation();
    const convertData = location.state?.convertFromQuotation;

    const [view, setView] = useState(convertData ? 'create' : 'list');
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [voidInvoiceId, setVoidInvoiceId] = useState(null);

    useEffect(() => {
        if (view === 'list') {
            api.get('/invoices').then(({ data }) => {
                setInvoices(data);
                setLoading(false);
            });
        }
    }, [view]);

    const handleVoid = async (id) => {
        try {
            await api.post('/invoices/' + id + '/void');
            setVoidInvoiceId(null);
            setLoading(true);
            api.get('/invoices').then(({ data }) => { setInvoices(data); setLoading(false); });
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to void invoice');
        }
    };

    if (view === 'print' && selectedInvoice) {
        return <PrintableInvoice invoice={selectedInvoice} onBack={() => { setView('list'); setSelectedInvoice(null); }} />;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Invoices</h1>
                {view === 'list' ? (
                    <button onClick={() => setView('create')} className="flex w-full sm:w-auto justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Plus className="w-5 h-5 mr-2" /> New Invoice
                    </button>
                ) : (
                    <button onClick={() => setView('list')} className="flex w-full sm:w-auto justify-center items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                        Back to List
                    </button>
                )}
            </div>

            {view === 'list' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Invoice #</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Date</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Customer</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Grand Total</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map(inv => (
                                <tr key={inv.invoiceId} className={"hover:bg-gray-50 " + (inv.status === 'VOID' ? 'opacity-50' : '')}>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{inv.invoiceId}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{inv.customer?.name}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-green-600">₹{inv.grandTotal.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={"px-2 py-1 rounded text-xs font-semibold " + (inv.status === 'VOID' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right space-x-3">
                                        <button onClick={() => { setSelectedInvoice(inv); setView('print'); }} className="text-blue-600 hover:text-blue-900 font-medium">Print</button>
                                        {inv.status !== 'VOID' && <button onClick={() => setVoidInvoiceId(inv.invoiceId)} className="text-red-600 hover:text-red-900 font-medium">Void</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'create' && <InvoiceBuilder onComplete={() => setView('list')} initialData={convertData} />}

            <ConfirmDialog
                isOpen={!!voidInvoiceId}
                title="Void Invoice"
                message="Are you sure you want to void this invoice? This will restore stock backwards."
                onConfirm={() => handleVoid(voidInvoiceId)}
                onCancel={() => setVoidInvoiceId(null)}
            />
        </div>
    );
};

const InvoiceBuilder = ({ onComplete, initialData }) => {
    const [customers, setCustomers] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [salesPersons, setSalesPersons] = useState([]);
    const [form, setForm] = useState({
        customerId: initialData?.customerId || '',
        salesPersonId: '', deduction: 0, bonusAmount: 0
    });
    const [items, setItems] = useState(
        initialData?.items
            ? initialData.items.map(i => ({ materialId: i.materialId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount }))
            : []
    );
    const [saving, setSaving] = useState(false);

    // Inline Customer Creation State
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
        api.get('/sales-persons').then(res => setSalesPersons(res.data));
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

    const addItem = () => setItems([...items, { materialId: '', quantity: 1, unitPrice: 0, discount: 0 }]);
    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
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

    // Math Logic
    let subtotal = 0;
    let sgstTotal = 0;
    let cgstTotal = 0;

    items.forEach(it => {
        const qty = parseFloat(it.quantity) || 0;
        const price = parseFloat(it.unitPrice) || 0;
        const discount = parseFloat(it.discount) || 0;
        const lineVal = (qty * price) - discount;
        subtotal += lineVal;

        const mat = materials.find(m => m.materialId === it.materialId);
        const gstRate = mat?.gstPercentage || 0;
        sgstTotal += lineVal * (gstRate / 2) / 100;
        cgstTotal += lineVal * (gstRate / 2) / 100;
    });

    const ded = parseFloat(form.deduction) || 0;
    const finalTotal = subtotal + sgstTotal + cgstTotal;
    const grandTotal = finalTotal - ded;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/invoices', {
                ...form,
                deduction: ded,
                items: items.map(i => ({ ...i, quantity: parseInt(i.quantity) || 0, unitPrice: parseFloat(i.unitPrice) || 0, discount: parseFloat(i.discount) || 0 }))
            });
            onComplete();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to generate invoice');
            setSaving(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                        <div className="flex space-x-2">
                            <select required value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} className="flex-1 rounded-lg border-gray-300 border p-2.5">
                                <option value="">-- Select Customer --</option>
                                {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.name} ({c.phone})</option>)}
                            </select>
                            <button type="button" onClick={() => setIsCustomerModalOpen(true)} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100 font-medium">
                                <Plus className="w-4 h-4 mr-1" /> New
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sales Person (Optional)</label>
                        <select value={form.salesPersonId} onChange={e => setForm({ ...form, salesPersonId: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2.5">
                            <option value="">-- Select Sales Person --</option>
                            {salesPersons.map(sp => <option key={sp.salesPersonId} value={sp.salesPersonId}>{sp.name}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Line Items</h2>
                    <div className="space-y-4">
                        {items.map((item, index) => {
                            const lineVal = (item.unitPrice * item.quantity) - item.discount;
                            return (
                                <div key={index} className="flex flex-wrap md:flex-nowrap items-end gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50">
                                    <div className="w-full md:flex-[2]">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Material</label>
                                        <Select
                                            options={groupedOptions}
                                            formatOptionLabel={formatOptionLabel}
                                            filterOption={advancedFilterOption}
                                            value={
                                                item.materialId
                                                    ? { value: item.materialId, label: materials.find(m => m.materialId === item.materialId)?.name }
                                                    : null
                                            }
                                            onChange={(selected) => updateItem(index, 'materialId', selected?.value || '')}
                                            placeholder="Multi-word search (Brand, PVC, SDR...)"
                                            isClearable
                                            className="text-sm"
                                            menuPosition="fixed"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Qty</label>
                                        <input required type="number" min="1" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className="w-full rounded-lg border-gray-300 p-2 shadow-sm" />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rate</label>
                                        <input required type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', e.target.value)} className="w-full rounded-lg border-gray-300 p-2 shadow-sm" />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Dis. (₹)</label>
                                        <input type="number" min="0" step="any" value={item.discount} onChange={e => updateItem(index, 'discount', e.target.value)} className="w-full rounded-lg border-gray-300 p-2 shadow-sm text-red-600" />
                                    </div>
                                    <div className="w-24 pb-2">
                                        <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Total</span>
                                        <span className="font-bold text-gray-800">₹{lineVal.toFixed(2)}</span>
                                    </div>
                                    <div className="pb-1">
                                        <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <button type="button" onClick={addItem} className="mt-4 flex items-center px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium">
                        <Plus className="w-4 h-4 mr-2" /> Add Item
                    </button>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                    <div className="w-full max-w-sm space-y-4">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>SGST</span>
                            <span className="font-medium">₹{sgstTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>CGST</span>
                            <span className="font-medium">₹{cgstTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600">
                            <span>Deduction (Rs.)</span>
                            <input type="number" min="0" step="any" value={form.deduction} onChange={e => setForm({ ...form, deduction: e.target.value })} className="w-24 rounded-lg border-gray-300 p-1.5 text-right font-medium text-red-600" />
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-300 text-xl font-bold text-gray-900">
                            <span>Grand Total</span>
                            <span className="text-green-600">₹{grandTotal.toFixed(2)}</span>
                        </div>

                        <button type="submit" disabled={saving || items.length === 0} className="w-full py-3 px-4 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                            {saving ? 'Generating...' : 'Confirm Invoice'}
                        </button>
                    </div>
                </div>
            </form>

            <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Add New Customer">
                <form onSubmit={handleCreateCustomer} className="space-y-4">
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
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mt-4">Save Customer</button>
                </form>
            </Modal>
        </>
    );
};

// Simple Printable View Document
const PrintableInvoice = ({ invoice, onBack }) => {
    const handleDownload = () => {
        const element = document.getElementById('printable-invoice');
        html2pdf().set({
            margin: 10,
            filename: `Invoice_${invoice.invoiceId}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save();
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-lg min-h-screen">
            <div className="flex justify-between items-start mb-8 print:hidden">
                <button onClick={onBack} className="text-gray-500 hover:text-gray-800 font-medium">← Back</button>
                <div className="flex space-x-3">
                    <button onClick={handleDownload} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Download PDF</button>
                    <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"><Printer className="w-4 h-4 mr-2" /> Print</button>
                </div>
            </div>

            <div id="printable-invoice" className="p-4 bg-white">
                <div className="border-b-2 border-gray-900 pb-6 mb-6">
                    <h1 className="text-4xl font-extrabold tracking-tighter text-blue-800 uppercase">Tax Invoice</h1>
                    <div className="flex justify-between items-end mt-4">
                        <div>
                            <h2 className="font-bold text-xl text-gray-900 mb-1">Billed To:</h2>
                            <p className="font-bold text-lg text-gray-800">{invoice.customer?.name}</p>
                            <p className="text-gray-600 text-sm mt-1"><span className="font-semibold">Customer ID:</span> {invoice.customer?.customerId}</p>
                            <p className="text-gray-600 text-sm"><span className="font-semibold">Phone:</span> {invoice.customer?.phone}</p>
                            {invoice.customer?.address && <p className="text-gray-600 text-sm max-w-xs"><span className="font-semibold">Address:</span> {invoice.customer?.address}</p>}
                        </div>
                        <div className="text-right">
                            <p><span className="text-gray-500 mr-2">Invoice No:</span> <span className="font-bold">{invoice.invoiceId}</span></p>
                            <p><span className="text-gray-500 mr-2">Date & Time:</span> <span>{new Date(invoice.invoiceDate).toLocaleString()}</span></p>
                            <p><span className="text-gray-500 mr-2">Sales Person:</span> <span>{invoice.salesPerson?.name || '-'}</span></p>
                        </div>
                    </div>
                </div>

                <table className="w-full text-left mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-800 pb-2 text-sm text-gray-600 uppercase font-bold">
                            <th className="pb-3 w-1/12">S.No</th>
                            <th className="pb-3 w-4/12">Item Description</th>
                            <th className="pb-3 text-right">Price</th>
                            <th className="pb-3 text-right">Qty</th>
                            <th className="pb-3 text-right">Amount</th>
                            <th className="pb-3 text-right">Dis.</th>
                            <th className="pb-3 text-right">Net Ext.</th>
                        </tr>
                    </thead>
                    <tbody className="border-b border-gray-300">
                        {invoice.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100 last:border-none text-sm">
                                <td className="py-4 text-gray-500 align-top">{idx + 1}</td>
                                <td className="py-4 align-top">
                                    <div className="font-medium text-gray-900">{item.material?.name || 'Unknown Item'}</div>
                                    <div className="text-xs text-gray-500 mt-1">ID: {item.materialId}</div>
                                </td>
                                <td className="py-4 text-right align-top">₹{item.unitPrice.toFixed(2)}</td>
                                <td className="py-4 text-right">{item.quantity}</td>
                                <td className="py-4 text-right">₹{item.amount.toFixed(2)}</td>
                                <td className="py-4 text-right text-gray-500">₹{item.discount.toFixed(2)}</td>
                                <td className="py-4 text-right font-medium text-gray-900">₹{item.lineTotal.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end">
                    <div className="w-72">
                        <div className="flex justify-between py-1 text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium">₹{invoice.subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between py-1 text-sm"><span className="text-gray-600">SGST</span><span>₹{invoice.totalSgst.toFixed(2)}</span></div>
                        <div className="flex justify-between py-1 text-sm"><span className="text-gray-600">CGST</span><span>₹{invoice.totalCgst.toFixed(2)}</span></div>
                        <div className="flex justify-between py-1 text-sm text-red-600 font-medium"><span>Deductions</span><span>-₹{invoice.deduction.toFixed(2)}</span></div>
                        <div className="flex justify-between py-3 mt-4 border-t-2 border-gray-800 text-xl font-bold bg-gray-50 px-2 rounded">
                            <span>Grand Total</span><span>₹{invoice.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-20 pt-8 border-t border-gray-200 text-center text-sm text-gray-400 print:fixed print:bottom-10 print:w-full">
                    Thank you for your business. COSMIC ERP.
                </div>
            </div>
        </div>
    )
};

export default Invoices;
