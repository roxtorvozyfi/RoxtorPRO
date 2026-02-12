
import React, { useState, useMemo, useRef } from 'react';
import { Order, Product, AppSettings, Designer, PaymentRecord, AssignmentLog, StoreInfo } from '../types';
import { 
  ClipboardList, Plus, Key, BarChart3, LayoutDashboard, Printer, FileText, 
  X, Save, Users, Calendar, MessageCircle, DollarSign, Image as ImageIcon,
  CheckCircle, History, CreditCard, ArrowUpRight, Share2, Trash2, MapPin, 
  ShieldCheck, UserCircle, Briefcase, Phone, Play, Check, Bell, Activity, 
  Sparkles, TrendingUp, Clock, Camera, Trash, Upload, Instagram, ChevronRight, 
  FileDown, Download, Database, RefreshCw, AlertTriangle, Smartphone, Zap, Search,
  Eye, Filter, TrendingDown, Share, Factory, Monitor, Info, Building2, UserMinus, 
  Table
} from 'lucide-react';
import { getDirectImageUrl } from '../App';

interface Props {
  orders: Order[];
  products: Product[];
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  onAddOrder: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onUpdateOrderPayments: (orderId: string, payments: PaymentRecord[]) => void;
  onUpdateOrderAssignment: (orderId: string, agentId: string, history: AssignmentLog[]) => void;
}

