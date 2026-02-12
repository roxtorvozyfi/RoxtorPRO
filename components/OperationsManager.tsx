
import React, { useState, useMemo, useRef } from 'react';
import { Order, Product, AppSettings, Designer, PaymentRecord, AssignmentLog } from '../types';
import { 
  ClipboardList, Plus, Key, BarChart3, LayoutDashboard, Printer, FileText, 
  X, Save, Users, Calendar, MessageCircle, DollarSign, Image as ImageIcon,
  CheckCircle, History, CreditCard, ArrowUpRight, Share2, Trash2, MapPin, 
  ShieldCheck, UserCircle, Briefcase, Phone, Play, Check, Bell, Activity, 
  Sparkles, TrendingUp, Clock, Camera, Trash, Upload, Instagram, ChevronRight, 
  FileDown, Download, Database, RefreshCw, AlertTriangle, Smartphone, Zap, Search,
  Eye, Filter, TrendingDown
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
    link.download = `ROXTOR_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (confirm('¿IMPORTAR DATOS? Esto sobrescribirá la información actual.')) {
          localStorage.setItem('roxtor_orders', JSON.stringify(data.orders));
          localStorage.setItem('roxtor_catalog', JSON.stringify(data.products));
          localStorage.setItem('roxtor_settings', JSON.stringify(data.settings));
          window.location.reload();
        }
      } catch (err) { alert('Error al leer el archivo.'); }
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
      referenceImages: newOrder.referenceImages,
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
    if (!searchTerm) return orders;
    return orders.filter(o => 
      o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const stats = useMemo(() => {
    const totalUSD = orders.reduce((acc, o) => acc + o.totalUSD, 0);
    const accountsReceivable = orders.reduce((acc, o) => acc + o.remainingAmountUSD, 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlySales: Record<string, number> = {};
    orders.forEach(o => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlySales[key] = (monthlySales[key] || 0) + o.totalUSD;
    });

    const storeStats = settings.stores.map(s => {
      const sOrders = orders.filter(o => o.storeId === s.id);
      return { 
        ...s, 
        volumeUSD: sOrders.reduce((acc, o) => acc + o.totalUSD, 0), 
        /* Fix: Removed explicit type argument from reduce to prevent untyped function call error */
        pending: sOrders.reduce((acc, o) => acc + o.remainingAmountUSD, 0),
        orderCount: sOrders.length
      };
    });

    const agentEffectiveness = settings.designers.map(d => {
      // Un agente es efectivo si participó en el trabajo (está en el historial de asignación)
      const dOrders = orders.filter(o => o.assignmentHistory?.some(h => h.agentId === d.id));
      const completed = dOrders.filter(o => o.status === 'entregado' || o.status === 'listo').length;
      return { 
        id: d.id,
        name: d.name, 
        role: d.role, 
        effectiveness: dOrders.length > 0 ? (completed / dOrders.length) * 100 : 0, 
        totalAssigned: dOrders.length,
        /* Fix: Removed explicit type argument from reduce to prevent untyped function call error */
        volumeUSD: dOrders.reduce((acc, o) => acc + o.totalUSD, 0)
      };
    });

    return { totalUSD, accountsReceivable, storeStats, agentEffectiveness, monthlySales };
  }, [orders, settings.stores, settings.designers]);

  const shareReportViaWhatsApp = () => {
    const text = `*📊 REPORTE MAESTRO ROXTOR*%0A_Soluciones Creativas_%0A%0A*Ventas Totales:* $${stats.totalUSD.toFixed(2)}%0A*Por Cobrar:* $${stats.accountsReceivable.toFixed(2)}%0A%0A*Rendimiento Sedes:*%0A${stats.storeStats.map(s => `- ${s.name}: $${s.volumeUSD.toFixed(2)} (Pendiente: $${s.pending.toFixed(2)})`).join('%0A')}%0A%0A_Generado: ${new Date().toLocaleString()}_`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

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
        
        {/* ÓRDENES */}
        {activeSubTab === 'orders' && (
          <div className="space-y-6 print:hidden">
            <div className="flex flex-col md:flex-row justify-between items-center px-4 gap-4">
              <div>
                <h3 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter">Radar de Producción</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Inversiones Roxtor - Soluciones Creativas</p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                   <input className="w-full bg-white border-2 border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-[10px] font-bold uppercase outline-none focus:border-blue-900 transition-all" placeholder="BUSCAR..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => setIsCreatingOrder(true)} className="bg-blue-900 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
                  <Plus size={20}/> EMITIR ORDEN
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map(order => {
                const isPaid = order.remainingAmountUSD <= 0;
                const agent = settings.designers.find(d => d.id === order.assignedToId);
                const urgency = getUrgencyStatus(order.deliveryDate, order.status);

                return (
                  <div key={order.id} className={`bg-white border-2 rounded-[45px] p-8 shadow-sm transition-all hover:border-blue-900 group relative overflow-hidden ${urgency.alert ? 'border-red-400 bg-red-50/30' : 'border-slate-100'}`}>
                    {urgency.alert && (
                       <div className="absolute top-0 right-0 p-4 bg-red-600 text-white rounded-bl-3xl flex items-center gap-2 shadow-xl animate-alert-led">
                          <Bell size={18} className="animate-bounce" />
                       </div>
                    )}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black italic">{order.orderNumber}</span>
                        <div className={`w-3 h-3 rounded-full ${order.status === 'pendiente' ? 'bg-orange-400' : (order.status === 'entregado' ? 'bg-emerald-400' : 'bg-blue-400')}`}></div>
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
                            {isPaid ? 'LIQUIDADO' : `$${order.remainingAmountUSD.toFixed(2)}`}
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

        {/* EQUIPO */}
        {activeSubTab === 'designers' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter">Equipo Operativo</h3>
              <button onClick={() => setIsAddingMember(true)} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase shadow-xl hover:scale-105 transition-all">NUEVO MIEMBRO</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {settings.designers.map(member => {
                // Ahora mostramos todas las tareas donde el agente está involucrado o es el responsable actual
                const assignedTasks = orders.filter(o => (o.assignedToId === member.id || o.assignmentHistory?.some(h => h.agentId === member.id)) && o.status !== 'entregado');
                
                return (
                  <div key={member.id} className="bg-white p-10 rounded-[50px] border-2 border-slate-100 shadow-sm flex flex-col gap-6 group hover:border-blue-900 transition-all">
                    <div className="flex items-center gap-5 border-b pb-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-[25px] flex items-center justify-center font-black text-2xl italic text-slate-600 shadow-inner group-hover:bg-blue-900 group-hover:text-white transition-all">{member.name[0]}</div>
                      <div className="flex-1">
                        <h5 className="font-black text-slate-900 uppercase italic text-lg leading-none">{member.name}</h5>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-2 italic tracking-widest">{member.role} | {member.specialty}</p>
                      </div>
                      <button onClick={() => setViewingHistoryMember(member)} className="p-4 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all" title="Ver Historial">
                        <History size={20}/>
                      </button>
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
                                   <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${task.status === 'pendiente' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{task.status}</span>
                                </div>
                                <div>
                                  <p className="text-[12px] font-black text-slate-800 uppercase italic mb-1">{task.clientName}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase line-clamp-2 italic">"{task.jobDescription || 'Sin especificaciones'}"</p>
                                </div>
                                {isCurrentResponsible && (
                                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/50">
                                     <button onClick={() => onUpdateOrderStatus(task.id, 'en_proceso')} className="flex-1 py-3 bg-blue-900 text-white rounded-xl font-black text-[8px] uppercase active:scale-95 transition-all flex items-center justify-center gap-2"><RefreshCw size={12}/> RECIBIDO</button>
                                     <button onClick={() => onUpdateOrderStatus(task.id, 'listo')} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[8px] uppercase active:scale-95 transition-all flex items-center justify-center gap-2"><Check size={12}/> FINALIZADO</button>
                                     <button onClick={() => setReassigningOrder(task)} className="p-3 bg-slate-200 text-slate-500 rounded-xl hover:bg-slate-300 transition-all" title="Reasignar"><RefreshCw size={14}/></button>
                                     <button onClick={() => setSelectedOrderForPDF(task)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all" title="Ver Orden"><Eye size={14}/></button>
                                  </div>
                                )}
                                {!isCurrentResponsible && (
                                  <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase italic">
                                    <span>Colaboración Histórica</span>
                                    <button onClick={() => setSelectedOrderForPDF(task)} className="text-blue-900 flex items-center gap-1 hover:underline"><Printer size={10}/> EXPEDIENTE</button>
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

        {/* REPORTES */}
        {activeSubTab === 'reports' && isMasterMode && (
          <div className="space-y-10">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 gap-4">
                <div>
                  <h3 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter">Métricas Maestras</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Análisis Consolidado de Inversiones Roxtor</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowGlobalReportPDF(true)} className="bg-blue-900 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
                    <Printer size={20}/> REPORTE PDF
                  </button>
                  <button onClick={shareReportViaWhatsApp} className="bg-emerald-600 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
                    <Share2 size={20}/> WHATSAPP
                  </button>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 flex flex-col items-center text-center shadow-sm">
                   <TrendingUp size={24} className="text-blue-500 mb-2"/>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VENTAS BRUTAS</p>
                   <h4 className="text-2xl font-black text-slate-900 italic">${stats.totalUSD.toLocaleString()}</h4>
                </div>
                <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 flex flex-col items-center text-center shadow-sm">
                   <DollarSign size={24} className="text-red-500 mb-2"/>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">POR COBRAR</p>
                   <h4 className="text-2xl font-black text-red-600 italic">${stats.accountsReceivable.toLocaleString()}</h4>
                </div>
                <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 flex flex-col items-center text-center shadow-sm">
                   <ClipboardList size={24} className="text-emerald-500 mb-2"/>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ÓRDENES ACTIVAS</p>
                   <h4 className="text-2xl font-black text-slate-900 italic">{orders.filter(o => o.status !== 'entregado').length}</h4>
                </div>
                <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 flex flex-col items-center text-center shadow-sm">
                   <Activity size={24} className="text-blue-900 mb-2"/>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">EFECTIVIDAD EQUIPO</p>
                   <h4 className="text-2xl font-black text-blue-900 italic">{((stats.agentEffectiveness.reduce((a: number, b: any) => a + (b.effectiveness || 0), 0) / (stats.agentEffectiveness.length || 1)) as number).toFixed(0)}%</h4>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border-2 border-slate-100 rounded-[50px] p-10 shadow-sm">
                   <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-6 border-b pb-4 italic">Volumen por Sede</h4>
                   <div className="space-y-4">
                      {stats.storeStats.map(s => (
                        <div key={s.id} className="p-6 bg-slate-50 rounded-[35px] flex justify-between items-center border border-transparent hover:border-blue-100 transition-all">
                           <div>
                             <span className="font-black text-sm uppercase italic text-slate-900">{s.name}</span>
                             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.orderCount} Órdenes procesadas</p>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-blue-900 italic text-xl">${s.volumeUSD.toFixed(2)}</p>
                              <p className="text-[8px] font-black text-red-500 italic">Pendiente: ${s.pending.toFixed(2)}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="bg-white border-2 border-slate-100 rounded-[50px] p-10 shadow-sm flex flex-col">
                   <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-6 border-b pb-4 italic">Rendimiento por Agente (Historial de Colaboración)</h4>
                   <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                      {stats.agentEffectiveness.sort((a,b) => b.volumeUSD - a.volumeUSD).map((a, i) => (
                        <div key={i} className="flex justify-between items-center p-6 bg-slate-50 rounded-[35px] border border-slate-100 transition-all hover:bg-white hover:shadow-md group">
                           <div className="flex flex-col">
                              <span className="font-black text-slate-900 uppercase italic text-sm">{a.name}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{a.role} • ${a.volumeUSD.toFixed(0)} total gestionado</span>
                           </div>
                           <div className="text-right">
                              <p className={`font-black italic text-xl ${a.effectiveness > 75 ? 'text-emerald-600' : (a.effectiveness > 40 ? 'text-orange-500' : 'text-red-500')}`}>{a.effectiveness.toFixed(0)}%</p>
                              <span className="text-[7px] font-bold text-slate-300 uppercase italic">Cumplimiento</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
             
             {/* Comparativa Mensual */}
             <div className="bg-white border-2 border-slate-100 rounded-[50px] p-10 shadow-sm">
                <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-6 border-b pb-4 italic">Histórico de Ventas Mensuales</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                   {Object.entries(stats.monthlySales).sort((a,b) => b[0].localeCompare(a[0])).map(([month, volume]) => (
                     <div key={month} className="bg-slate-50 p-6 rounded-3xl text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">{month}</p>
                        <p className="text-lg font-black text-blue-900 italic">${volume.toFixed(0)}</p>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* AJUSTES */}
        {activeSubTab === 'profile' && isMasterMode && (
          <div className="space-y-12 pb-20">
            <div className="bg-blue-900 text-white p-12 rounded-[60px] shadow-2xl flex flex-col md:flex-row items-center gap-12 border border-white/10 relative overflow-hidden">
              <div onClick={() => logoInputRef.current?.click()} className="w-40 h-40 bg-white rounded-[45px] flex items-center justify-center overflow-hidden cursor-pointer shadow-2xl border-4 border-white/20 hover:border-white transition-all shrink-0">
                {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain p-2" /> : <ImageIcon className="text-blue-900" size={60}/>}
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0]; if(!f) return; const r = new FileReader();
                  r.onloadend = () => onUpdateSettings({ ...settings, companyLogoUrl: r.result as string }); r.readAsDataURL(f);
                }} />
              </div>
              <div className="flex-1 space-y-6 w-full">
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-blue-300 uppercase tracking-[0.3em] ml-2 italic">Nombre Corporativo</label>
                   <input className="bg-white/10 border-b-2 border-white/20 text-3xl font-black italic uppercase tracking-tighter w-full outline-none p-3 rounded-xl focus:bg-white/20 transition-all" value={settings.companyName} onChange={e => onUpdateSettings({...settings, companyName: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-blue-300 uppercase tracking-[0.3em] ml-2 italic">RIF</label>
                      <input className="bg-white/10 border-b-2 border-white/20 text-lg font-bold uppercase w-full outline-none p-3 rounded-xl" value={settings.companyRif} onChange={e => onUpdateSettings({...settings, companyRif: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-blue-300 uppercase tracking-[0.3em] ml-2 italic">Instagram</label>
                      <input className="bg-white/10 border-b-2 border-white/20 text-lg font-bold uppercase w-full outline-none p-3 rounded-xl" value={settings.companyInstagram} onChange={e => onUpdateSettings({...settings, companyInstagram: e.target.value})} />
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-[50px] p-12 shadow-sm space-y-10">
               <div className="flex items-center gap-4 border-b pb-6">
                 <ShieldCheck className="text-blue-900" size={32}/>
                 <h4 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter">Seguridad y Accesos</h4>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-slate-50 p-8 rounded-[35px] space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Clave de Acceso Inicial</p>
                     <input type="text" maxLength={4} className="w-full bg-white p-6 rounded-2xl font-black text-3xl text-center outline-none border border-slate-200 shadow-sm" value={settings.accessPin} onChange={e => onUpdateSettings({...settings, accessPin: e.target.value})} />
                     <p className="text-[8px] font-bold text-slate-400 text-center uppercase italic">Esta clave se solicita al abrir la aplicación.</p>
                  </div>
                  <div className="bg-blue-900 p-8 rounded-[35px] space-y-4 text-white">
                     <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest italic">Llave Maestra de Gerencia</p>
                     <input type="text" maxLength={4} className="w-full bg-white/10 p-6 rounded-2xl font-black text-3xl text-center outline-none border border-white/10 shadow-inner text-white" value={settings.masterPin} onChange={e => onUpdateSettings({...settings, masterPin: e.target.value})} />
                     <p className="text-[8px] font-bold text-blue-400 text-center uppercase italic">Clave para ajustes y reportes financieros.</p>
                  </div>
               </div>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-[50px] p-12 shadow-sm space-y-10">
               <div className="flex items-center gap-4 border-b pb-6">
                 <Database className="text-blue-900" size={32}/>
                 <h4 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter">Respaldo de Datos</h4>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-slate-50 p-8 rounded-[35px] space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sincronización Manual</p>
                     <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={handleExportData} className="flex-1 bg-blue-900 text-white py-5 rounded-2xl font-black text-[9px] uppercase shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                           <Download size={16}/> EXPORTAR JSON
                        </button>
                        <button onClick={() => importInputRef.current?.click()} className="flex-1 bg-white border-2 border-blue-900 text-blue-900 py-5 rounded-2xl font-black text-[9px] uppercase shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
                           <Upload size={16}/> IMPORTAR JSON
                        </button>
                        <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportData} />
                     </div>
                  </div>
                  <div className="bg-blue-50/50 p-8 rounded-[35px] flex items-center justify-between border border-blue-100">
                     <div className="pr-4">
                        <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest italic">Aviso de Privacidad</p>
                        <p className="font-bold text-slate-600 mt-2 text-[10px] leading-relaxed italic">Sus datos son locales y no se comparten en la nube automáticamente por seguridad.</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL REASIGNACIÓN */}
      {reassigningOrder && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[600] flex items-center justify-center p-6">
          <div className="bg-white rounded-[50px] w-full max-w-lg p-12 space-y-10 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center border-b pb-6">
                <div>
                   <h3 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Transferir Responsable</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Ref: {reassigningOrder.orderNumber}</p>
                </div>
                <button onClick={() => setReassigningOrder(null)} className="p-4 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-md"><X size={24}/></button>
             </div>
             <div className="space-y-4 max-h-96 overflow-y-auto pr-2 no-scrollbar">
                <p className="text-[11px] font-black text-slate-400 uppercase italic tracking-widest mb-4 text-center">Seleccione Nuevo Especialista:</p>
                {settings.designers.filter(d => d.id !== reassigningOrder.assignedToId).map(designer => (
                  <button key={designer.id} onClick={() => handleReassign(designer.id)} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[35px] flex items-center justify-between group hover:border-blue-900 hover:bg-white transition-all">
                     <div className="text-left flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 text-blue-900 rounded-2xl flex items-center justify-center font-black italic">{designer.name[0]}</div>
                        <div>
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
                <div>
                   <h3 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Hoja de Ruta del Especialista</h3>
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
                        <div key={order.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[40px] flex justify-between items-center hover:bg-white transition-all group shadow-sm">
                           <div>
                              <p className="font-black text-slate-900 uppercase italic leading-none mb-1 text-xl">{order.orderNumber}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase italic">{order.clientName}</p>
                              <div className="flex items-center gap-2 mt-4 text-blue-900">
                                 <Clock size={12}/>
                                 <p className="text-[9px] font-black uppercase italic tracking-widest">Involucrado: {new Date(myPassage?.assignedAt || '').toLocaleString()}</p>
                              </div>
                           </div>
                           <div className="text-right flex flex-col items-end gap-3">
                              <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${order.status === 'entregado' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                 {order.status}
                              </span>
                              <div className="flex gap-2">
                                <button onClick={() => setSelectedOrderForPDF(order)} className="p-2 bg-blue-900 text-white rounded-lg hover:scale-110 transition-all"><Printer size={12}/></button>
                                <p className="text-xl font-black text-slate-900 italic tracking-tighter">${order.totalUSD.toFixed(2)}</p>
                              </div>
                           </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-24 bg-slate-50 rounded-[45px] border-2 border-dashed border-slate-200">
                     <History className="mx-auto text-slate-200 mb-6" size={72}/>
                     <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Sin registros de productividad históricos</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL REPORT PDF */}
      {showGlobalReportPDF && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[500] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[45px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden my-10 print:m-0 print:shadow-none print:rounded-none">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50 print:hidden">
               <h3 className="text-xl font-black text-blue-900 uppercase italic tracking-tighter">Visor de Reporte Maestro</h3>
               <div className="flex gap-2">
                 <button onClick={handlePrint} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all"><Printer size={18}/> DESCARGAR / IMPRIMIR</button>
                 <button onClick={() => setShowGlobalReportPDF(false)} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={20}/></button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0">
               <div className="max-w-3xl mx-auto border-[10px] border-slate-900 p-12 rounded-sm bg-white min-h-[1000px] flex flex-col print:border-4">
                  <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-10">
                     <div className="flex items-center gap-8">
                        {logoUrl ? <img src={logoUrl} className="w-24 h-24 object-contain" /> : <div className="bg-blue-900 w-24 h-24 rounded-3xl flex items-center justify-center text-white font-black text-6xl italic shadow-2xl">R</div>}
                        <div className="space-y-1">
                           <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">{settings.companyName}</h2>
                           <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] italic">Soluciones Creativas</p>
                           <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">RIF: {settings.companyRif}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="bg-slate-900 text-white px-6 py-2 mb-2 font-black italic text-[11px] uppercase tracking-widest">REPORTE CONSOLIDADO</div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase italic">Emitido: {new Date().toLocaleString()}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-12">
                     <div className="bg-slate-900 text-white p-10 rounded-[40px] space-y-2">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] italic">FACTURACIÓN BRUTA TOTAL</p>
                        <h4 className="text-5xl font-black italic tracking-tighter">${stats.totalUSD.toFixed(2)}</h4>
                     </div>
                     <div className="bg-red-600 text-white p-10 rounded-[40px] space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] italic opacity-80">CARTERA POR COBRAR</p>
                        <h4 className="text-5xl font-black italic tracking-tighter">${stats.accountsReceivable.toFixed(2)}</h4>
                     </div>
                  </div>

                  <div className="space-y-8 mb-12">
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

                  <div className="space-y-8 mb-12">
                     <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em] border-b-4 border-slate-900 pb-2 italic">EFICACIA EQUIPO DE TRABAJO</h4>
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
                     <p className="text-[11px] font-black uppercase italic tracking-[0.5em] text-blue-900">Roxtor Soluciones Creativas</p>
                     <p className="text-[10px] font-bold uppercase italic mt-1">Gracias por Preferirnos - Síguenos en Instagram @Roxtor.pzo</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PDF DOCUMENTO ROXTOR - ORDEN DE SERVICIO */}
      {selectedOrderForPDF && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[500] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[45px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden my-10 print:m-0 print:shadow-none print:rounded-none">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50 print:hidden">
               <h3 className="text-xl font-black text-blue-900 uppercase italic tracking-tighter">Visor de Órden de Servicio</h3>
               <div className="flex gap-2">
                 <button onClick={handlePrint} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all hover:bg-blue-800"><Printer size={18}/> DESCARGAR / IMPRIMIR</button>
                 <button onClick={() => {
                   const text = `*📦 ÓRDEN ROXTOR: ${selectedOrderForPDF.orderNumber}*%0A_Soluciones Creativas_%0A%0A*Cliente:* ${selectedOrderForPDF.clientName}%0A*Total:* $${selectedOrderForPDF.totalUSD.toFixed(2)}%0A*Abonado:* $${selectedOrderForPDF.paidAmountUSD.toFixed(2)}%0A*Pendiente:* $${selectedOrderForPDF.remainingAmountUSD.toFixed(2)}%0A*Entrega:* ${selectedOrderForPDF.deliveryDate}%0A%0A_Gracias por elegir Soluciones Creativas._`;
                   window.open(`https://wa.me/${selectedOrderForPDF.clientPhone}?text=${text}`, '_blank');
                 }} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all hover:bg-emerald-700"><Share2 size={18}/> WHATSAPP</button>
                 <button onClick={() => setSelectedOrderForPDF(null)} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={20}/></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0">
               <div className="max-w-3xl mx-auto border-[12px] border-slate-900 p-12 rounded-sm bg-white min-h-[1050px] flex flex-col print:border-4">
                  <div className="flex justify-between items-start mb-12 border-b-8 border-slate-900 pb-12">
                     <div className="flex items-center gap-8">
                        {logoUrl ? <img src={logoUrl} className="w-24 h-24 object-contain" /> : <div className="bg-blue-900 w-24 h-24 rounded-3xl flex items-center justify-center text-white font-black text-6xl italic shadow-2xl">R</div>}
                        <div className="space-y-1">
                           <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">{settings.companyName}</h2>
                           <p className="text-[11px] font-black text-red-600 uppercase tracking-[0.5em] italic">Soluciones Creativas</p>
                           <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">RIF: {settings.companyRif}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-red-600 font-black text-lg uppercase italic tracking-widest leading-none mb-4">Compromiso de Entrega: {selectedOrderForPDF.deliveryDate || 'INMEDIATA'}</p>
                        <div className="bg-slate-900 text-white px-8 py-3 mb-3 font-black italic text-[12px] uppercase tracking-[0.3em]">ORDEN DE TALLER</div>
                        <p className="text-3xl font-black text-slate-900 uppercase tracking-tighter">#{selectedOrderForPDF.orderNumber}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase italic mt-1 tracking-widest">FECHA: {new Date(selectedOrderForPDF.createdAt).toLocaleDateString()}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 mb-12 bg-slate-50 p-12 rounded-[40px] border-l-[25px] border-blue-900 print:bg-white print:border-l-8">
                     <div className="space-y-4">
                        <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-200 pb-3 italic">DATOS DEL CLIENTE</h4>
                        <p className="text-4xl font-black text-slate-900 uppercase italic leading-none tracking-tighter mb-2">{selectedOrderForPDF.clientName}</p>
                        <p className="text-[14px] font-bold text-slate-600 uppercase tracking-widest">RIF/CED: {selectedOrderForPDF.clientDoc}</p>
                        <p className="text-[14px] font-bold text-slate-600 uppercase tracking-widest">WhatsApp: {selectedOrderForPDF.clientPhone}</p>
                     </div>
                     <div className="text-right space-y-4 flex flex-col justify-between">
                        <div>
                           <p className="text-[11px] font-black text-blue-900 italic uppercase tracking-widest">Sede: {settings.stores.find(s=>s.id===selectedOrderForPDF.storeId)?.name}</p>
                           <p className="text-[11px] font-black text-slate-400 italic uppercase tracking-widest mt-1">IG: {settings.companyInstagram}</p>
                        </div>
                        <div className="pt-8 border-t border-slate-200/50">
                           <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-[0.4em] italic">TRAZABILIDAD TEXTIL</p>
                           <div className="flex flex-wrap gap-2 justify-end">
                              {selectedOrderForPDF.assignmentHistory?.map((h, i) => (
                                 <span key={i} className="bg-slate-900 text-white text-[8px] px-4 py-1.5 rounded-xl uppercase font-black italic shadow-md tracking-widest">{h.agentName}</span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="mb-12">
                     <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-200 pb-3 italic mb-4">ESPECIFICACIÓN TÉCNICA</h4>
                     <p className="text-xl font-bold text-slate-800 uppercase italic leading-relaxed whitespace-pre-wrap">{selectedOrderForPDF.jobDescription || 'Sin descripción detallada.'}</p>
                  </div>

                  {selectedOrderForPDF.referenceImages && selectedOrderForPDF.referenceImages.length > 0 && (
                    <div className="mb-12">
                       <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-200 pb-3 italic mb-6">MUESTRAS DE REFERENCIA</h4>
                       <div className="grid grid-cols-2 gap-4">
                          {selectedOrderForPDF.referenceImages.map((img, i) => (
                            <img key={i} src={img} className="w-full h-64 object-contain bg-slate-50 rounded-2xl border p-2"/>
                          ))}
                       </div>
                    </div>
                  )}

                  <table className="w-full mb-16 border-collapse">
                     <thead className="border-b-[6px] border-slate-900">
                        <tr className="text-[14px] font-black text-slate-900 uppercase italic text-left">
                           <th className="pb-8">CANT</th>
                           <th className="pb-8">DETALLE PRODUCTO</th>
                           <th className="pb-8 text-right">UNIT ($)</th>
                           <th className="pb-8 text-right">TOTAL ($)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y-4 divide-slate-50">
                        {selectedOrderForPDF.items.map((it, i) => (
                           <tr key={i} className="text-[20px] font-bold text-slate-700">
                              <td className="py-10 font-black text-3xl text-slate-900">{it.quantity}</td>
                              <td className="py-10 uppercase font-black text-slate-900 italic tracking-tighter">{it.name}</td>
                              <td className="py-10 text-right font-black text-slate-400">${it.price.toFixed(2)}</td>
                              <td className="py-10 text-right font-black text-slate-900 italic tracking-tighter text-3xl">${(it.quantity * it.price).toFixed(2)}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  <div className="mt-auto border-t-8 border-slate-900 pt-16 flex justify-end">
                     <div className="w-96 space-y-8">
                        <div className="flex justify-between text-[16px] font-black text-slate-400 italic border-b-2 border-slate-50 pb-5 tracking-[0.2em]">
                           <span>VALOR ÓRDEN:</span>
                           <span className="text-slate-900">${selectedOrderForPDF.totalUSD.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[16px] font-black text-emerald-600 italic border-b-2 border-slate-50 pb-5 tracking-[0.2em]">
                           <span>TOTAL ABONADO:</span>
                           <span>${selectedOrderForPDF.paidAmountUSD.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[26px] font-black text-red-600 italic border-b-[12px] border-red-50 pb-8 tracking-tighter">
                           <span>RESTA CANCELAR:</span>
                           {/* Fix: Added explicit number casting for toFixed property access */}
                           <span className="text-5xl font-black">${(selectedOrderForPDF.remainingAmountUSD as number).toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-900 p-12 rounded-[55px] text-center text-white shadow-2xl space-y-5 print:bg-white print:text-black print:border-[6px] print:shadow-none">
                           <span className="text-[12px] font-black text-blue-400 uppercase tracking-[0.6em] italic print:text-slate-400">LIQUIDACIÓN BS. (BCV {selectedOrderForPDF.exchangeRateUsed})</span>
                           <h5 className="text-6xl font-black italic tracking-tighter leading-none">{(selectedOrderForPDF.totalUSD * selectedOrderForPDF.exchangeRateUsed).toLocaleString('de-DE', {minimumFractionDigits: 2})} Bs.</h5>
                        </div>
                     </div>
                  </div>
                  <div className="mt-16 text-center border-t-4 border-slate-100 pt-12 opacity-70 text-[12px] font-black uppercase italic tracking-[0.6em] print:opacity-100">
                     Gracias por Preferirnos - Síguenos en Instagram Roxtor.pzo - ROXTOR SOLUCIONES CREATIVAS
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR ÓRDEN */}
      {isCreatingOrder && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[400] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-[60px] w-full max-w-6xl p-12 space-y-10 shadow-2xl my-10 animate-in zoom-in duration-300">
             <div className="flex justify-between items-center border-b pb-8">
                <h3 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Nueva Órden de Producción</h3>
                <button onClick={() => setIsCreatingOrder(false)} className="p-4 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-md"><X size={24}/></button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                   <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-[0.3em] italic border-l-[6px] border-blue-900 pl-4">Ficha del Cliente</h4>
                   <div className="grid grid-cols-1 gap-5">
                      <input placeholder="NOMBRE COMPLETO / EMPRESA" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-xs uppercase outline-none shadow-sm" value={newOrder.clientName} onChange={e => setNewOrder({...newOrder, clientName: e.target.value})} />
                      <div className="grid grid-cols-2 gap-5">
                        <input placeholder="RIF / CI" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-xs outline-none shadow-sm" value={newOrder.clientDoc} onChange={e => setNewOrder({...newOrder, clientDoc: e.target.value})} />
                        <input placeholder="TELÉFONO WHATSAPP" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-xs outline-none shadow-sm" value={newOrder.clientPhone} onChange={e => setNewOrder({...newOrder, clientPhone: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-3 gap-5">
                         <div className="space-y-2">
                           <label className="text-[8px] font-black text-slate-400 uppercase ml-2 italic">SEDE</label>
                           <select className="w-full bg-slate-50 p-6 rounded-2xl font-black text-[10px] outline-none shadow-sm uppercase italic cursor-pointer" value={newOrder.storeId} onChange={e => setNewOrder({...newOrder, storeId: e.target.value})}>
                              {settings.stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                           </select>
                         </div>
                         <div className="space-y-2">
                           <label className="text-[8px] font-black text-slate-400 uppercase ml-2 italic">ESPECIALISTA</label>
                           <select className="w-full bg-slate-50 p-6 rounded-2xl font-black text-[10px] outline-none shadow-sm uppercase italic cursor-pointer" value={newOrder.assignedToId} onChange={e => setNewOrder({...newOrder, assignedToId: e.target.value})}>
                              <option value="">SIN ASIGNAR</option>
                              {settings.designers.map(d => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
                           </select>
                         </div>
                         <div className="space-y-2">
                           <label className="text-[8px] font-black text-slate-400 uppercase ml-2 italic">ENTREGA</label>
                           <input type="date" className="w-full bg-slate-50 p-6 rounded-2xl font-black text-[10px] outline-none shadow-sm" value={newOrder.deliveryDate} onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} />
                         </div>
                      </div>
                   </div>

                   <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-[0.3em] italic border-l-[6px] border-blue-900 pl-4 pt-6">Detalle Técnico del Trabajo</h4>
                   <textarea placeholder="ESPECIFIQUE MATERIALES, TÉCNICAS Y OBSERVACIONES..." className="w-full bg-slate-50 p-8 rounded-[40px] font-bold text-xs outline-none min-h-[180px] shadow-inner uppercase italic border-2 border-transparent focus:border-blue-900 transition-all resize-none" value={newOrder.jobDescription} onChange={e => setNewOrder({...newOrder, jobDescription: e.target.value})} />
                   
                   <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-[0.3em] italic border-l-[6px] border-blue-900 pl-4 pt-6">Imágenes de Referencia</h4>
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
                      <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-blue-900 transition-all">
                        <Camera size={24} className="text-slate-300"/>
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
                   <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-[0.3em] italic border-l-[6px] border-blue-900 pl-4">Cotización Detallada</h4>
                   <div className="max-h-80 overflow-y-auto space-y-4 pr-3 no-scrollbar">
                      {newOrder.items?.map((it, idx) => (
                        <div key={idx} className="flex gap-4 items-center bg-white p-6 rounded-[40px] border-2 border-slate-50 shadow-sm relative group transition-all hover:border-blue-100">
                           <div className="flex-1 space-y-3">
                              <select className="w-full bg-slate-50 p-4 rounded-2xl font-black text-[10px] uppercase outline-none shadow-sm" onChange={e => {
                                const p = products.find(prod => prod.id === e.target.value);
                                if (p) {
                                  const upd = [...(newOrder.items || [])]; upd[idx] = { ...upd[idx], name: p.name, price: p.price, productId: p.id }; setNewOrder({...newOrder, items: upd});
                                }
                              }}>
                                <option value="">IMPORTAR DE STOCK...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>)}
                              </select>
                              <input placeholder="DESCRIPCIÓN DEL ÍTEM..." className="w-full bg-transparent font-black text-[11px] uppercase outline-none px-4" value={it.name} onChange={e => {
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
                      <button onClick={() => setNewOrder({...newOrder, items: [...(newOrder.items || []), {name: '', quantity: 1, price: 0}]})} className="w-full py-6 bg-slate-50 rounded-[35px] text-[10px] font-black uppercase text-slate-400 border-2 border-dashed border-slate-200 hover:bg-white hover:border-blue-900 hover:text-blue-900 transition-all tracking-widest">AÑADIR LÍNEA</button>
                   </div>
                   
                   <div className="bg-slate-900 p-12 rounded-[55px] text-white shadow-2xl relative overflow-hidden space-y-8">
                      <div className="flex justify-between items-center">
                         <div>
                            <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] italic">Monto de Abono</p>
                            <div className="flex items-center gap-4 mt-4">
                              <DollarSign className="text-white/30" size={28}/>
                              <input type="number" className="bg-white/10 text-center w-40 p-6 rounded-3xl outline-none text-white font-black text-4xl shadow-inner border border-white/5" value={initialPayment.amountUSD} onChange={e => setInitialPayment({...initialPayment, amountUSD: Number(e.target.value)})} />
                            </div>
                         </div>
                         <div className="text-right">
                            <span className="text-[11px] font-black uppercase italic text-white tracking-[0.4em] opacity-50">VALOR NETO</span>
                            <p className="text-6xl font-black italic text-blue-400 leading-none mt-4 tracking-tighter">
                              ${(newOrder.items?.reduce((acc, it) => acc + (it.price * it.quantity), 0) || 0).toFixed(2)}
                            </p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                        <select className="flex-1 bg-white/10 p-5 rounded-2xl font-black text-[10px] uppercase outline-none text-blue-200" value={initialPayment.method} onChange={e => setInitialPayment({...initialPayment, method: e.target.value as any})}>
                           <option value="Dólares Efectivo">DÓLARES EFECTIVO ($)</option>
                           <option value="Pago Móvil">PAGO MÓVIL (BS)</option>
                           <option value="Transferencia">TRANSFERENCIA (BS)</option>
                           <option value="Punto de Venta">PUNTO VENTA (BS)</option>
                           <option value="Efectivo BS">EFECTIVO (BS)</option>
                        </select>
                        <input placeholder="REFERENCIA DE PAGO" className="flex-1 bg-white/10 p-5 rounded-2xl font-black text-[10px] uppercase outline-none text-white placeholder-white/20" value={initialPayment.reference} onChange={e => setInitialPayment({...initialPayment, reference: e.target.value})}/>
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

      {/* MODAL AGREGAR MIEMBRO AL EQUIPO */}
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
                 <input placeholder="ESPECIALIDAD / ÁREA" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-sm uppercase outline-none focus:bg-white border-2 border-transparent focus:border-blue-900 shadow-sm" value={newMember.specialty} onChange={e => setNewMember({...newMember, specialty: e.target.value})} />
                 <input placeholder="WHATSAPP (58XXXXXXXXXX)" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-sm outline-none focus:bg-white border-2 border-transparent focus:border-blue-900 shadow-sm" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
                 <button onClick={() => {
                   if (!newMember.name) return alert("Nombre obligatorio");
                   onUpdateSettings({ ...settings, designers: [...settings.designers, { ...newMember, id: Date.now().toString() } as Designer] });
                   setIsAddingMember(false);
                 }} className="w-full bg-blue-900 text-white py-8 rounded-[35px] font-black uppercase text-xs shadow-2xl tracking-[0.5em] transition-all active:scale-95 hover:bg-blue-800">ACTIVAR EN SISTEMA</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL REGISTRAR ABONO */}
      {isRegisteringPayment && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[450] flex items-center justify-center p-6">
           <div className="bg-white rounded-[55px] w-full max-w-lg p-12 space-y-10 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b pb-8">
                 <div>
                    <h3 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Registrar Abono</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Ref: {isRegisteringPayment.orderNumber}</p>
                 </div>
                 <button onClick={() => setIsRegisteringPayment(null)} className="p-4 bg-slate-100 rounded-full hover:bg-red-50 transition-all shadow-md"><X size={24}/></button>
              </div>
              <div className="space-y-8">
                 <div className="bg-red-50 p-10 rounded-[40px] border-2 border-red-100 text-center shadow-inner relative overflow-hidden">
                    <p className="text-[11px] font-black text-red-600 uppercase tracking-[0.4em] mb-2 italic opacity-60">BALANCE PENDIENTE</p>
                    <h4 className="text-6xl font-black text-red-600 italic tracking-tighter relative z-10">${isRegisteringPayment.remainingAmountUSD.toFixed(2)}</h4>
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
                       <input placeholder="REFERENCIA #" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-xs uppercase outline-none border-2 border-transparent focus:border-blue-900 shadow-sm" value={additionalPayment.reference} onChange={e => setAdditionalPayment({...additionalPayment, reference: e.target.value})} />
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
                 }} className="w-full bg-emerald-600 text-white py-9 rounded-[40px] font-black uppercase text-[10px] shadow-2xl tracking-[0.6em] active:scale-95 transition-all">CONSOLIDAR TRANSACCIÓN</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default OperationsManager;
