import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { RefreshCw, Search, Factory, ArrowRightLeft, Plus, X, Trash, Edit2, MapPin } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import ConfirmDialog from '../components/ConfirmDialog';

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

// Helper to flatten a tree structure into paths
const flattenSubLocations = (subs, parentId = null, currentPath = '') => {
    let result = [];
    const children = (subs || []).filter(s => s.parentId === parentId);
    for (let child of children) {
        const path = currentPath ? `${currentPath} > ${child.name}` : child.name;
        result.push({ id: child.subLocationId, path });
        result = result.concat(flattenSubLocations(subs, child.subLocationId, path));
    }
    return result;
};

// UI Helper to render beautiful breadcrumbs
const SubLocationBreadcrumbs = ({ locationId, subLocationId, locations, justify = 'end' }) => {
    if (!subLocationId || !locations) return null;
    const loc = locations.find(l => l.locationId === locationId);
    if (!loc) return null;

    // Safety check - sometimes locations haven't loaded subLocations array fully
    const flatSubs = flattenSubLocations(loc.subLocations || []);
    const match = flatSubs.find(s => s.id === subLocationId);
    if (!match) return <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded border">📍 Unknown Area</span>;

    const parts = match.path.split(' > ');
    return (
        <div className={`flex items-center space-x-1 mt-1 text-[11px] text-gray-500 font-medium justify-${justify} flex-wrap`}>
            <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
            {parts.map((p, i) => (
                <React.Fragment key={i}>
                    <span className="bg-white rounded px-1.5 py-0.5 border border-gray-200 shadow-sm">{p}</span>
                    {i < parts.length - 1 && <span className="text-gray-300">/</span>}
                </React.Fragment>
            ))}
        </div>
    );
};

