import { useState, useEffect, useCallback } from 'react';
import { 
    getFinishedGoods, 
    createFinishedGood, 
    getFinishedGoodsOptions,
    deleteFinishedGood,
    updateFinishedGood
} from '../../api/finishedGoods';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import { 
    Plus, 
    Search, 
    Box, 
    Cpu, 
    Zap, 
    CircuitBoard, 
    Layers, 
    Trash2, 
    Loader2, 
    CheckCircle2, 
    Fingerprint,
    ListPlus,
    Wrench,
    Binary
} from 'lucide-react';
import toast from 'react-hot-toast';

const FinishedGoodsPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [options, setOptions] = useState({ products: [], pcb: [], electrical: [], electronics: [], structural: [] });

    // Form state
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [hardwareFeatures, setHardwareFeatures] = useState([]); // [{type: '', id: '', name: ''}]
    const [softwareFeatures, setSoftwareFeatures] = useState([]); // [string]
    const [newSoftwareFeature, setNewSoftwareFeature] = useState('');
    const [isIot, setIsIot] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [inventoryError, setInventoryError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getFinishedGoods({ 
                page: pagination.page, 
                limit: pagination.limit, 
                search: searchTerm 
            });
            setItems(data.data);
            setPagination(prev => ({ ...prev, total: data.meta?.total || 0 }));
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch finished goods');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, searchTerm]);

    const fetchOptions = useCallback(async () => {
        try {
            const data = await getFinishedGoodsOptions();
            setOptions(data.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch options');
        }
    }, []);

    useEffect(() => {
        Promise.resolve().then(() => {
            fetchData();
            fetchOptions();
        });
    }, [fetchData, fetchOptions]);

    const [viewItem, setViewItem] = useState(null);

    const handleAddHardwareFeature = (type, id, name, stockQuantity = 0) => {
        if (!id) return;
        if (hardwareFeatures.some(f => f.type === type && f.id === id)) {
            toast.error('Component already added');
            return;
        }
        setInventoryError('');
        setHardwareFeatures([...hardwareFeatures, { type, id, name, stockQuantity }]);
    };

    const handleRemoveHardwareFeature = (index) => {
        setInventoryError('');
        setHardwareFeatures(hardwareFeatures.filter((_, i) => i !== index));
    };

    const handleAddSoftwareFeature = () => {
        if (!newSoftwareFeature.trim()) return;
        if (softwareFeatures.includes(newSoftwareFeature.trim())) {
            toast.error('Feature already added');
            return;
        }
        setSoftwareFeatures([...softwareFeatures, newSoftwareFeature.trim()]);
        setNewSoftwareFeature('');
    };

    const handleRemoveSoftwareFeature = (index) => {
        setSoftwareFeatures(softwareFeatures.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productId) {
            toast.error('Please select a product');
            return;
        }

        const requestedQuantity = Number.parseInt(quantity, 10) || 0;
        const inventoryShortage = hardwareFeatures.find((feature) => {
            if (feature.stockQuantity === undefined || feature.stockQuantity === null || feature.stockQuantity === '') {
                return false;
            }

            const availableQuantity = Number.parseInt(feature.stockQuantity, 10) || 0;
            return availableQuantity < requestedQuantity;
        });

        if (inventoryShortage) {
            const message = `${inventoryShortage.name} quantity is not enough in the inventory. Required ${requestedQuantity}, available ${inventoryShortage.stockQuantity || 0}.`;
            setInventoryError(message);
            toast.error(message);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                product_id: productId,
                quantity: quantity,
                hardware_features: hardwareFeatures.map(f => ({ type: f.type, id: f.id })),
                software_features: isIot ? softwareFeatures : [],
                is_iot: isIot
            };

            if (editItem) {
                await updateFinishedGood(editItem.id || editItem.finished_good_id, payload);
                toast.success('Finished Good updated successfully');
            } else {
                await createFinishedGood(payload);
                toast.success('Finished Good created successfully');
            }
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error(error);
            const errorMessage = error?.response?.data?.error?.message || error?.message || (editItem ? 'Failed to update finished good' : 'Failed to create finished good');
            setInventoryError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleView = (row) => {
        setViewItem(row);
        setIsModalOpen(true);
    };

    const handleEdit = (row) => {
        setEditItem(row);
        setProductId(row.product_id);
        setQuantity(row.quantity);
        setIsIot(row.is_iot);
        setInventoryError('');
        
        const mappedHardware = (row.hardware_features || []).map(h => {
            const groupItems = options[h.component_type] || [];
            const found = groupItems.find(item => item.id == h.component_id);
            return {
                type: h.component_type,
                id: h.component_id,
                name: found ? found.name : `ID: ${h.component_id}`,
                stockQuantity: found ? found.stock_quantity : 0
            };
        });
        setHardwareFeatures(mappedHardware);

        const mappedSoftware = (row.software_features || []).map(s => s.feature_name || s);
        setSoftwareFeatures(mappedSoftware);

        setIsModalOpen(true);
    };

    const handleDelete = async (row) => {
        if (!window.confirm('Are you sure you want to delete this finished good?')) return;
        try {
            await deleteFinishedGood(row.id || row.finished_good_id || row.id);
            toast.success('Finished Good deleted');
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete finished good');
        }
    };

    const resetForm = () => {
        setProductId('');
        setQuantity(1);
        setHardwareFeatures([]);
        setSoftwareFeatures([]);
        setNewSoftwareFeature('');
        setIsIot(false);
        setEditItem(null);
        setInventoryError('');
    };

    const getComponentName = (type, id) => {
        const list = options[type] || [];
        const item = list.find(i => i.id == id);
        return item ? item.name : `ID: ${id}`;
    };

    const columns = [
        { 
            key: 'product_name', 
            label: 'Product', 
            render: (row) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-main)]">{row.product_name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${row.is_iot ? 'bg-[var(--border-glow)] text-[var(--accent)]' : 'bg-[var(--bg-workspace)] border border-[var(--border-color)] text-[var(--text-dim)]'}`}>
                            {row.is_iot ? 'IoT' : 'Non-IoT'}
                        </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">{row.product_code}</span>
                </div>
            )
        },
        { 
            key: 'quantity', 
            label: 'Quantity',
            render: (row) => <span className="font-black text-[var(--accent)]">{row.quantity}</span>
        },
        {
            key: 'features',
            label: 'Features',
            render: (row) => (
                <div className="flex flex-wrap gap-1.5 max-w-[450px]">
                    {row.hardware_features?.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded text-[9px] uppercase font-bold text-[var(--text-main)] flex items-center gap-1 shadow-sm">
                            <span className="text-[var(--accent)] font-extrabold">{f.component_type}:</span>
                            <span>{getComponentName(f.component_type, f.component_id)}</span>
                        </span>
                    ))}
                    {row.is_iot && row.software_features?.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[var(--border-glow)] border border-[var(--accent)] rounded text-[9px] uppercase font-bold text-[var(--accent)] flex items-center gap-1 shadow-sm">
                            <span className="font-extrabold">SW:</span>
                            <span>{f.feature_name}</span>
                        </span>
                    ))}
                </div>
            )
        },
        {
            key: 'serial_numbers',
            label: 'Serial Numbers',
            render: (row) => (
                <div className="max-w-[200px] overflow-hidden truncate text-[10px] text-[var(--text-dim)] font-mono">
                    {row.serial_numbers?.join(', ')}
                </div>
            )
        },
        {
            key: 'created_at',
            label: 'Created At',
            render: (row) => new Date(row.created_at).toLocaleDateString()
        }
    ];

    // Stats calculation
    const totalComponentsUsed = items.reduce((acc, item) => acc + (item.hardware_features?.length || 0), 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-entrance-down">
                <div className="flex items-center gap-5">
                    <div className="p-3 md:p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-sm group animate-float">
                        <Box size={24} className="md:w-[28px] md:h-[28px] text-[var(--accent)] group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-main)] tracking-tight leading-none uppercase">Finished Goods</h1>
                        <p className="text-[11px] text-[var(--text-muted)] font-bold mt-2 uppercase tracking-[0.2em] opacity-70">Manage assembled products and serial numbers</p>
                    </div>
                </div>

                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="btn-primary shadow-lg px-8 py-3 group hover-scale-md animate-glow"
                    style={{ boxShadow: '0 10px 15px -3px var(--border-glow)' }}
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span className="text-[12px] md:text-[14px]">Add Finished Good</span>
                </button>
            </div>

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Total Assembled', value: pagination.total || items.length, icon: Box, color: 'var(--badge-admin-text)', bg: 'var(--badge-admin-bg)' },
                    { title: 'IoT Devices', value: items.filter(i => i.is_iot).length, icon: Cpu, color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
                    { title: 'Non-IoT Devices', value: items.filter(i => !i.is_iot).length, icon: Binary, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
                    { title: 'Components Integrated', value: totalComponentsUsed, icon: Wrench, color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)' }
                ].map((stat, idx) => (
                    <div key={idx} className="workspace-card p-5 border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-dim)] mb-1">{stat.title}</p>
                            <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{loading ? '...' : stat.value}</h3>
                        </div>
                        <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm"
                            style={{ background: stat.bg, color: stat.color }}
                        >
                            <stat.icon size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="workspace-card p-2.5 flex flex-col md:flex-row gap-3 items-center border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors duration-300" size={16} />
                    <input
                        type="text"
                        placeholder="Search by product name or code..."
                        className="w-full bg-[var(--bg-workspace)] border border-[var(--border-color)] rounded-lg py-2 pl-10 pr-28 outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--border-glow)] transition-all text-[13px] text-[var(--text-main)] placeholder:text-[var(--text-dim)] font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 pointer-events-none hidden sm:block">{pagination.total} Records Found</div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={items}
                loading={loading}
                totalCount={pagination.total}
                filteredCount={items.length}
                currentPage={pagination.page}
                totalPages={Math.ceil(pagination.total / pagination.limit) || 1}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setViewItem(null); resetForm(); }}
                title={viewItem ? 'Finished Good Details' : editItem ? 'Edit Finished Good Assembly' : 'Assemble New Finished Good'}
                width="800px"
            >
                {viewItem ? (
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-black">{viewItem.product_name}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${viewItem.is_iot ? 'bg-[var(--border-glow)] text-[var(--accent)]' : 'bg-[var(--bg-workspace)] border border-[var(--border-color)] text-[var(--text-dim)]'}`}>
                                {viewItem.is_iot ? 'IoT Device' : 'Non-IoT Device'}
                            </span>
                        </div>
                        <p className="text-sm text-[var(--text-dim)]">Quantity: <span className="font-bold text-[var(--accent)]">{viewItem.quantity}</span></p>
                        <div>
                            <h4 className="text-xs font-black uppercase text-[var(--text-dim)]">Hardware Features</h4>
                            <ul className="mt-2 space-y-1.5 pl-1 text-sm text-[var(--text-main)]">
                                {viewItem.hardware_features?.map((h, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 bg-[var(--bg-workspace)] border border-[var(--border-color)] rounded text-[9px] uppercase font-black text-[var(--accent)]">{h.component_type}</span>
                                        <span className="font-semibold">{getComponentName(h.component_type, h.component_id)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {viewItem.is_iot && viewItem.software_features && viewItem.software_features.length > 0 && (
                            <div>
                                <h4 className="text-xs font-black uppercase text-[var(--text-dim)]">Software Features</h4>
                                <ul className="mt-2 list-disc pl-5 text-sm text-[var(--text-main)]">
                                    {viewItem.software_features.map((s, i) => (
                                        <li key={i}>{s.feature_name}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div>
                            <h4 className="text-xs font-black uppercase text-[var(--text-dim)]">Serial Numbers</h4>
                            <div className="mt-2 text-sm font-mono text-[var(--text-dim)]">{(viewItem.serial_numbers || []).join(', ')}</div>
                        </div>
                    </div>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-8 p-2">
                    {/* Product & Device Type Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest ml-1">
                                Select Product <span className="text-rose-500">*</span>
                            </label>
                            <select
                                className="w-full bg-[var(--bg-workspace)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-[14px] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition-all font-bold appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233d6a7d'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.2em', backgroundPosition: 'right 1.5rem center', backgroundRepeat: 'no-repeat' }}
                                value={productId}
                                onChange={(e) => { setProductId(e.target.value); setInventoryError(''); }}
                                required
                            >
                                <option value="">Select a product...</option>
                                {options.products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest ml-1">
                                Device Type
                            </label>
                            <div className="flex bg-[var(--bg-workspace)] border border-[var(--border-color)] p-1 rounded-2xl h-[58px] items-center">
                                <button
                                    type="button"
                                    onClick={() => { setIsIot(false); setSoftwareFeatures([]); }}
                                    className={`flex-1 py-3 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest ${!isIot ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    Non-IoT
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsIot(true)}
                                    className={`flex-1 py-3 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest ${isIot ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    IoT
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Hardware Features */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest ml-1">
                            Hardware Features
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { type: 'pcb', label: 'PCB', icon: Cpu, items: options.pcb },
                                { type: 'electrical', label: 'Electrical', icon: Zap, items: options.electrical },
                                { type: 'electronics', label: 'Electronics', icon: CircuitBoard, items: options.electronics },
                                { type: 'structural', label: 'Structural', icon: Layers, items: options.structural }
                            ].map((group) => (
                                <div key={group.type} className="space-y-2">
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <group.icon size={14} className="text-[var(--accent)]" />
                                        <span className="text-[9px] font-black uppercase text-[var(--text-muted)]">{group.label}</span>
                                    </div>
                                    <select
                                        className="w-full bg-[var(--bg-workspace)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[12px] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition-all font-bold"
                                        onChange={(e) => {
                                            const item = group.items.find(i => i.id == e.target.value);
                                            if (item) handleAddHardwareFeature(group.type, item.id, item.name, item.stock_quantity);
                                            e.target.value = "";
                                        }}
                                    >
                                        <option value="">Select...</option>
                                        {group.items.map(i => (
                                            <option key={i.id} value={i.id}>{i.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {/* Selected Hardware List */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            {hardwareFeatures.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] pl-3 pr-1 py-1.5 rounded-xl group hover:border-[var(--accent)] transition-all">
                                    <span className="text-[10px] font-bold text-[var(--text-main)]">
                                        <span className="text-[var(--accent)] uppercase mr-1">{f.type}:</span> {f.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveHardwareFeature(i)}
                                        className="p-1 text-[var(--text-dim)] hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            {hardwareFeatures.length === 0 && (
                                <p className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-wider italic">No hardware components selected</p>
                            )}
                        </div>
                    </div>

                    {/* Software Features */}
                    {isIot && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest ml-1">
                                Software Features
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Add new software feature..."
                                    className="flex-1 bg-[var(--bg-workspace)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-[14px] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition-all font-bold"
                                    value={newSoftwareFeature}
                                    onChange={(e) => setNewSoftwareFeature(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSoftwareFeature())}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSoftwareFeature}
                                    className="px-6 rounded-2xl bg-[var(--nav-hover)] text-[var(--accent)] border border-[var(--border-color)] hover:border-[var(--accent)] transition-all"
                                >
                                    <ListPlus size={20} />
                                </button>
                            </div>

                            {/* Selected Software List */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {softwareFeatures.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-[var(--border-glow)] border border-[var(--accent)] pl-3 pr-1 py-1.5 rounded-xl">
                                        <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-wider">{f}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSoftwareFeature(i)}
                                            className="p-1 text-[var(--accent)] hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                                {softwareFeatures.length === 0 && (
                                    <p className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-wider italic">No software features added</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quantity & Serial Generation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[var(--border-color)]">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest ml-1">
                                Quantity
                            </label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-[var(--bg-workspace)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-[14px] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition-all font-bold font-mono"
                                value={quantity}
                                    onChange={(e) => { setQuantity(e.target.value); setInventoryError(''); }}
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest ml-1">
                                Serial Numbers
                            </label>
                            <div className="flex items-center gap-3 bg-[var(--bg-elevated)] border border-dashed border-[var(--border-color)] rounded-2xl px-5 py-3 text-[var(--text-dim)]">
                                <Fingerprint size={24} strokeWidth={1.5} className="text-[var(--accent)] opacity-50" />
                                <div className="flex-1">
                                    <p className="text-[11px] font-black uppercase tracking-wider leading-none">Automatic Generation</p>
                                    <p className="text-[9px] font-bold mt-1 opacity-70">Serials will be generated after save</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {inventoryError && (
                        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm font-bold text-rose-500">
                            {inventoryError}
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-3 bg-[var(--accent)] text-white px-10 py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:scale-100"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    {editItem ? 'Updating...' : 'Assembling...'}
                                </>
                            ) : (
                                <>
                                    {/* <CheckCircle2 size={18} /> */}
                                    {editItem ? 'Update Finished Goods' : 'Save Finished Goods'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
                )}
            </Modal>
        </div>
    );
};

export default FinishedGoodsPage;
                