const OperationsManager: React.FC<Props> = ({ 
  orders, products, settings, onUpdateSettings, onAddOrder, onUpdateOrderStatus, onUpdateOrderPayments, onUpdateOrderAssignment
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'designers' | 'reports' | 'profile'>('orders');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isRegisteringPayment, setIsRegisteringPayment] = useState<Order | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isMasterMode, setIsMasterMode] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<'orders' | 'designers' | 'reports' | 'profile' | null>(null);
  const [selectedOrderForPDF, setSelectedOrderForPDF] = useState<Order | null>(null);
  const [showGlobalReportPDF, setShowGlobalReportPDF] = useState(false);
  const [reassigningOrder, setReassigningOrder] = useState<Order | null>(null);
  const [viewingHistoryMember, setViewingHistoryMember] = useState<Designer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // --- NUEVA ORDEN STATE ---
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    storeId: settings.stores[0]?.id || '',
    items: [{ name: '', quantity: 1, price: 0 }],
    clientName: '',
    clientDoc: '',
    clientPhone: '',
    jobDescription: '',
    referenceImages: [],
    deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assignedToId: '',
  });

  const [initialPayment, setInitialPayment] = useState<Partial<PaymentRecord>>({
    amountUSD: 0,
    method: 'Dólares Efectivo',
    reference: ''
  });

  const [additionalPayment, setAdditionalPayment] = useState<Partial<PaymentRecord>>({
    amountUSD: 0,
    method: 'Dólares Efectivo',
    reference: ''
  });

  const [newMember, setNewMember] = useState<Partial<Designer>>({
    name: '',
    role: 'agente',
    specialty: '',
    phone: '',
    assignedStoreId: settings.stores[0]?.id || ''
  });

  const handlePrint = () => window.print();

  const handleTabChange = (tab: 'orders' | 'designers' | 'reports' | 'profile') => {
    if ((tab === 'reports' || tab === 'profile') && !isMasterMode) {
      setPendingTab(tab);
      setShowPinModal(true);
    } else { setActiveSubTab(tab); }
  };

  const verifyMasterPin = () => {
    if (pinInput === settings.masterPin) {
      setIsMasterMode(true);
      if (pendingTab) setActiveSubTab(pendingTab);
      setShowPinModal(false);
      setPinInput('');
    } else { alert("PIN DE GERENCIA INCORRECTO"); setPinInput(''); }
  };

  const handleExportData = () => {
    const data = { orders, products, settings, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ROXTOR_MASTER_DATA_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const downloadCSV = () => {
    const headers = ["Orden", "Cliente", "Rif/CI", "Total USD", "Pagado USD", "Pendiente USD", "Estatus", "Sede", "Fecha Creacion"];
    const rows = orders.map(o => [
      o.orderNumber,
      `"${o.clientName.replace(/"/g, '""')}"`,
      o.clientDoc,
      o.totalUSD.toFixed(2),
      o.paidAmountUSD.toFixed(2),
      (o.totalUSD - o.paidAmountUSD).toFixed(2),
      o.status.toUpperCase(),
      settings.stores.find(s => s.id === o.storeId)?.name || 'N/A',
      new Date(o.createdAt).toLocaleDateString()
    ]);

    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `REPORTE_ROXTOR_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (confirm('¿SINCRONIZAR DATOS? Se actualizarán órdenes, productos y equipo según el archivo maestro.')) {
          localStorage.setItem('roxtor_orders', JSON.stringify(data.orders));
          localStorage.setItem('roxtor_catalog', JSON.stringify(data.products));
          localStorage.setItem('roxtor_settings', JSON.stringify(data.settings));
          window.location.reload();
        }
      } catch (err) { alert('Error al leer el archivo de sincronización.'); }
    };
    reader.readAsText(file);
  };

  const handleCreateOrderSubmit = () => {
    if (!newOrder.clientName) return alert("Nombre de cliente requerido");
    const items = newOrder.items || [];
    const totalUSD = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const store = settings.stores.find(s => s.id === newOrder.storeId) || settings.stores[0];
    const orderNumber = `${store.whatsappId}-${store.lastOrderNumber + 1}`;

    const payments: PaymentRecord[] = [];
    if (initialPayment.amountUSD && initialPayment.amountUSD > 0) {
      payments.push({
        id: Date.now().toString(),
        amountUSD: initialPayment.amountUSD,
        method: initialPayment.method as any,
        reference: initialPayment.reference,
        date: new Date().toISOString()
      });
    }

    const initialAgent = settings.designers.find(d => d.id === newOrder.assignedToId);
    const history: AssignmentLog[] = initialAgent ? [{
      agentId: initialAgent.id,
      agentName: initialAgent.name,
      assignedAt: new Date().toISOString(),
      role: initialAgent.role
    }] : [];

    const order: Order = {
      id: Date.now().toString(),
      orderNumber,
      clientName: newOrder.clientName || '',
      clientDoc: newOrder.clientDoc || '',
      clientPhone: newOrder.clientPhone || '',
      clientAddress: '',
      deliveryDate: newOrder.deliveryDate,
      jobDescription: newOrder.jobDescription,
      referenceImages: newOrder.referenceImages || [],
      items: items.map(it => ({ ...it, name: it.name || 'Personalizado' } as any)),
      totalUSD,
      totalVES: totalUSD * settings.currentBcvRate,
      payments,
      paidAmountUSD: payments.reduce((acc, p) => acc + p.amountUSD, 0),
      remainingAmountUSD: totalUSD - payments.reduce((acc, p) => acc + p.amountUSD, 0),
      exchangeRateUsed: settings.currentBcvRate,
      status: 'pendiente',
      agentId: initialAgent?.id || '',
      assignedToId: initialAgent?.id,
      assignmentHistory: history,
      storeId: store.id,
      createdAt: new Date().toISOString()
    };

    onAddOrder(order);
    onUpdateSettings({ 
      ...settings, 
      stores: settings.stores.map(s => s.id === store.id ? { ...s, lastOrderNumber: s.lastOrderNumber + 1 } : s) 
    });
    setIsCreatingOrder(false);
    setNewOrder({
      storeId: settings.stores[0]?.id || '',
      items: [{ name: '', quantity: 1, price: 0 }],
      clientName: '',
      clientDoc: '',
      clientPhone: '',
      jobDescription: '',
      referenceImages: [],
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedToId: '',
    });
  };

  const handleReassign = (agentId: string) => {
    if (!reassigningOrder) return;
    const newAgent = settings.designers.find(d => d.id === agentId);
    if (!newAgent) return;

    const newLog: AssignmentLog = {
      agentId: newAgent.id,
      agentName: newAgent.name,
      assignedAt: new Date().toISOString(),
      role: newAgent.role
    };

    const updatedHistory = [...(reassigningOrder.assignmentHistory || []), newLog];
    onUpdateOrderAssignment(reassigningOrder.id, agentId, updatedHistory);
    setReassigningOrder(null);
  };

  const updateStoreConfig = (storeId: string, updates: Partial<StoreInfo>) => {
    const newStores = settings.stores.map(s => s.id === storeId ? { ...s, ...updates } : s);
    onUpdateSettings({ ...settings, stores: newStores });
  };

  const getUrgencyStatus = (dateStr?: string, status?: string) => {
    if (!dateStr || status === 'entregado' || status === 'listo') return { color: 'text-slate-400', alert: false, label: status === 'entregado' ? 'ENTREGADA' : 'LISTO' };
    const delivery = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    delivery.setHours(0,0,0,0);
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { color: 'text-red-600', alert: true, label: '¡VENCIDA!' };
    if (diffDays === 0) return { color: 'text-red-600', alert: true, label: 'ENTREGA HOY' };
    if (diffDays > 0 && diffDays <= 2) return { color: 'text-red-600', alert: true, label: `QUEDAN ${diffDays} DÍAS` };
    return { color: 'text-emerald-500', alert: false, label: `${diffDays} DÍAS RESTANTES` };
  };

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (selectedStoreFilter !== 'all') {
      result = result.filter(o => o.storeId === selectedStoreFilter);
    }
    if (searchTerm) {
      result = result.filter(o => 
        o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [orders, searchTerm, selectedStoreFilter]);

  const stats = useMemo(() => {
    const totalUSD = orders.reduce((acc, o) => acc + o.totalUSD, 0);
    const accountsReceivable = orders.reduce((acc, o) => acc + o.remainingAmountUSD, 0);
    const storeStats = settings.stores.map(s => {
      const sOrders = orders.filter(o => o.storeId === s.id);
      return { 
        ...s, 
        volumeUSD: sOrders.reduce((acc, o) => acc + o.totalUSD, 0), 
        pending: sOrders.reduce((acc, o) => acc + o.remainingAmountUSD, 0),
        orderCount: sOrders.length
      };
    });
    const agentEffectiveness = settings.designers.map(d => {
      const dOrders = orders.filter(o => o.assignmentHistory?.some(h => h.agentId === d.id));
      const completed = dOrders.filter(o => o.status === 'entregado' || o.status === 'listo').length;
      return { 
        id: d.id,
        name: d.name, 
        role: d.role, 
        effectiveness: dOrders.length > 0 ? (completed / dOrders.length) * 100 : 0, 
        totalAssigned: dOrders.length,
        volumeUSD: dOrders.reduce((acc, o) => acc + o.totalUSD, 0)
      };
    });
    return { totalUSD, accountsReceivable, storeStats, agentEffectiveness };
  }, [orders, settings.stores, settings.designers]);

  const logoUrl = getDirectImageUrl(settings.companyLogoUrl || '');

  return (
    <div className="space-y-6 pb-20">
      
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[500] flex items-center justify-center p-6">
          <div className="bg-white rounded-[45px] p-12 max-sm:p-8 max-w-sm w-full text-center space-y-8 shadow-2xl animate-in zoom-in duration-300">
            <Key size={44} className="mx-auto text-blue-900" />
            <h3 className="text-2xl font-black text-blue-900 uppercase italic">Control Maestro</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingrese su Llave de Gerencia</p>
            <input type="password" autoFocus placeholder="••••" className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl text-center text-3xl font-black tracking-[0.5em] outline-none" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyMasterPin()} />
            <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
              <button onClick={() => setShowPinModal(false)}>CANCELAR</button>
              <button onClick={verifyMasterPin} className="text-blue-900">VERIFICAR</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR SUBTABS */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-[28px] w-full border border-slate-200 overflow-x-auto no-scrollbar print:hidden shadow-sm">
        {[
          { id: 'orders', label: 'ÓRDENES', icon: ClipboardList },
          { id: 'designers', label: 'EQUIPO', icon: Users },
          { id: 'reports', label: 'REPORTES', icon: BarChart3 },
          { id: 'profile', label: 'AJUSTES', icon: LayoutDashboard }
        ].map(tab => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id as any)} className={`flex-1 min-w-[100px] flex flex-col items-center justify-center gap-1.5 py-4 rounded-[22px] text-[8px] font-black transition-all ${activeSubTab === tab.id ? 'bg-white text-blue-900 shadow-xl' : 'text-slate-400 opacity-60'}`}>
            <tab.icon size={18} />
            <span className="uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="animate-in fade-in duration-500">
        
        {/* ÓRDENES TAB */}
        {activeSubTab === 'orders' && (
          <div className="space-y-6 print:hidden">
            <div className="flex flex-col md:flex-row justify-between items-center px-4 gap-4">
              <div>
                <h3 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter">Radar de Producción</h3>
                <div className="flex items-center gap-2 mt-1">
                   <select value={selectedStoreFilter} onChange={e => setSelectedStoreFilter(e.target.value)} className="bg-transparent text-[9px] font-black text-slate-400 uppercase tracking-widest border-none outline-none cursor-pointer">
                      <option value="all">TODAS LAS SEDES</option>
                      {settings.stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                   </select>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                   <input className="w-full bg-white border-2 border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-[10px] font-bold uppercase outline-none focus:border-blue-900 transition-all" placeholder="BUSCAR..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                {isMasterMode && (
                  <button onClick={() => setIsCreatingOrder(true)} className="bg-blue-900 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
                    <Plus size={20}/> EMITIR ORDEN
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map(order => {
                const isPaid = order.remainingAmountUSD <= 0;
                const agent = settings.designers.find(d => d.id === order.assignedToId);
                const urgency = getUrgencyStatus(order.deliveryDate, order.status);
                const store = settings.stores.find(s => s.id === order.storeId);

                return (
                  <div key={order.id} className={`bg-white border-2 rounded-[45px] p-8 shadow-sm transition-all hover:border-blue-900 group relative overflow-hidden ${urgency.alert ? 'border-red-400 bg-red-50/30' : 'border-slate-100'}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Factory size={80}/></div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col gap-2">
                        <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black italic w-fit">{order.orderNumber}</span>
                        <span className="text-[8px] font-black text-blue-900 uppercase tracking-widest italic">{store?.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-300 uppercase">{new Date(order.createdAt).toLocaleDateString()}</p>
                        <p className={`text-[9px] font-black uppercase flex items-center justify-end gap-1 mt-1 ${urgency.color} ${urgency.alert ? 'animate-pulse font-black' : ''}`}>
                          <Clock size={10}/> {urgency.label}
                        </p>
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-blue-900 uppercase italic mb-1 tracking-tighter leading-none">{order.clientName}</h4>
                    <p className="text-[9px] font-black text-blue-900/60 uppercase italic tracking-widest flex items-center gap-1 mb-6"><UserCircle size={10}/> {agent?.name || 'SIN ASIGNAR'}</p>
                    
                    <div className="bg-slate-50 p-6 rounded-[35px] space-y-4">
                       <div className="flex justify-between items-end">
                          <p className="text-[8px] font-black text-slate-400 uppercase italic">Saldo Pendiente</p>
                          <p className={`text-xl font-black italic ${!isPaid ? 'text-red-600' : 'text-emerald-600'}`}>
                            {isPaid ? 'LIQUIDADO' : `$${(order.totalUSD - order.paidAmountUSD).toFixed(2)}`}
                          </p>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          <button onClick={() => setSelectedOrderForPDF(order)} className="flex-1 py-4 bg-slate-900 text-white rounded-[18px] font-black text-[9px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <Printer size={12}/> DOC
                          </button>
                          <button onClick={() => setReassigningOrder(order)} className="flex-1 py-4 bg-blue-100 text-blue-900 rounded-[18px] font-black text-[9px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <RefreshCw size={12}/> TRANSFERIR
                          </button>
                          {!isPaid && (
                            <button onClick={() => setIsRegisteringPayment(order)} className="flex-1 py-4 bg-emerald-600 text-white rounded-[18px] font-black text-[9px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all">
                              <DollarSign size={12}/> ABONO
                            </button>
                          )}
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EQUIPO TAB */}
        {activeSubTab === 'designers' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter">Equipo Operativo</h3>
              {isMasterMode && <button onClick={() => setIsAddingMember(true)} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase shadow-xl hover:scale-105 transition-all">NUEVO MIEMBRO</button>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {settings.designers.map(member => {
                const assignedTasks = orders.filter(o => (o.assignedToId === member.id || o.assignmentHistory?.some(h => h.agentId === member.id)) && o.status !== 'entregado' && o.status !== 'listo');
                const memberStore = settings.stores.find(s => s.id === member.assignedStoreId);
                
                return (
                  <div key={member.id} className="bg-white p-10 rounded-[50px] border-2 border-slate-100 shadow-sm flex flex-col gap-6 group hover:border-blue-900 transition-all">
                    <div className="flex items-center gap-5 border-b pb-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-[25px] flex items-center justify-center font-black text-2xl italic text-slate-600 shadow-inner group-hover:bg-blue-900 group-hover:text-white transition-all">{member.name[0]}</div>
                      <div className="flex-1 text-left">
                        <h5 className="font-black text-slate-900 uppercase italic text-lg leading-none">{member.name}</h5>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-2 italic tracking-widest">{member.role} | {member.specialty} | <span className="text-blue-900">{memberStore?.name}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setViewingHistoryMember(member)} className="p-4 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all" title="Ver Historial">
                          <History size={20}/>
                        </button>
                        {isMasterMode && (
                          <button onClick={() => {
                            if(confirm(`¿ELIMINAR A ${member.name} DEL EQUIPO?`)){
                              onUpdateSettings({...settings, designers: settings.designers.filter(d => d.id !== member.id)});
                            }
                          }} className="p-4 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Eliminar Agente">
                            <UserMinus size={20}/>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                       <h6 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-2 italic flex justify-between">
                         FLUJO DE TRABAJO <span>({assignedTasks.length})</span>
                       </h6>
                       <div className="space-y-4 max-h-80 overflow-y-auto no-scrollbar pr-2">
                          {assignedTasks.map(task => {
                             const urgency = getUrgencyStatus(task.deliveryDate, task.status);
                             const isCurrentResponsible = task.assignedToId === member.id;
                             return (
                             <div key={task.id} className={`p-6 rounded-[35px] border flex flex-col gap-4 hover:bg-white transition-all ${urgency.alert ? 'bg-red-50 border-red-200' : (isCurrentResponsible ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50 border-slate-100')}`}>
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-2">
                                      <p className="text-[11px] font-black text-slate-900 uppercase italic leading-none">{task.orderNumber}</p>
                                      {urgency.alert && <Bell size={12} className="text-red-600 animate-bounce"/>}
                                   </div>
                                   <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${task.status === 'pendiente' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{task.status.replace('_', ' ')}</span>
                                </div>
                                <div className="text-left">
                                  <p className="text-[12px] font-black text-slate-800 uppercase italic mb-1">{task.clientName}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase line-clamp-2 italic">"{task.jobDescription || 'Sin especificaciones'}"</p>
                                </div>
                                {isCurrentResponsible && (
                                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/50">
                                     {task.status === 'pendiente' ? (
                                       <button onClick={() => onUpdateOrderStatus(task.id, 'en_proceso')} className="flex-1 py-3 bg-blue-900 text-white rounded-xl font-black text-[8px] uppercase active:scale-95 transition-all flex items-center justify-center gap-2"><Play size={12}/> RECIBIR</button>
                                     ) : (
                                       <button onClick={() => onUpdateOrderStatus(task.id, 'listo')} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[8px] uppercase active:scale-95 transition-all flex items-center justify-center gap-2"><Check size={12}/> TERMINAR</button>
                                     )}
                                     <button onClick={() => setReassigningOrder(task)} className="p-3 bg-slate-200 text-slate-500 rounded-xl hover:bg-slate-300 transition-all" title="Transferir a otro Agente"><Share size={14}/></button>
                                     <button onClick={() => setSelectedOrderForPDF(task)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all" title="Ver Orden"><Eye size={14}/></button>
                                  </div>
                                )}
                             </div>
                          )})}
                          {assignedTasks.length === 0 && <p className="text-center text-slate-300 font-bold uppercase text-[9px] py-10 italic border border-dashed rounded-[35px]">Sin tareas en curso</p>}
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REPORTES TAB */}
        {activeSubTab === 'reports' && (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-center px-4 gap-4">
               <div>
                  <h3 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter">Tablero de Gestión</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Análisis Estratégico de Inversiones Roxtor</p>
               </div>
               <div className="flex flex-wrap gap-2 w-full md:w-auto">
                 <button onClick={downloadCSV} className="flex-1 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase flex items-center justify-center gap-2 shadow-lg"><FileDown size={16}/> DESCARGAR CSV</button>
                 <button onClick={() => setShowGlobalReportPDF(true)} className="flex-1 bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase flex items-center justify-center gap-2 shadow-lg"><Printer size={16}/> IMPRIMIR REPORTE PDF</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-slate-900 text-white p-8 rounded-[45px] space-y-2 shadow-xl border border-white/5 relative overflow-hidden group">
                  <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={100}/></div>
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic text-left">Facturación Bruta</p>
                  <h4 className="text-4xl font-black italic tracking-tighter text-left">${stats.totalUSD.toFixed(2)}</h4>
               </div>
               <div className="bg-white border-2 border-slate-100 p-8 rounded-[45px] space-y-2 shadow-sm relative overflow-hidden group">
                  <div className="absolute -bottom-4 -right-4 opacity-5 text-red-600 group-hover:scale-110 transition-transform"><AlertTriangle size={100}/></div>
                  <p className="text-[9px] font-black text-red-600 uppercase tracking-widest italic text-left">Cartera Pendiente</p>
                  <h4 className="text-4xl font-black italic tracking-tighter text-slate-900 text-left">${stats.accountsReceivable.toFixed(2)}</h4>
               </div>
               <div className="bg-white border-2 border-slate-100 p-8 rounded-[45px] space-y-2 shadow-sm relative overflow-hidden group">
                  <div className="absolute -bottom-4 -right-4 opacity-5 text-blue-900 group-hover:scale-110 transition-transform"><Factory size={100}/></div>
                  <p className="text-[9px] font-black text-blue-900 uppercase tracking-widest italic text-left">Producción Total</p>
                  <h4 className="text-4xl font-black italic tracking-tighter text-slate-900 text-left">{orders.length} <span className="text-sm">PED</span></h4>
               </div>
               <div className="bg-white border-2 border-slate-100 p-8 rounded-[45px] space-y-2 shadow-sm relative overflow-hidden group">
                  <div className="absolute -bottom-4 -right-4 opacity-5 text-emerald-600 group-hover:scale-110 transition-transform"><TrendingUp size={100}/></div>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic text-left">Tasa BCV</p>
                  <h4 className="text-4xl font-black italic tracking-tighter text-slate-900 text-left">{settings.currentBcvRate} <span className="text-sm">Bs.</span></h4>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white border-2 border-slate-100 rounded-[50px] p-10 shadow-sm space-y-8">
                  <h5 className="text-[11px] font-black text-blue-900 uppercase tracking-widest italic flex items-center gap-2"><MapPin size={16}/> Volumen por Sede</h5>
                  <div className="space-y-6">
                     {stats.storeStats.map(s => (
                       <div key={s.id} className="group">
                         <div className="flex justify-between items-end mb-2 px-2">
                           <div className="text-left">
                             <p className="font-black text-slate-900 uppercase italic text-sm">{s.name}</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase">{s.orderCount} Órdenes</p>
                           </div>
                           <p className="font-black text-blue-900 italic text-lg">${s.volumeUSD.toFixed(2)}</p>
                         </div>
                         <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                           <div className="bg-blue-900 h-full rounded-full transition-all duration-1000" style={{width: `${(s.volumeUSD / stats.totalUSD) * 100 || 0}%`}}></div>
                         </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="bg-white border-2 border-slate-100 rounded-[50px] p-10 shadow-sm space-y-8">
                  <h5 className="text-[11px] font-black text-blue-900 uppercase tracking-widest italic flex items-center gap-2"><Users size={16}/> Ranking de Producción</h5>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                     {stats.agentEffectiveness.sort((a,b) => b.effectiveness - a.effectiveness).map((a, i) => (
                       <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black italic">{i+1}</div>
                          <div className="flex-1 text-left">
                             <p className="font-black text-slate-800 uppercase italic text-xs leading-none">{a.name}</p>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{a.role}</p>
                          </div>
                          <div className="text-right">
                             <p className="font-black text-emerald-600 text-lg leading-none">{a.effectiveness.toFixed(0)}%</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 italic">${a.volumeUSD.toFixed(0)} Prod.</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* AJUSTES TAB */}
        {activeSubTab === 'profile' && isMasterMode && (
          <div className="space-y-12 pb-20">
            {/* IDENTIDAD */}
            <div className="bg-white border-2 border-slate-100 rounded-[50px] p-12 shadow-sm space-y-10 border-l-[20px] border-l-blue-900">
               <div className="flex items-center gap-4 border-b pb-6">
                 <Building2 className="text-blue-900" size={32}/>
                 <h4 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter">Identidad Corporativa</h4>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-6 text-center">
                    <div onClick={() => logoInputRef.current?.click()} className="aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group hover:border-blue-900 transition-all shadow-inner">
                      {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain p-4" /> : <div className="text-center p-6"><ImageIcon size={48} className="mx-auto text-blue-200 mb-2"/><p className="text-[8px] font-black uppercase text-slate-400">Cargar Logo</p></div>}
                      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={e => {
                        const f = e.target.files?.[0]; if(!f) return;
                        const r = new FileReader(); r.onloadend = () => onUpdateSettings({...settings, companyLogoUrl: r.result as string}); r.readAsDataURL(f);
                      }} />
                    </div>
                    <p className="text-[8px] font-black text-slate-400 uppercase italic tracking-widest">Logo Oficial</p>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2 text-left">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic tracking-widest">Nombre Comercial</label>
                           <input className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs uppercase outline-none shadow-sm" value={settings.companyName} onChange={e => onUpdateSettings({...settings, companyName: e.target.value})} />
                        </div>
                        <div className="space-y-2 text-left">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic tracking-widest">RIF Oficial</label>
                           <input className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs uppercase outline-none shadow-sm" value={settings.companyRif} onChange={e => onUpdateSettings({...settings, companyRif: e.target.value})} />
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2 text-left">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic tracking-widest">Instagram @</label>
                           <input className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs outline-none shadow-sm" value={settings.companyInstagram} onChange={e => onUpdateSettings({...settings, companyInstagram: e.target.value})} />
                        </div>
                        <div className="space-y-2 text-left">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic tracking-widest">WhatsApp Master</label>
                           <input className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs outline-none shadow-sm" value={settings.companyPhone} onChange={e => onUpdateSettings({...settings, companyPhone: e.target.value})} />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* CONFIGURACIÓN DE SEDES Y NÚMERO INICIAL */}
            <div className="bg-white border-2 border-slate-100 rounded-[50px] p-12 shadow-sm space-y-10 border-l-[20px] border-l-orange-500">
               <div className="flex items-center gap-4 border-b pb-6">
                 <Building2 className="text-orange-500" size={32}/>
                 <h4 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter">Gestión de Sedes y Correlativos</h4>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {settings.stores.map(store => (
                    <div key={store.id} className="bg-slate-50 p-8 rounded-[40px] space-y-6 shadow-inner border border-slate-200">
                       <div className="flex items-center justify-between">
                          <p className="text-[11px] font-black text-blue-900 uppercase italic">{store.name}</p>
                          <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-lg text-[8px] font-black">ID: {store.whatsappId}</span>
                       </div>
                       <div className="space-y-4">
                          <div className="space-y-2 text-left">
                             <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Nombre de Sede</label>
                             <input className="w-full bg-white p-4 rounded-xl font-bold text-xs uppercase outline-none shadow-sm" value={store.name} onChange={e => updateStoreConfig(store.id, { name: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2 text-left">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Letra Identificadora</label>
                                <input className="w-full bg-white p-4 rounded-xl font-black text-center text-xs uppercase outline-none shadow-sm" maxLength={2} value={store.whatsappId} onChange={e => updateStoreConfig(store.id, { whatsappId: e.target.value.toUpperCase() })} />
                             </div>
                             <div className="space-y-2 text-left">
                                <label className="text-[9px] font-black text-orange-600 uppercase ml-2">Correlativo Actual</label>
                                <input type="number" className="w-full bg-white p-4 rounded-xl font-black text-center text-xs outline-none shadow-sm border border-orange-100" value={store.lastOrderNumber} onChange={e => updateStoreConfig(store.id, { lastOrderNumber: Number(e.target.value) })} />
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* SYNC HUB */}
            <div className="bg-white border-2 border-slate-100 rounded-[50px] p-12 shadow-sm space-y-10 border-l-[20px] border-l-emerald-600">
               <div className="flex items-center gap-4 border-b pb-6">
                 <Zap className="text-emerald-600" size={32}/>
                 <h4 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter">Sincronización Roxtor (PC/Móvil)</h4>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-slate-900 p-10 rounded-[45px] space-y-6 text-white relative overflow-hidden">
                     <div className="absolute -bottom-4 -right-4 opacity-5"><Monitor size={120}/></div>
                     <p className="text-xs font-bold text-slate-300 italic text-left">Exporte la base de datos maestra para actualizar todos los terminales de Roxtor de manera manual.</p>
                     <button onClick={handleExportData} className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition-all">
                        <Download size={18}/> EXPORTAR MAESTRO (.JSON)
                     </button>
                  </div>
                  <div className="bg-emerald-50 p-10 rounded-[45px] space-y-6 border-2 border-emerald-100 relative overflow-hidden">
                     <div className="absolute -bottom-4 -right-4 opacity-10"><RefreshCw size={120}/></div>
                     <p className="text-xs font-bold text-slate-600 italic text-left">Importe el archivo maestro recibido de la PC Principal para sincronizar ventas y taller.</p>
                     <button onClick={() => importInputRef.current?.click()} className="w-full bg-white border-2 border-emerald-600 text-emerald-600 py-6 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 shadow-sm hover:bg-emerald-600 hover:text-white transition-all">
                        <Upload size={18}/> IMPORTAR Y SINCRONIZAR
                     </button>
                     <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportData} />
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CREAR ÓRDEN CON CARGA DE IMAGEN */}
      {isCreatingOrder && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[400] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-[60px] w-full max-w-6xl p-12 space-y-10 shadow-2xl my-10 animate-in zoom-in duration-300">
             <div className="flex justify-between items-center border-b pb-8">
                <h3 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Nueva Órden de Producción</h3>
                <button onClick={() => setIsCreatingOrder(false)} className="p-4 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-md"><X size={24}/></button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                   <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-[0.3em] italic border-l-[6px] border-blue-900 pl-4 text-left">Ficha del Cliente</h4>
                   <div className="grid grid-cols-1 gap-5">
                      <input placeholder="NOMBRE COMPLETO / EMPRESA" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-xs uppercase outline-none shadow-sm" value={newOrder.clientName} onChange={e => setNewOrder({...newOrder, clientName: e.target.value})} />
                      <div className="grid grid-cols-2 gap-5">
                        <input placeholder="RIF / CI" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-xs outline-none shadow-sm" value={newOrder.clientDoc} onChange={e => setNewOrder({...newOrder, clientDoc: e.target.value})} />
                        <input placeholder="TELÉFONO WHATSAPP" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-xs outline-none shadow-sm" value={newOrder.clientPhone} onChange={e => setNewOrder({...newOrder, clientPhone: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-3 gap-5">
                         <div className="space-y-2 text-left">
                           <label className="text-[8px] font-black text-slate-400 uppercase ml-2 italic">SEDE</label>
                           <select className="w-full bg-slate-50 p-6 rounded-2xl font-black text-[10px] outline-none shadow-sm uppercase italic cursor-pointer" value={newOrder.storeId} onChange={e => setNewOrder({...newOrder, storeId: e.target.value})}>
                              {settings.stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                           </select>
                         </div>
                         <div className="space-y-2 text-left">
                           <label className="text-[8px] font-black text-slate-400 uppercase ml-2 italic">ESPECIALISTA</label>
                           <select className="w-full bg-slate-50 p-6 rounded-2xl font-black text-[10px] outline-none shadow-sm uppercase italic cursor-pointer" value={newOrder.assignedToId} onChange={e => setNewOrder({...newOrder, assignedToId: e.target.value})}>
                              <option value="">SIN ASIGNAR</option>
                              {settings.designers.map(d => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
                           </select>
                         </div>
                         <div className="space-y-2 text-left">
                           <label className="text-[8px] font-black text-slate-400 uppercase ml-2 italic">ENTREGA</label>
                           <input type="date" className="w-full bg-slate-50 p-6 rounded-2xl font-black text-[10px] outline-none shadow-sm" value={newOrder.deliveryDate} onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} />
                         </div>
                      </div>
                   </div>

                   <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-[0.3em] italic border-l-[6px] border-blue-900 pl-4 pt-6 text-left">Detalle Técnico / Imágenes de Referencia</h4>
                   <textarea placeholder="ESPECIFIQUE EL TRABAJO, TELAS, COLORES..." className="w-full bg-slate-50 p-8 rounded-[40px] font-bold text-xs outline-none min-h-[150px] shadow-inner uppercase italic border-2 border-transparent focus:border-blue-900 transition-all resize-none mb-4" value={newOrder.jobDescription} onChange={e => setNewOrder({...newOrder, jobDescription: e.target.value})} />
                   
                   <div className="grid grid-cols-4 gap-4">
                      {newOrder.referenceImages?.map((img, i) => (
                        <div key={i} className="aspect-square bg-slate-100 rounded-2xl relative group overflow-hidden border">
                           <img src={img} className="w-full h-full object-cover" alt="ref"/>
                           <button onClick={() => {
                             const upd = (newOrder.referenceImages || []).filter((_, idx) => idx !== i);
                             setNewOrder({...newOrder, referenceImages: upd});
                           }} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={12}/></button>
                        </div>
                      ))}
                      <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-blue-900 transition-all group">
                        <Camera size={24} className="text-slate-300 group-hover:text-blue-900"/>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const f = e.target.files?.[0]; if(!f) return;
                          const r = new FileReader(); r.onloadend = () => {
                            setNewOrder({...newOrder, referenceImages: [...(newOrder.referenceImages || []), r.result as string]});
                          }; r.readAsDataURL(f);
                        }} />
                      </label>
                   </div>
                </div>

                <div className="space-y-8">
                   <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-[0.3em] italic border-l-[6px] border-blue-900 pl-4 text-left">Cotización Detallada</h4>
                   <div className="max-h-64 overflow-y-auto space-y-4 pr-3 no-scrollbar">
                      {newOrder.items?.map((it, idx) => (
                        <div key={idx} className="flex gap-4 items-center bg-white p-6 rounded-[40px] border-2 border-slate-50 shadow-sm relative group transition-all hover:border-blue-100">
                           <div className="flex-1 space-y-3">
                              <select className="w-full bg-slate-50 p-4 rounded-2xl font-black text-[10px] uppercase outline-none shadow-sm" onChange={e => {
                                const p = products.find(prod => prod.id === e.target.value);
                                if (p) {
                                  const upd = [...(newOrder.items || [])]; upd[idx] = { ...upd[idx], name: p.name, price: p.price, productId: p.id }; setNewOrder({...newOrder, items: upd});
                                }
                              }}>
                                <option value="">IMPORTAR PRODUCTO STOCK...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>)}
                              </select>
                              <input placeholder="DETALLE..." className="w-full bg-transparent font-black text-[11px] uppercase outline-none px-4 text-left" value={it.name} onChange={e => {
                                const upd = [...(newOrder.items || [])]; upd[idx].name = e.target.value; setNewOrder({...newOrder, items: upd});
                              }} />
                           </div>
                           <div className="flex gap-4">
                              <input type="number" className="w-16 bg-slate-50 p-5 rounded-2xl font-black text-center text-xs" value={it.quantity} onChange={e => {
                                const upd = [...(newOrder.items || [])]; upd[idx].quantity = Number(e.target.value); setNewOrder({...newOrder, items: upd});
                              }} />
                              <input type="number" className="w-20 bg-slate-50 p-5 rounded-2xl font-black text-center text-xs" value={it.price} onChange={e => {
                                const upd = [...(newOrder.items || [])]; upd[idx].price = Number(e.target.value); setNewOrder({...newOrder, items: upd});
                              }} />
                           </div>
                        </div>
                      ))}
                      <button onClick={() => setNewOrder({...newOrder, items: [...(newOrder.items || []), {name: '', quantity: 1, price: 0}]})} className="w-full py-6 bg-slate-50 rounded-[35px] text-[10px] font-black uppercase text-slate-400 border-2 border-dashed border-slate-200 hover:bg-white hover:border-blue-900 transition-all tracking-widest">AÑADIR ÍTEM</button>
                   </div>
                   
                   <div className="bg-slate-900 p-12 rounded-[55px] text-white shadow-2xl relative overflow-hidden space-y-8">
                      <div className="flex justify-between items-center">
                         <div className="text-left">
                            <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] italic">Monto Abono</p>
                            <div className="flex items-center gap-4 mt-4">
                              <DollarSign className="text-white/30" size={28}/>
                              <input type="number" className="bg-white/10 text-center w-40 p-6 rounded-3xl outline-none text-white font-black text-4xl shadow-inner border border-white/5" value={initialPayment.amountUSD} onChange={e => setInitialPayment({...initialPayment, amountUSD: Number(e.target.value)})} />
                            </div>
                         </div>
                         <div className="text-right">
                            <span className="text-[11px] font-black uppercase italic text-white tracking-[0.4em] opacity-50">VALOR ÓRDEN</span>
                            <p className="text-6xl font-black italic text-blue-400 leading-none mt-4 tracking-tighter">
                              ${(newOrder.items?.reduce((acc, it) => acc + (it.price * it.quantity), 0) || 0).toFixed(2)}
                            </p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                        <select className="flex-1 bg-white/10 p-5 rounded-2xl font-black text-[10px] uppercase outline-none text-blue-200" value={initialPayment.method} onChange={e => setInitialPayment({...initialPayment, method: e.target.value as any})}>
                           <option value="Dólares Efectivo">DÓLARES ($)</option>
                           <option value="Pago Móvil">PAGO MÓVIL (BS)</option>
                           <option value="Transferencia">TRANSFERENCIA (BS)</option>
                           <option value="Punto de Venta">PUNTO VENTA (BS)</option>
                           <option value="Efectivo BS">EFECTIVO (BS)</option>
                        </select>
                        <input placeholder="REF #" className="flex-1 bg-white/10 p-5 rounded-2xl font-black text-[10px] uppercase outline-none text-white placeholder-white/20" value={initialPayment.reference} onChange={e => setInitialPayment({...initialPayment, reference: e.target.value})}/>
                      </div>
                   </div>
                   <button onClick={handleCreateOrderSubmit} className="w-full bg-blue-900 text-white py-10 rounded-[40px] font-black uppercase text-sm shadow-2xl tracking-[0.8em] active:scale-95 transition-all flex items-center justify-center gap-5 hover:bg-blue-800">
                     <Save size={28}/> CONSOLIDAR ÓRDEN
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL PDF ÓRDEN CON REFERENCIAS BANCARIAS */}
      {selectedOrderForPDF && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[500] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[45px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden my-10 print:m-0 print:shadow-none print:rounded-none">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50 print:hidden">
               <h3 className="text-xl font-black text-blue-900 uppercase italic tracking-tighter">Expediente Taller</h3>
               <div className="flex gap-2">
                 <button onClick={handlePrint} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all"><Printer size={18}/> IMPRIMIR</button>
                 <button onClick={() => setSelectedOrderForPDF(null)} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={20}/></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0">
               <div className="max-w-3xl mx-auto border-[12px] border-slate-900 p-12 rounded-sm bg-white min-h-[1100px] flex flex-col print:border-4">
                  <div className="flex justify-between items-start mb-12 border-b-8 border-slate-900 pb-12">
                     <div className="flex items-center gap-8">
                        {logoUrl ? <img src={logoUrl} className="w-24 h-24 object-contain" /> : <div className="bg-blue-900 w-24 h-24 rounded-3xl flex items-center justify-center text-white font-black text-6xl italic shadow-2xl">R</div>}
                        <div className="space-y-1 text-left">
                           <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">{settings.companyName}</h2>
                           <p className="text-[11px] font-black text-red-600 uppercase tracking-[0.5em] italic">Soluciones Creativas</p>
                           <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">RIF: {settings.companyRif}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-red-600 font-black text-lg uppercase italic tracking-widest leading-none mb-4">Entrega: {selectedOrderForPDF.deliveryDate || 'INMEDIATA'}</p>
                        <div className="bg-slate-900 text-white px-8 py-3 mb-3 font-black italic text-[12px] uppercase tracking-[0.3em]">RECIBO DE SERVICIO</div>
                        <p className="text-3xl font-black text-slate-900 uppercase tracking-tighter">#{selectedOrderForPDF.orderNumber}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 mb-12 bg-slate-50 p-12 rounded-[40px] border-l-[25px] border-blue-900 print:bg-white print:border-l-8">
                     <div className="space-y-4 text-left">
                        <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-200 pb-3 italic">DATOS DEL CLIENTE</h4>
                        <p className="text-4xl font-black text-slate-900 uppercase italic leading-none tracking-tighter mb-2">{selectedOrderForPDF.clientName}</p>
                        <p className="text-[14px] font-bold text-slate-600 uppercase tracking-widest">RIF/CED: {selectedOrderForPDF.clientDoc}</p>
                        <p className="text-[14px] font-bold text-slate-600 uppercase tracking-widest">WhatsApp: {selectedOrderForPDF.clientPhone}</p>
                     </div>
                     <div className="text-right space-y-4">
                        <p className="text-[11px] font-black text-blue-900 italic uppercase tracking-widest">Sede: {settings.stores.find(s=>s.id===selectedOrderForPDF.storeId)?.name}</p>
                        <div className="pt-6 border-t border-slate-200">
                           <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-[0.4em] italic">HISTORIAL DE ESPECIALISTAS</p>
                           <div className="flex flex-wrap gap-2 justify-end">
                              {selectedOrderForPDF.assignmentHistory?.map((h, i) => (
                                 <span key={i} className="bg-slate-900 text-white text-[8px] px-4 py-1.5 rounded-xl uppercase font-black italic shadow-md tracking-widest">{h.agentName} ({h.role})</span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  {selectedOrderForPDF.referenceImages && selectedOrderForPDF.referenceImages.length > 0 && (
                    <div className="mb-12 text-left">
                       <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-200 pb-3 italic mb-4">IMÁGENES DE REFERENCIA</h4>
                       <div className="grid grid-cols-3 gap-4">
                          {selectedOrderForPDF.referenceImages.map((img, i) => (
                            <img key={i} src={img} className="w-full aspect-square object-cover bg-slate-50 rounded-2xl border p-1" />
                          ))}
                       </div>
                    </div>
                  )}

                  <div className="mb-12 text-left">
                     <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-200 pb-3 italic mb-4">ESPECIFICACIÓN TÉCNICA</h4>
                     <p className="text-xl font-bold text-slate-800 uppercase italic leading-relaxed whitespace-pre-wrap">{selectedOrderForPDF.jobDescription || 'Sin especificaciones.'}</p>
                  </div>

                  <table className="w-full mb-16 border-collapse">
                     <thead className="border-b-[6px] border-slate-900">
                        <tr className="text-[14px] font-black text-slate-900 uppercase italic text-left">
                           <th className="pb-8">CANT</th>
                           <th className="pb-8">DETALLE</th>
                           <th className="pb-8 text-right">TOTAL ($)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y-4 divide-slate-50">
                        {selectedOrderForPDF.items.map((it, i) => (
                           <tr key={i} className="text-[20px] font-bold text-slate-700">
                              <td className="py-10 font-black text-3xl text-slate-900 text-left">{it.quantity}</td>
                              <td className="py-10 uppercase font-black text-slate-900 italic tracking-tighter text-left">{it.name}</td>
                              <td className="py-10 text-right font-black text-slate-900 italic tracking-tighter text-3xl">${(it.quantity * it.price).toFixed(2)}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  {/* SECCIÓN DE PAGOS CON REFERENCIA */}
                  <div className="mb-12 text-left">
                     <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-200 pb-3 italic mb-4">PAGOS REGISTRADOS</h4>
                     {selectedOrderForPDF.payments.map((p, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-slate-100 py-4">
                           <div className="flex flex-col">
                             <span className="font-black text-slate-800 uppercase italic text-sm">{p.method}</span>
                             {p.reference && (
                               <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest italic">REFERENCIA: {p.reference}</span>
                             )}
                           </div>
                           <div className="text-right">
                              <p className="font-black text-slate-900 italic text-xl">${p.amountUSD.toFixed(2)}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(p.date).toLocaleString()}</p>
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="mt-auto border-t-8 border-slate-900 pt-16 flex justify-end">
                     <div className="w-96 space-y-8">
                        <div className="flex justify-between text-[16px] font-black text-slate-400 italic border-b-2 border-slate-50 pb-5 tracking-[0.2em]">
                           <span>VALOR TOTAL:</span>
                           <span className="text-slate-900">${selectedOrderForPDF.totalUSD.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[26px] font-black text-red-600 italic border-b-[12px] border-red-50 pb-8 tracking-tighter">
                           <span>SALDO PENDIENTE:</span>
                           <span className="text-5xl font-black">${(selectedOrderForPDF.totalUSD - selectedOrderForPDF.paidAmountUSD).toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-900 p-12 rounded-[55px] text-center text-white shadow-2xl space-y-5 print:bg-white print:text-black print:border-[6px] print:shadow-none">
                           <span className="text-[12px] font-black text-blue-400 uppercase tracking-[0.6em] italic print:text-slate-400">LIQUIDACIÓN BS. (BCV {selectedOrderForPDF.exchangeRateUsed})</span>
                           <h5 className="text-6xl font-black italic tracking-tighter leading-none">{(selectedOrderForPDF.totalUSD * selectedOrderForPDF.exchangeRateUsed).toLocaleString('de-DE', {minimumFractionDigits: 2})} Bs.</h5>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL REPORT PDF */}
      {showGlobalReportPDF && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[500] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[45px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden my-10 print:m-0 print:shadow-none print:rounded-none">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50 print:hidden">
               <h3 className="text-xl font-black text-blue-900 uppercase italic tracking-tighter">Reporte General de Operaciones</h3>
               <div className="flex gap-2">
                 <button onClick={handlePrint} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all"><Printer size={18}/> IMPRIMIR PDF</button>
                 <button onClick={() => setShowGlobalReportPDF(false)} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={20}/></button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0">
               <div className="max-w-3xl mx-auto border-[10px] border-slate-900 p-12 rounded-sm bg-white min-h-[1000px] flex flex-col print:border-4">
                  <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-10">
                     <div className="flex items-center gap-8">
                        {logoUrl ? <img src={logoUrl} className="w-24 h-24 object-contain" /> : <div className="bg-blue-900 w-24 h-24 rounded-3xl flex items-center justify-center text-white font-black text-6xl italic shadow-2xl">R</div>}
                        <div className="space-y-1 text-left">
                           <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">{settings.companyName}</h2>
                           <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] italic text-left">Soluciones Creativas</p>
                           <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest text-left">RIF: {settings.companyRif}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="bg-slate-900 text-white px-6 py-2 mb-2 font-black italic text-[11px] uppercase tracking-widest">REPORTE CONSOLIDADO</div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase italic">Emitido: {new Date().toLocaleString()}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-12">
                     <div className="bg-slate-900 text-white p-10 rounded-[40px] space-y-2 text-left">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] italic">FACTURACIÓN BRUTA TOTAL</p>
                        <h4 className="text-5xl font-black italic tracking-tighter">${stats.totalUSD.toFixed(2)}</h4>
                     </div>
                     <div className="bg-red-600 text-white p-10 rounded-[40px] space-y-2 text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] italic opacity-80">POR COBRAR</p>
                        <h4 className="text-5xl font-black italic tracking-tighter">${stats.accountsReceivable.toFixed(2)}</h4>
                     </div>
                  </div>

                  <div className="space-y-8 mb-12 text-left">
                     <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em] border-b-4 border-slate-900 pb-2 italic">DESEMPEÑO POR SEDE</h4>
                     {stats.storeStats.map(s => (
                        <div key={s.id} className="flex justify-between items-center border-b border-slate-100 py-6">
                           <span className="font-black text-slate-700 uppercase italic text-lg">{s.name}</span>
                           <div className="text-right">
                              <p className="font-black text-slate-900 text-xl">${s.volumeUSD.toFixed(2)}</p>
                              <p className="text-[9px] font-bold text-red-500 uppercase italic">Pendiente: ${s.pending.toFixed(2)}</p>
                           </div>
                        </div>
                      ))}
                  </div>

                  <div className="space-y-8 mb-12 text-left">
                     <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em] border-b-4 border-slate-900 pb-2 italic">RENDIMIENTO EQUIPO</h4>
                     {stats.agentEffectiveness.sort((a,b) => b.volumeUSD - a.volumeUSD).map((a, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-slate-100 py-4">
                           <div>
                             <span className="font-black text-slate-800 uppercase italic">{a.name}</span>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{a.role}</p>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-slate-900">${a.volumeUSD.toFixed(2)}</p>
                              <p className="text-[9px] font-bold text-emerald-600 uppercase italic">{a.effectiveness.toFixed(0)}% Eficacia</p>
                           </div>
                        </div>
                      ))}
                  </div>

                  <div className="mt-auto pt-10 border-t-2 border-slate-100 text-center opacity-70">
                     <p className="text-[11px] font-black uppercase italic tracking-[0.5em] text-blue-900">{settings.companyName}</p>
                     <p className="text-[10px] font-bold uppercase italic mt-1">Gracias por Preferirnos - Instagram @{settings.companyInstagram}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRANSFERENCIA */}
      {reassigningOrder && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[600] flex items-center justify-center p-6">
          <div className="bg-white rounded-[50px] w-full max-w-lg p-12 space-y-10 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center border-b pb-6">
                <div className="text-left">
                   <h3 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Transferir Órden</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Ref: {reassigningOrder.orderNumber}</p>
                </div>
                <button onClick={() => setReassigningOrder(null)} className="p-4 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-md"><X size={24}/></button>
             </div>
             <div className="space-y-4 max-h-96 overflow-y-auto pr-2 no-scrollbar">
                <p className="text-[11px] font-black text-slate-400 uppercase italic tracking-widest mb-4 text-center">Seleccione el Nuevo Especialista:</p>
                {settings.designers.filter(d => d.id !== reassigningOrder.assignedToId).map(designer => (
                  <button key={designer.id} onClick={() => handleReassign(designer.id)} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[35px] flex items-center justify-between group hover:border-blue-900 hover:bg-white transition-all">
                     <div className="text-left flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 text-blue-900 rounded-2xl flex items-center justify-center font-black italic">{designer.name[0]}</div>
                        <div className="text-left">
                           <p className="font-black text-slate-900 uppercase italic text-sm leading-none mb-1">{designer.name}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{designer.role} - {designer.specialty}</p>
                        </div>
                     </div>
                     <ChevronRight className="text-slate-300 group-hover:text-blue-900" size={20}/>
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL MIEMBRO */}
      {viewingHistoryMember && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[600] flex items-center justify-center p-6">
          <div className="bg-white rounded-[50px] w-full max-w-2xl p-12 space-y-10 shadow-2xl animate-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
             <div className="flex justify-between items-center border-b pb-6 shrink-0">
                <div className="text-left">
                   <h3 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Historial de Producción</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">{viewingHistoryMember.name}</p>
                </div>
                <button onClick={() => setViewingHistoryMember(null)} className="p-4 bg-slate-100 rounded-full hover:bg-red-50 transition-all shadow-md"><X size={24}/></button>
             </div>
             <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-2">
                {orders.filter(o => o.assignmentHistory?.some(h => h.agentId === viewingHistoryMember.id)).length > 0 ? (
                  orders.filter(o => o.assignmentHistory?.some(h => h.agentId === viewingHistoryMember.id))
                    .sort((a,b) => b.createdAt.localeCompare(a.createdAt))
                    .map(order => {
                      const myPassage = order.assignmentHistory?.find(h => h.agentId === viewingHistoryMember.id);
                      return (
                        <div key={order.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[40px] flex justify-between items-center hover:bg-white transition-all group shadow-sm text-left">
                           <div>
                              <p className="font-black text-slate-900 uppercase italic leading-none mb-1 text-xl">{order.orderNumber}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase italic">{order.clientName}</p>
                              <div className="flex items-center gap-2 mt-4 text-blue-900">
                                 <Clock size={12}/>
                                 <p className="text-[9px] font-black uppercase italic tracking-widest">Actividad: {new Date(myPassage?.assignedAt || '').toLocaleString()}</p>
                              </div>
                           </div>
                           <div className="text-right flex flex-col items-end gap-3">
                              <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${order.status === 'entregado' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                 {order.status}
                              </span>
                              <p className="text-xl font-black text-slate-900 italic tracking-tighter">${order.totalUSD.toFixed(2)}</p>
                           </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-24 bg-slate-50 rounded-[45px] border-2 border-dashed border-slate-200">
                     <History className="mx-auto text-slate-200 mb-6" size={72}/>
                     <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Sin historial disponible</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR MIEMBRO */}
      {isAddingMember && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[450] flex items-center justify-center p-6">
           <div className="bg-white rounded-[55px] w-full max-w-lg p-12 space-y-10 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b pb-8">
                 <h3 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Alta de Personal</h3>
                 <button onClick={() => setIsAddingMember(false)} className="p-4 bg-slate-100 rounded-full hover:bg-red-50 transition-all shadow-md"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                 <input placeholder="NOMBRE COMPLETO" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-sm uppercase outline-none focus:bg-white border-2 border-transparent focus:border-blue-900 shadow-sm" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                 <div className="grid grid-cols-2 gap-5">
                    <select className="w-full bg-slate-50 p-6 rounded-3xl font-black text-[10px] uppercase outline-none shadow-sm cursor-pointer border-2 border-transparent focus:border-blue-900" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value as any})}>
                       <option value="agente">ASESOR VENTAS</option>
                       <option value="diseñador">DISEÑO GRÁFICO</option>
                       <option value="costura">COSTURA PROFESIONAL</option>
                       <option value="taller">OPERADOR TALLER</option>
                       <option value="otro">OPERACIONES</option>
                    </select>
                    <select className="w-full bg-slate-50 p-6 rounded-3xl font-black text-[10px] uppercase outline-none shadow-sm cursor-pointer border-2 border-transparent focus:border-blue-900" value={newMember.assignedStoreId} onChange={e => setNewMember({...newMember, assignedStoreId: e.target.value})}>
                       {settings.stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                    </select>
                 </div>
                 <input placeholder="ESPECIALIDAD" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-sm uppercase outline-none focus:bg-white border-2 border-transparent focus:border-blue-900 shadow-sm" value={newMember.specialty} onChange={e => setNewMember({...newMember, specialty: e.target.value})} />
                 <input placeholder="WHATSAPP (58XXXXXXXXXX)" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-sm outline-none focus:bg-white border-2 border-transparent focus:border-blue-900 shadow-sm" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
                 <button onClick={() => {
                   if (!newMember.name) return alert("Nombre obligatorio");
                   onUpdateSettings({ ...settings, designers: [...settings.designers, { ...newMember, id: Date.now().toString() } as Designer] });
                   setIsAddingMember(false);
                 }} className="w-full bg-blue-900 text-white py-8 rounded-[35px] font-black uppercase text-xs shadow-2xl tracking-[0.5em] transition-all active:scale-95 hover:bg-blue-800">ACTIVAR PERSONAL</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL ABONO */}
      {isRegisteringPayment && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[450] flex items-center justify-center p-6">
           <div className="bg-white rounded-[55px] w-full max-w-lg p-12 space-y-10 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b pb-8">
                 <div className="text-left">
                    <h3 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Registrar Abono</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Ref: {isRegisteringPayment.orderNumber}</p>
                 </div>
                 <button onClick={() => setIsRegisteringPayment(null)} className="p-4 bg-slate-100 rounded-full hover:bg-red-50 transition-all shadow-md"><X size={24}/></button>
              </div>
              <div className="space-y-8">
                 <div className="bg-red-50 p-10 rounded-[40px] border-2 border-red-100 text-center shadow-inner relative overflow-hidden">
                    <p className="text-[11px] font-black text-red-600 uppercase tracking-[0.4em] mb-2 italic opacity-60">BALANCE PENDIENTE</p>
                    <h4 className="text-6xl font-black text-red-600 italic tracking-tighter relative z-10">${(isRegisteringPayment.totalUSD - isRegisteringPayment.paidAmountUSD).toFixed(2)}</h4>
                    <DollarSign className="absolute -bottom-4 -left-4 text-red-100/50" size={120}/>
                 </div>
                 <div className="space-y-6">
                    <input type="number" step="0.01" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-4xl text-center outline-none border-2 border-transparent focus:border-blue-900 shadow-sm" placeholder="0.00" value={additionalPayment.amountUSD || ''} onChange={e => setAdditionalPayment({...additionalPayment, amountUSD: Number(e.target.value)})} />
                    <div className="grid grid-cols-2 gap-5">
                       <select className="w-full bg-slate-50 p-7 rounded-3xl font-black text-[10px] uppercase outline-none shadow-sm cursor-pointer" value={additionalPayment.method} onChange={e => setAdditionalPayment({...additionalPayment, method: e.target.value as any})}>
                          <option value="Dólares Efectivo">DÓLARES ($)</option>
                          <option value="Pago Móvil">PAGO MÓVIL (BS)</option>
                          <option value="Transferencia">TRANSFERENCIA (BS)</option>
                          <option value="Punto de Venta">PUNTO VENTA (BS)</option>
                          <option value="Efectivo BS">EFECTIVO (BS)</option>
                       </select>
                       <input placeholder="REF #" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-xs uppercase outline-none border-2 border-transparent focus:border-blue-900 shadow-sm" value={additionalPayment.reference} onChange={e => setAdditionalPayment({...additionalPayment, reference: e.target.value})} />
                    </div>
                 </div>
                 <button onClick={() => {
                   if (!isRegisteringPayment || !additionalPayment.amountUSD) return;
                   const newP: PaymentRecord = {
                     id: Date.now().toString(),
                     amountUSD: additionalPayment.amountUSD,
                     method: additionalPayment.method as any,
                     reference: additionalPayment.reference,
                     date: new Date().toISOString()
                   };
                   onUpdateOrderPayments(isRegisteringPayment.id, [...isRegisteringPayment.payments, newP]);
                   setIsRegisteringPayment(null);
                   setAdditionalPayment({ amountUSD: 0, method: 'Dólares Efectivo', reference: '' });
                 }} className="w-full bg-emerald-600 text-white py-9 rounded-[40px] font-black uppercase text-[10px] shadow-2xl tracking-[0.6em] active:scale-95 transition-all">CONSOLIDAR ABONO</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default OperationsManager;