const RecursiveSubLocation = ({ subLoc, allSubLocs, onAdd, onDelete, onEdit, locationId, expandVersion }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [editName, setEditName] = useState(subLoc.name);
    const children = allSubLocs.filter(s => s.parentId === subLoc.subLocationId);

    useEffect(() => {
        if (expandVersion && expandVersion.v > 0) {
            setIsExpanded(expandVersion.state);
        }
    }, [expandVersion]);

    const handleAdd = (e) => {
        e.preventDefault();
        onAdd(locationId, { name: newName, parentId: subLoc.subLocationId });
        setNewName('');
        setIsAdding(false);
        setIsExpanded(true);
    };

    const handleEditSave = (e) => {
        e.preventDefault();
        onEdit(subLoc.subLocationId, { name: editName });
        setIsEditingName(false);
    };

    return (
        <div className="ml-4 mt-1 border-l-2 border-gray-200 pl-4 py-1 relative">
            <div className="flex items-center justify-between group bg-white hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded-lg p-1.5 transition-colors">
                <div className="flex items-center space-x-2">
                    {children.length > 0 ? (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-500 hover:text-gray-800 focus:outline-none">
                            <span className="w-4 h-4 flex items-center justify-center font-bold">{isExpanded ? '−' : '+'}</span>
                        </button>
                    ) : <span className="w-4 h-4" />}
                    {isEditingName ? (
                        <form onSubmit={handleEditSave} className="flex items-center space-x-2">
                            <input autoFocus type="text" value={editName} onChange={e => setEditName(e.target.value)} className="text-xs rounded border-gray-300 border p-1" />
                            <button type="submit" className="px-2 py-0.5 bg-indigo-600 text-white rounded text-xs">Save</button>
                            <button type="button" onClick={() => setIsEditingName(false)} className="px-2 py-0.5 text-gray-500 text-xs hover:bg-gray-100 rounded">Cancel</button>
                        </form>
                    ) : (
                        <span className="font-medium text-sm text-gray-700">{subLoc.name}</span>
                    )}
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isEditingName && <button onClick={() => setIsEditingName(true)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>}
                    <button onClick={() => setIsAdding(!isAdding)} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded">Add Child</button>
                    <button onClick={() => onDelete(subLoc.subLocationId)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash className="w-3.5 h-3.5" /></button>
                </div>
            </div>

            {isAdding && (
                <form onSubmit={handleAdd} className="mt-2 ml-6 flex space-x-2 items-center">
                    <input required autoFocus type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder={`Add Area to ${subLoc.name}`} className="text-xs rounded border-gray-300 border p-1" />
                    <button type="submit" className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium">Save</button>
                    <button type="button" onClick={() => setIsAdding(false)} className="px-2 py-1 text-gray-500 text-xs">Cancel</button>
                </form>
            )}

            {isExpanded && children.map(child => (
                <RecursiveSubLocation key={child.subLocationId} subLoc={child} allSubLocs={allSubLocs} onAdd={onAdd} onDelete={onDelete} onEdit={onEdit} locationId={locationId} expandVersion={expandVersion} />
            ))}
        </div>
    );
};

const LocationTreeView = ({ location, onUpdated }) => {
    const [isAddingRoot, setIsAddingRoot] = useState(false);
    const [rootName, setRootName] = useState('');
    const [expandVersion, setExpandVersion] = useState({ v: 0, state: false });

    // Sort logic to make sure no crash
    const allSubLocs = location.subLocations || [];
    const roots = allSubLocs.filter(s => !s.parentId);

    const handleAdd = async (locId, payload) => {
        try {
            await api.post(`/locations/${locId}/sublocations`, payload);
            onUpdated();
        } catch (err) { alert(err.response?.data?.error || "Failed"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete this node and all of its nested children!")) return;
        try {
            await api.delete(`/sublocations/${id}`);
            onUpdated();
        } catch (err) { alert(err.response?.data?.error || "Failed"); }
    };

    const handleEditNode = async (id, payload) => {
        try {
            await api.put(`/sublocations/${id}`, payload);
            onUpdated();
        } catch (err) { alert(err.response?.data?.error || "Failed"); }
    };

    const handleAddRoot = (e) => {
        e.preventDefault();
        handleAdd(location.locationId, { name: rootName, parentId: null });
        setRootName('');
        setIsAddingRoot(false);
    };

    return (
        <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Areas & Bins Hierarchy</h4>
                <div className="flex space-x-2">
                    <button onClick={() => setExpandVersion(prev => ({ v: prev.v + 1, state: true }))} className="px-2 py-1 bg-white border border-gray-300 text-gray-600 shadow-sm text-xs rounded hover:bg-gray-50 flex items-center transition">
                        Expand All
                    </button>
                    <button onClick={() => setExpandVersion(prev => ({ v: prev.v + 1, state: false }))} className="px-2 py-1 bg-white border border-gray-300 text-gray-600 shadow-sm text-xs rounded hover:bg-gray-50 flex items-center transition">
                        Collapse All
                    </button>
                    <button onClick={() => setIsAddingRoot(!isAddingRoot)} className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 flex items-center shadow-sm">
                        <Plus className="w-3 h-3 mr-1" /> Add Root Area
                    </button>
                </div>
            </div>

            {isAddingRoot && (
                <form onSubmit={handleAddRoot} className="mb-4 flex space-x-2">
                    <input required autoFocus type="text" value={rootName} onChange={e => setRootName(e.target.value)} placeholder="e.g. Ground Floor" className="flex-1 rounded-lg border-gray-300 border p-1.5 text-sm" />
                    <button type="submit" className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Save</button>
                </form>
            )}

            {roots.length === 0 && !isAddingRoot ? (
                <div className="text-sm text-gray-500 italic pb-2">No areas configured. Click 'Add Root Area' to start building out this location.</div>
            ) : (
                <div className="pb-2">
                    {roots.map(root => (
                        <RecursiveSubLocation key={root.subLocationId} subLoc={root} allSubLocs={allSubLocs} onAdd={handleAdd} onDelete={handleDelete} onEdit={handleEditNode} locationId={location.locationId} expandVersion={expandVersion} />
                    ))}
                </div>
            )}
        </div>
    );
};

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('stock');
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = () => {
        api.get('/locations').then(({ data }) => setLocations(data)).catch(err => console.error("Error loading locations:", err));
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Inventory & Godowns</h1>
                <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-x-auto whitespace-nowrap pb-1 w-full md:w-auto">
                    <button onClick={() => setActiveTab('stock')} className={"px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (activeTab === 'stock' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100')}>Stock Inquiry</button>
                    <button onClick={() => setActiveTab('adjust')} className={"px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (activeTab === 'adjust' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100')}>Adjust/Add Stock</button>
                    <button onClick={() => setActiveTab('transfer')} className={"px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (activeTab === 'transfer' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100')}>Stock Transfer</button>
                    <button onClick={() => setActiveTab('history')} className={"px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100')}>Transfer History</button>
                    <button onClick={() => setActiveTab('locations')} className={"px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (activeTab === 'locations' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100')}>Locations</button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {activeTab === 'stock' && <StockInquiry locations={locations} />}
                {activeTab === 'adjust' && <StockAdjust locations={locations} />}
                {activeTab === 'transfer' && <StockTransfer locations={locations} />}
                {activeTab === 'history' && <TransferHistory locations={locations} />}
                {activeTab === 'locations' && <LocationsManager locations={locations} onLocationsUpdated={loadLocations} />}
            </div>
        </div>
    );
};

const TransferHistory = ({ locations }) => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmClear, setConfirmClear] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const loadLogs = () => {
        setLoading(true);
        api.get('/stock/transfers').then(res => {
            setLogs(res.data);
            setLoading(false);
        }).catch(err => {
            alert(err.response?.data?.error || "Failed to load history");
            setLoading(false);
        });
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const handleClearHistory = async () => {
        try {
            await api.delete('/stock/transfers/clear');
            setConfirmClear(false);
            loadLogs();
        } catch (e) {
            alert(e.response?.data?.error || "Failed");
        }
    };

    const handleDeleteLog = async () => {
        try {
            await api.delete(`/stock/transfers/${confirmDeleteId}`);
            setConfirmDeleteId(null);
            loadLogs();
        } catch (e) {
            alert(e.response?.data?.error || "Failed");
        }
    };

    if (loading) return <div className="text-gray-500 p-8 text-center">Loading Transfer Logs...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Stock Transfer History</h2>
                {user?.role === 'ADMIN' && logs.length > 0 && (
                    <button onClick={() => setConfirmClear(true)} className="flex items-center px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-medium whitespace-nowrap text-sm">
                        <Trash className="w-4 h-4 mr-2" /> Clear History
                    </button>
                )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transferred From</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transferred To</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            {user?.role === 'ADMIN' && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500 font-medium">No transfer logs recorded yet.</td>
                            </tr>
                        )}
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(log.transferDate).toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                    <div className="text-blue-700">{log.material?.name || log.materialId}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    <div className="font-semibold">{log.fromLocation?.name}</div>
                                    <SubLocationBreadcrumbs locationId={log.fromLocationId} subLocationId={log.fromSubLocId} locations={locations} justify="start" />
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    <div className="font-semibold">{log.toLocation?.name}</div>
                                    <SubLocationBreadcrumbs locationId={log.toLocationId} subLocationId={log.toSubLocId} locations={locations} justify="start" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-indigo-600">{log.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.user?.fullName || log.user?.username || 'Unknown'}</td>
                                {user?.role === 'ADMIN' && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button onClick={() => setConfirmDeleteId(log.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded transition">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                isOpen={confirmClear}
                title="Clear Transfer History?"
                message="This will permanently delete ALL recorded stock transfer logs. The physical stock quantities will NOT be reversed or affected. Are you sure?"
                confirmText="Yes, Clear All Logs"
                onConfirm={handleClearHistory}
                onCancel={() => setConfirmClear(false)}
                confirmColor="red"
            />

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                title="Delete Transfer Log?"
                message="This will permanently remove this transfer record from the history table. The physical stock quantities will NOT be reversed. Proceed?"
                confirmText="Yes, Delete Log"
                onConfirm={handleDeleteLog}
                onCancel={() => setConfirmDeleteId(null)}
                confirmColor="red"
            />
        </div>
    );
};

const StockInquiry = ({ locations }) => {
    const { user } = useContext(AuthContext);
    const [stock, setStock] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [search, setSearch] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [subLocationFilter, setSubLocationFilter] = useState('');
    const [confirmClear, setConfirmClear] = useState(false);

    const loadStock = () => api.get('/stock' + (locationFilter ? '?locationId=' + locationFilter : '')).then(({ data }) => setStock(data));

    useEffect(() => {
        loadStock();
        api.get('/materials').then(({ data }) => setMaterials(data));
    }, [locationFilter]);

    const handleClearStock = async () => {
        try {
            await api.delete('/stock/clear');
            setConfirmClear(false);
            loadStock();
        } catch (e) { alert(e.response?.data?.error || "Failed"); }
    };

    const distinctSubLocations = React.useMemo(() => {
        const subs = new Set();
        stock.forEach(s => {
            if (s.subLocationId) {
                const loc = locations.find(l => l.locationId === s.locationId);
                const flat = flattenSubLocations(loc?.subLocations || []);
                const match = flat.find(x => x.id === s.subLocationId);
                if (match) subs.add(match.path);
            }
        });
        return Array.from(subs).sort();
    }, [stock, locations]);

    const filteredStock = React.useMemo(() => {
        const trimmed = search.trim().toLowerCase();

        if (!trimmed) {
            return stock.filter(s => {
                if (s.quantity <= 0) return false;
                if (locationFilter && s.locationId !== locationFilter) return false;
                if (subLocationFilter) {
                    const loc = locations.find(l => l.locationId === s.locationId);
                    const flat = flattenSubLocations(loc?.subLocations || []);
                    const match = flat.find(x => x.id === s.subLocationId);
                    if (!match || match.path !== subLocationFilter) return false;
                }
                return true;
            });
        }

        const rows = [];
        const matchedMaterials = materials.filter(m =>
            m.name.toLowerCase().includes(trimmed) || m.materialId.toLowerCase().includes(trimmed)
        );

        matchedMaterials.forEach(m => {
            const mStocks = stock.filter(s => s.materialId === m.materialId && s.quantity > 0);

            let addedAny = false;
            mStocks.forEach(s => {
                if (locationFilter && s.locationId !== locationFilter) return;
                if (subLocationFilter) {
                    const loc = locations.find(l => l.locationId === s.locationId);
                    const flat = flattenSubLocations(loc?.subLocations || []);
                    const match = flat.find(x => x.id === s.subLocationId);
                    if (!match || match.path !== subLocationFilter) return;
                }
                rows.push(s);
                addedAny = true;
            });

            if (!addedAny) {
                if (!subLocationFilter) {
                    rows.push({
                        isDummy: true,
                        materialId: m.materialId,
                        material: m,
                        locationId: locationFilter || 'NONE',
                        location: locationFilter ? locations.find(l => l.locationId === locationFilter) : { name: 'Out of Stock' },
                        quantity: 0,
                        subLocation: null
                    });
                }
            }
        });
        return rows;
    }, [search, stock, materials, locationFilter, subLocationFilter, locations]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="Search material name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full rounded-lg border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <select value={locationFilter} onChange={(e) => { setLocationFilter(e.target.value); setSubLocationFilter(''); }} className="rounded-lg border-gray-300 shadow-sm p-2 border bg-white w-full sm:w-auto">
                        <option value="">All Locations</option>
                        {locations.map(l => <option key={l.locationId} value={l.locationId}>{l.name} ({l.type})</option>)}
                    </select>
                    {distinctSubLocations.length > 0 && (
                        <div className="w-full sm:min-w-[200px]">
                            <Select
                                value={subLocationFilter ? { value: subLocationFilter, label: subLocationFilter } : null}
                                onChange={(selected) => setSubLocationFilter(selected ? selected.value : '')}
                                options={distinctSubLocations.map(sl => ({ value: sl, label: sl }))}
                                placeholder="All Sub-sites..."
                                isClearable
                                className="text-sm bg-white"
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        borderColor: state.isFocused ? '#3B82F6' : '#d1d5db',
                                        boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                        borderRadius: '0.5rem',
                                        minHeight: '42px'
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        zIndex: 50,
                                        borderRadius: '0.5rem',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isSelected ? '#EEF2FF' : state.isFocused ? '#F3F4F6' : 'white',
                                        color: state.isSelected ? '#4F46E5' : '#374151',
                                        fontSize: '0.875rem',
                                        padding: '0.5rem 1rem'
                                    })
                                }}
                            />
                        </div>
                    )}
                    {user?.role === 'ADMIN' && (
                        <button onClick={() => setConfirmClear(true)} className="flex justify-center items-center px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-medium whitespace-nowrap w-full sm:w-auto mt-2 sm:mt-0">
                            <Trash className="w-4 h-4 mr-2" /> Clear All
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Location</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Material (Brand)</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase text-xs">Quantity</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStock.length === 0 ? <tr><td colSpan="3" className="px-6 py-6 text-center text-gray-500">No stock available</td></tr> : null}
                        {filteredStock.map(s => (
                            <tr key={s.materialId + '-' + s.locationId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium w-1/4">{s.location?.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    <div className="font-semibold">{s.material?.name}</div>
                                    <div className="text-xs text-gray-500">{s.material?.company?.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <div className="flex flex-col items-end">
                                        <span className={"px-3 py-1 rounded-full font-bold mb-1 " + (s.quantity > 5 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                            {s.quantity} {s.material?.unit}
                                        </span>
                                        <SubLocationBreadcrumbs locationId={s.locationId} subLocationId={s.subLocationId} locations={locations} justify="end" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                isOpen={confirmClear}
                title="Clear All Stock?"
                message="WARNING: This will permanently delete ALL stock entries across all godowns and main counters! Are you absolutely sure?"
                onConfirm={handleClearStock}
                onCancel={() => setConfirmClear(false)}
                confirmText="Hard Delete Everything"
                confirmColor="red"
            />
        </div>
    );
};

const StockAdjust = ({ locations, onStockUpdated }) => {
    const [materials, setMaterials] = useState([]);
    const [stock, setStock] = useState([]);
    const [form, setForm] = useState({ materialId: '', locationId: '', quantity: '', subLocationId: '' });
    const [message, setMessage] = useState('');

    // Quick Add Material States
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [newMat, setNewMat] = useState({ name: '', categoryId: '', companyId: '', sizeSpec: '', unit: '', purchasePrice: '', sellingPrice: '', gstPercentage: '', reorderLevel: '' });

    useEffect(() => {
        api.get('/materials').then(({ data }) => setMaterials(data));
        api.get('/stock').then(({ data }) => setStock(data));
        api.get('/companies').then(({ data }) => setCompanies(data));
        api.get('/categories').then(({ data }) => setCategories(data));
    }, []);

    useEffect(() => {
        // Smart Auto-Fill Logic
        if (form.materialId && form.locationId) {
            const existing = stock.find(s => s.materialId === form.materialId && s.locationId === form.locationId);
            if (existing && existing.subLocationId) {
                setForm(prev => ({ ...prev, subLocationId: existing.subLocationId }));
            }
        }
    }, [form.materialId, form.locationId, stock]);

    const activeSubLocations = React.useMemo(() => {
        if (!form.locationId) return [];
        const loc = locations.find(l => l.locationId === form.locationId);
        return flattenSubLocations(loc?.subLocations || []);
    }, [locations, form.locationId]);

    const handleAdjust = async (e) => {
        e.preventDefault();
        try {
            await api.post('/stock/adjust', { ...form });
            setForm({ materialId: '', locationId: '', quantity: '', subLocationId: '' });
            setMessage({ text: 'Stock updated successfully', type: 'success' });
            if (onStockUpdated) onStockUpdated();
        } catch (err) {
            setMessage({ text: err.response?.data?.error || 'Update failed', type: 'error' });
        }
    };

    const handleQuickAddRecord = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newMat, purchasePrice: parseFloat(newMat.purchasePrice) || 0, sellingPrice: parseFloat(newMat.sellingPrice) || 0, gstPercentage: parseFloat(newMat.gstPercentage) || 0, reorderLevel: parseInt(newMat.reorderLevel) || 0 };
            const { data } = await api.post('/materials', payload);
            setMaterials([...materials, data]);
            setForm({ ...form, materialId: data.materialId });
            setIsQuickAddOpen(false);
            setNewMat({ name: '', categoryId: '', companyId: '', sizeSpec: '', unit: '', purchasePrice: '', sellingPrice: '', gstPercentage: '', reorderLevel: '' });
            setMessage({ text: 'Material created and selected automatically!', type: 'success' });
        } catch (err) { alert(err.response?.data?.error || "Failed"); }
    };

    return (
        <React.Fragment>
            <form onSubmit={handleAdjust} className="max-w-2xl mx-auto space-y-6">
                {message.text && (
                    <div className={"p-4 rounded-lg " + (message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                        {message.text}
                    </div>
                )}

                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label className="block text-sm font-medium text-gray-700">Material</label>
                        <button type="button" onClick={() => setIsQuickAddOpen(true)} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center bg-blue-50 px-2 py-0.5 rounded transition">
                            <Plus className="w-3.5 h-3.5 mr-1" /> New Material
                        </button>
                    </div>
                    <Select
                        options={materials.filter(m => m.status !== 'INACTIVE').map(m => ({ value: m.materialId, label: m.name }))}
                        value={form.materialId ? { value: form.materialId, label: materials.find(m => m.materialId === form.materialId)?.name } : null}
                        onChange={(selected) => setForm({ ...form, materialId: selected?.value || '' })}
                        placeholder="Search material..."
                        isClearable
                        className="react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Location</label>
                        <select required value={form.locationId} onChange={e => setForm({ ...form, locationId: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2.5">
                            <option value="">-- Godown / Shop --</option>
                            {locations.map(l => <option key={l.locationId} value={l.locationId}>{l.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (+/-)</label>
                        <input required type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2.5" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Bin / Area (Optional)</label>
                        <select disabled={!form.locationId} value={form.subLocationId} onChange={e => setForm({ ...form, subLocationId: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2.5 bg-white disabled:bg-gray-100 disabled:text-gray-400">
                            <option value="">-- General Stock --</option>
                            {activeSubLocations.map(s => <option key={s.id} value={s.id}>{s.path}</option>)}
                        </select>
                    </div>
                </div>
                <button type="submit" className="w-full py-3 px-4 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700">Update Stock</button>
            </form>

            <Modal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} title="Quick Create Material">
                <form onSubmit={handleQuickAddRecord} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                            <input required type="text" value={newMat.name} onChange={e => setNewMat({ ...newMat, name: e.target.value })} className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="e.g. PVC Pipe" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                            <select required value={newMat.categoryId} onChange={e => setNewMat({ ...newMat, categoryId: e.target.value })} className="w-full rounded-md border-gray-300 border p-2 text-sm">
                                <option value="">Select...</option>
                                {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Brand</label>
                            <select required value={newMat.companyId} onChange={e => setNewMat({ ...newMat, companyId: e.target.value })} className="w-full rounded-md border-gray-300 border p-2 text-sm">
                                <option value="">Select...</option>
                                {companies.map(c => <option key={c.companyId} value={c.companyId}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Unit</label>
                            <input required type="text" value={newMat.unit} onChange={e => setNewMat({ ...newMat, unit: e.target.value })} className="w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="e.g. Pcs" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Cost Price</label>
                            <input required type="number" step="0.01" min="0" value={newMat.purchasePrice} onChange={e => setNewMat({ ...newMat, purchasePrice: e.target.value })} className="w-full rounded-md border-gray-300 border p-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Selling Price</label>
                            <input required type="number" step="0.01" min="0" value={newMat.sellingPrice} onChange={e => setNewMat({ ...newMat, sellingPrice: e.target.value })} className="w-full rounded-md border-gray-300 border p-2 text-sm" />
                        </div>
                    </div>
                    <button type="submit" className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg font-medium">Create & Select</button>
                </form>
            </Modal>
        </React.Fragment>
    );
};

const StockTransfer = ({ locations }) => {
    const [materials, setMaterials] = useState([]);
    const [stock, setStock] = useState([]);
    const [form, setForm] = useState({ materialId: '', fromLocationId: '', fromSubLocationId: '', toLocationId: '', toSubLocationId: '', quantity: '', remarks: '' });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/materials').then(({ data }) => setMaterials(data));
        api.get('/stock').then(({ data }) => setStock(data));
    }, []);

    const activeFromSubLocations = React.useMemo(() => {
        if (!form.fromLocationId) return [];
        const loc = locations.find(l => l.locationId === form.fromLocationId);
        return flattenSubLocations(loc?.subLocations || []);
    }, [locations, form.fromLocationId]);

    const activeToSubLocations = React.useMemo(() => {
        if (!form.toLocationId) return [];
        const loc = locations.find(l => l.locationId === form.toLocationId);
        return flattenSubLocations(loc?.subLocations || []);
    }, [locations, form.toLocationId]);

    useEffect(() => {
        // Smart Auto-Fill Logic for Destination
        if (form.materialId && form.toLocationId) {
            const existingDest = stock.find(s => s.materialId === form.materialId && s.locationId === form.toLocationId);
            if (existingDest && existingDest.subLocationId) {
                setForm(prev => ({ ...prev, toSubLocationId: existingDest.subLocationId }));
            }
        }
    }, [form.materialId, form.toLocationId, stock]);

    const handleTransfer = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/stock/transfer', {
                transferId: 'TRF-' + Date.now(),
                ...form,
                quantity: parseInt(form.quantity)
            });
            setMessage({ text: 'Stock transferred successfully!', type: 'success' });
            setForm({ ...form, quantity: '', remarks: '', toSubLocationId: '', fromSubLocationId: '' });
            api.get('/stock').then(({ data }) => setStock(data));
        } catch (err) {
            setMessage({ text: err.response?.data?.error || 'Transfer failed', type: 'error' });
        } finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleTransfer} className="max-w-4xl mx-auto space-y-6">
            {message.text && (
                <div className={"p-4 rounded-lg " + (message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                    {message.text}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Material</label>
                <Select
                    options={materials.filter(m => m.status !== 'INACTIVE').map(m => ({ value: m.materialId, label: m.name }))}
                    onChange={(selected) => setForm({ ...form, materialId: selected?.value || '' })}
                    placeholder="Search and select material to transfer..."
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4 p-4 border border-blue-100 rounded-xl bg-blue-50/50">
                    <h4 className="font-semibold text-blue-800">Source</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From Location</label>
                        <select required value={form.fromLocationId} onChange={e => setForm({ ...form, fromLocationId: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2.5">
                            <option value="">-- Source Godown / Shop --</option>
                            {locations.map(l => <option key={l.locationId} value={l.locationId}>{l.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Source Area / Bin</label>
                        <select disabled={!form.fromLocationId} value={form.fromSubLocationId} onChange={e => setForm({ ...form, fromSubLocationId: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2.5 bg-white disabled:bg-gray-100 disabled:text-gray-400">
                            <option value="">-- General Stock --</option>
                            {activeFromSubLocations.map(s => <option key={s.id} value={s.id}>{s.path}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-4 p-4 border border-green-100 rounded-xl bg-green-50/50">
                    <h4 className="font-semibold text-green-800">Destination</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Location</label>
                        <select required value={form.toLocationId} onChange={e => setForm({ ...form, toLocationId: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2.5">
                            <option value="">-- Destination Godown / Shop --</option>
                            {locations.map(l => <option key={l.locationId} value={l.locationId}>{l.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination Area / Bin</label>
                        <select disabled={!form.toLocationId} value={form.toSubLocationId} onChange={e => setForm({ ...form, toSubLocationId: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2.5 bg-white disabled:bg-gray-100 disabled:text-gray-400">
                            <option value="">-- General Stock --</option>
                            {activeToSubLocations.map(s => <option key={s.id} value={s.id}>{s.path}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input required type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2.5" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                    <input type="text" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2.5" />
                </div>
            </div>

            <button disabled={loading} type="submit" className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <ArrowRightLeft className="w-5 h-5 mr-2" />
                {loading ? 'Processing...' : 'Transfer Stock'}
            </button>
        </form>
    );
};

const LocationsManager = ({ locations, onLocationsUpdated }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLocId, setSelectedLocId] = useState(locations.length > 0 ? locations[0].locationId : null);
    const [form, setForm] = useState({ name: '', type: 'GODOWN' });
    const [editLocationId, setEditLocationId] = useState(null);

    // Auto-select first location if current selection goes away
    useEffect(() => {
        if (locations.length > 0 && (!selectedLocId || !locations.find(l => l.locationId === selectedLocId))) {
            setSelectedLocId(locations[0].locationId);
        }
    }, [locations, selectedLocId]);

    const selectedLoc = locations.find(l => l.locationId === selectedLocId);

    const openEditModal = (loc) => {
        setEditLocationId(loc.locationId);
        setForm({ name: loc.name, type: loc.type });
        setIsModalOpen(true);
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (editLocationId) {
                await api.put(`/locations/${editLocationId}`, form);
            } else {
                await api.post('/locations', { ...form });
            }
            setIsModalOpen(false);
            setEditLocationId(null);
            setForm({ name: '', type: 'GODOWN' });
            onLocationsUpdated();
        } catch (err) {
            alert(err.response?.data?.error || `Failed to ${editLocationId ? 'update' : 'create'} location`);
        }
    };

    const handleDeleteLocation = async (id) => {
        if (!window.confirm("WARNING: This will permanently delete this entire location, all its sub-locations, AND all associated stock inside it.\n\nAre you absolutely sure?")) return;
        try {
            await api.delete(`/locations/${id}`);
            onLocationsUpdated();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete location");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Warehouse Network</h3>
                    <p className="text-sm text-gray-500">Manage your main locations and internal bins/areas.</p>
                </div>
                <button onClick={() => { setEditLocationId(null); setForm({ name: '', type: 'GODOWN' }); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    <Plus className="w-4 h-4 mr-2" /> Add Location
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Master List (Left Pane) */}
                <div className="w-full md:w-1/3 flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2">
                    {locations.length === 0 && (
                        <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                            No locations currently.
                        </div>
                    )}
                    {locations.map(l => (
                        <div
                            key={l.locationId}
                            onClick={() => setSelectedLocId(l.locationId)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedLocId === l.locationId
                                ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                }`}
                        >
                            <div>
                                <h4 className={`font-semibold ${selectedLocId === l.locationId ? 'text-blue-800' : 'text-gray-800'}`}>{l.name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">ID: {l.locationId}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${l.type === 'SHOP' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                {l.type}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Detail View (Right Pane) */}
                <div className="w-full md:w-2/3">
                    {selectedLoc ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedLoc.name}</h2>
                                    <p className="text-sm text-gray-500 mt-1">Type: <span className="font-semibold text-gray-700">{selectedLoc.type}</span> | ID: {selectedLoc.locationId}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => openEditModal(selectedLoc)} className="px-3 py-1.5 flex items-center bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition">
                                        <Edit2 className="w-4 h-4 mr-2" /> Rename
                                    </button>
                                    <button onClick={() => handleDeleteLocation(selectedLoc.locationId)} className="px-3 py-1.5 flex items-center bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg text-sm font-medium transition">
                                        <Trash className="w-4 h-4 mr-2" /> Delete Set
                                    </button>
                                </div>
                            </div>
                            {/* Hierarchy Tree */}
                            <div className="p-6 min-h-[400px]">
                                <LocationTreeView location={selectedLoc} onUpdated={onLocationsUpdated} />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 h-[300px] flex items-center justify-center text-gray-500">
                            Select a location from the left to view its details.
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditLocationId(null); }} title={editLocationId ? "Edit Storage Location" : "Register Storage Location"}>
                <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                    {!editLocationId && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                            <p className="text-sm text-blue-800 italic">Location ID will be auto-generated by the system.</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name</label>
                        <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2" placeholder="e.g. Main Warehouse" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Facility Type</label>
                        <select required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border-gray-300 border p-2">
                            <option value="GODOWN">Godown / Warehouse</option>
                            <option value="SHOP">Retail Shop Counter</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mt-4">
                        {editLocationId ? 'Update Location' : 'Save Location'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Inventory;
