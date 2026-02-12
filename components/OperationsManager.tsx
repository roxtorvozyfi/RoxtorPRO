
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Order, Product, AppSettings, Designer, StoreInfo } from '../types';
import { 
  ClipboardList, Plus, ShieldCheck, 
  Trash, LayoutDashboard, MapPin, Phone, Download, BarChart3,
  Edit3, X, CheckCircle, FileText,
  Calculator, TrendingUp, DollarSign,
  Printer, Key, Send, 
  UserPlus, ImageIcon, 
  Save, Users, Calendar,
  MessageCircle, Activity, Bell, Volume2, Upload, AlertTriangle, Play, Check, Clock, Globe, Briefcase, Hash,
  ArrowRight, CreditCard, ChevronDown, UserCircle, Share2, Sparkles
} from 'lucide-react';
import { getDirectImageUrl } from '../App';

interface Props {
  orders: Order[];
  products: Product[];
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  onAddOrder: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onSetPin: (pin: string) => void;
  onWipeData: () => void;
  currentPin: string;
}

const OperationsManager: React.FC<Props> = ({ 
  orders, products, settings, onUpdateSettings, onAddOrder, onUpdateOrderStatus
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'designers' | 'reports' | 'profile'>('orders');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState<Designer | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isMasterMode, setIsMasterMode] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<'orders' | 'designers' | 'reports' | 'profile' | null>(null);
  const [selectedOrderForPDF, setSelectedOrderForPDF] = useState<Order | null>(null);
  const [selectedOrderForFiscal, setSelectedOrderForFiscal] = useState<Order | null>(null);
  const [showGlobalReportPDF, setShowGlobalReportPDF] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);

  const handlePrint = () => window.print();

  // --- NUEVA ORDEN STATE ---
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    storeId: settings.stores[0]?.id || '',
    agentId: settings.designers[0]?.id || '',
    items: [{ name: '', quantity: 1, price: 0 }],
    paymentMethod: 'Dólares Efectivo',
    paidAmountUSD: 0,
    clientName: '',
    clientDoc: '',
    clientPhone: '',
    jobDescription: '',
    referenceImages: [],
    deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assignedToId: ''
  });

  const [memberForm, setMemberForm] = useState<Partial<Designer>>({
    name: '',
    specialty: '',
    phone: '',
    assignedStoreId: settings.stores[0]?.id || '',
    role: 'agente'
  });

  const getAlertStatus = (deliveryDate?: string) => {
    if (!deliveryDate) return 'none';
    const today = new Date();
    today.setHours(0,0,0,0);
    const delivery = new Date(deliveryDate);
    delivery.setHours(0,0,0,0);
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 2) return 'alert-active';
    if (diffDays <= 1 && diffDays >= 0) return 'urgent';
    return 'normal';
  };

  const stats = useMemo(() => {
    const totalUSD = orders.reduce((acc, o) => acc + o.totalUSD, 0);
    const totalVES = orders.reduce((acc, o) => acc + o.totalVES, 0);
    const accountsReceivable = orders.reduce((acc, o) => acc + o.remainingAmountUSD, 0);
    
    const designerStats = settings.designers.map(d => {
      const dOrders = orders.filter(o => o.assignedToId === d.id);
      const finished = dOrders.filter(o => o.status === 'listo' || o.status === 'entregado');
      const efficiency = dOrders.length > 0 ? (finished.length / dOrders.length) * 100 : 0;
      return { 
        ...d, 
        orderCount: dOrders.length, 
        volumeUSD: dOrders.reduce((acc, o) => acc + o.totalUSD, 0),
        efficiency
      };
    });

    const storeStats = settings.stores.map(s => {
      const sOrders = orders.filter(o => o.storeId === s.id);
      return {
        ...s,
        volumeUSD: sOrders.reduce((acc, o) => acc + o.totalUSD, 0),
        volumeVES: sOrders.reduce((acc, o) => acc + o.totalVES, 0),
        pending: sOrders.reduce((acc, o) => acc + o.remainingAmountUSD, 0)
      };
    });

    const pendingOrders = orders.filter(o => o.remainingAmountUSD > 0);

    return { totalUSD, totalVES, accountsReceivable, designerStats, storeStats, pendingOrders };
  }, [orders, settings.designers, settings.stores]);

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
    } else { alert("PIN INCORRECTO"); setPinInput(''); }
  };

  const handleCreateOrderSubmit = () => {
    if (!newOrder.clientName) return alert("Nombre de cliente requerido");
    const items = newOrder.items || [];
    const totalUSD = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const store = settings.stores.find(s => s.id === newOrder.storeId) || settings.stores[0];
    const orderNumber = `${store.whatsappId}-${store.lastOrderNumber + 1}`;

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
      paidAmountUSD: newOrder.paidAmountUSD || 0,
      remainingAmountUSD: totalUSD - (newOrder.paidAmountUSD || 0),
      exchangeRateUsed: settings.currentBcvRate,
      paymentMethod: newOrder.paymentMethod as any,
      status: 'pendiente',
      agentId: newOrder.agentId || '',
      assignedToId: newOrder.assignedToId,
      storeId: store.id,
      createdAt: new Date().toISOString()
    };

    onAddOrder(order);
    onUpdateSettings({ ...settings, stores: settings.stores.map(s => s.id === store.id ? { ...s, lastOrderNumber: s.lastOrderNumber + 1 } : s) });
    setIsCreatingOrder(false);
  };

  const handleUpdateStatus = (id: string, currentStatus: Order['status']) => {
    let nextStatus: Order['status'] = 'pendiente';
    if (currentStatus === 'pendiente') nextStatus = 'en_proceso';
    else if (currentStatus === 'en_proceso') nextStatus = 'listo';
    
    onUpdateOrderStatus(id, nextStatus);
    
    if (nextStatus === 'listo') {
      const o = orders.find(ord => ord.id === id);
      if (o) {
        const msg = `¡Hola ${o.clientName}! Tu pedido *${o.orderNumber}* ya está LISTO en Roxtor. ¡Te esperamos para el retiro!`;
        window.open(`https://wa.me/${o.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    }
  };

  const handleReassign = (orderId: string, designerId: string) => {
    onUpdateOrderStatus(orderId, orders.find(o=>o.id===orderId)?.status || 'pendiente');
    alert("Tarea reasignada correctamente.");
  };

  const calculateFiscalIVA = (totalBs: number) => {
    const base = totalBs / 1.16;
    const iva = totalBs - base;
    return { base, iva };
  };

  const shareReportWhatsApp = () => {
    const text = `📊 *INFORME GERENCIAL ROXTOR - ${new Date().toLocaleDateString()}*\n\n` +
      `💰 *Ingresos Totales:* $${stats.totalUSD.toFixed(2)}\n` +
      `🇻🇪 *Equivalente Bs:* ${stats.totalVES.toLocaleString()} Bs.\n` +
      `🕒 *Cuentas por Cobrar:* $${stats.accountsReceivable.toFixed(2)}\n\n` +
      `🏢 *Por Sede:*\n` +
      stats.storeStats.map(s => `- ${s.name}: $${s.volumeUSD.toFixed(2)} (Pend: $${s.pending.toFixed(2)})`).join('\n') +
      `\n\n🎯 *Eficiencia Promedio:* ${(stats.designerStats.reduce((a,b)=>a+b.efficiency,0)/(stats.designerStats.length||1)).toFixed(0)}%\n\n` +
      `_Generado automáticamente por Roxtor Vozify Pro_`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const logoUrl = getDirectImageUrl(settings.companyLogoUrl || '');

  return (
    <div className="space-y-6 pb-20">
      
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[500] flex items-center justify-center p-6">
          <div className="bg-white rounded-[45px] p-12 max-w-sm w-full text-center space-y-8 shadow-2xl">
            <div className="bg-blue-900 w-24 h-24 rounded-[30px] flex items-center justify-center mx-auto text-white shadow-2xl">
              <Key size={44} className="animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-blue-900 uppercase italic">Control Gerencial</h3>
            <input type="password" autoFocus placeholder="••••" className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl text-center text-3xl font-black tracking-[0.5em] outline-none" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyMasterPin()} />
            <button onClick={() => setShowPinModal(false)} className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cancelar</button>
          </div>
        </div>
      )}

      {/* TABS DE OPERACIONES */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-[28px] w-full border border-slate-200 overflow-x-auto no-scrollbar print:hidden">
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
                <h3 className="text-3xl font-black text-blue-900 uppercase italic">Gestión de Ordenes</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Monitoreo de Producción Roxtor</p>
              </div>
              <button onClick={() => setIsCreatingOrder(true)} className="bg-blue-900 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
                <Plus size={20}/> EMITIR ORDEN
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map(order => {
                const alertStatus = getAlertStatus(order.deliveryDate);
                const isAlert = alertStatus === 'alert-active';
                const isPaid = order.remainingAmountUSD <= 0;
                return (
                  <div key={order.id} className={`bg-white border-2 rounded-[45px] p-8 shadow-sm transition-all flex flex-col group relative overflow-hidden ${isAlert ? 'border-red-600 animate-pulse' : 'border-slate-100 hover:border-blue-900'}`}>
                    {isAlert && <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600"></div>}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black italic">{order.orderNumber}</span>
                        <div className={`w-3 h-3 rounded-full ${order.status === 'pendiente' ? 'bg-orange-400' : (order.status === 'listo' ? 'bg-emerald-400' : 'bg-blue-400')}`}></div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAlert && <Bell size={18} className="text-red-600 animate-bounce"/>}
                        <p className="text-[7px] font-black text-slate-300 uppercase">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-blue-900 uppercase italic mb-1 tracking-tighter leading-tight">{order.clientName}</h4>
                    <p className={`text-[9px] font-black uppercase mb-6 ${isAlert ? 'text-red-600' : 'text-slate-400'}`}>Entrega: {order.deliveryDate || 'N/A'}</p>
                    
                    <div className="bg-slate-50 p-6 rounded-3xl space-y-4 mt-auto">
                      <div className="flex justify-between items-end">
                        <p className="text-[8px] font-black text-slate-400 uppercase italic">Saldo Pendiente</p>
                        <p className={`text-xl font-black italic ${!isPaid ? 'text-red-600' : 'text-emerald-600'}`}>
                          {isPaid ? 'PAGADO' : `$${order.remainingAmountUSD.toFixed(2)}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedOrderForPDF(order)} className="flex-1 py-4 bg-slate-900 text-white rounded-[18px] font-black text-[9px] uppercase shadow-sm flex items-center justify-center gap-2">
                          <Printer size={12}/> ORDEN
                        </button>
                        {isPaid && (order.status === 'listo' || order.status === 'entregado') && (
                          <button onClick={() => setSelectedOrderForFiscal(order)} className="flex-1 py-4 bg-emerald-600 text-white rounded-[18px] font-black text-[9px] uppercase shadow-sm flex items-center justify-center gap-2">
                             <FileText size={12}/> FISCAL
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
          <div className="space-y-10 print:hidden">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-3xl font-black text-blue-900 uppercase italic">Equipo Roxtor</h3>
              <button onClick={() => { setIsAddingMember(true); setMemberForm({ name: '', role: 'agente' }); }} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase shadow-xl hover:scale-105 transition-all"><UserPlus size={16} className="inline mr-2"/> NUEVO MIEMBRO</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {settings.designers.map(member => {
                const assignedTasks = orders.filter(o => o.assignedToId === member.id && o.status !== 'entregado');
                return (
                  <div key={member.id} className="bg-white p-10 rounded-[50px] border-2 border-slate-100 shadow-sm flex flex-col gap-6 group hover:border-blue-900 transition-all">
                    <div className="flex items-center gap-5 border-b pb-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-[25px] flex items-center justify-center font-black text-2xl italic text-slate-600 shadow-inner group-hover:bg-blue-900 group-hover:text-white transition-all">{member.name[0]}</div>
                      <div className="flex-1">
                        <h5 className="font-black text-slate-900 uppercase italic text-lg leading-none">{member.name}</h5>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-2 italic tracking-widest">{member.role} | {member.specialty}</p>
                      </div>
                      <div className="flex gap-2">
                         <a href={`https://wa.me/${member.phone.replace(/\D/g, '')}`} target="_blank" className="p-3 bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                            <MessageCircle size={18}/>
                         </a>
                         <button onClick={() => { setIsEditingMember(member); setMemberForm({ ...member }); }} className="p-3 text-slate-300 hover:text-blue-900 transition-all bg-slate-50 rounded-xl"><Edit3 size={18}/></button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                       <h6 className="text-[10px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2 mb-2 italic">Radar de Tareas ({assignedTasks.length})</h6>
                       <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar">
                          {assignedTasks.map(task => (
                             <div key={task.id} className="bg-slate-50 p-6 rounded-[35px] border border-slate-100 shadow-inner flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                   <div>
                                      <p className="text-[11px] font-black text-slate-900 uppercase italic leading-none">{task.orderNumber}</p>
                                      <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{task.clientName}</p>
                                   </div>
                                   <button onClick={() => setSelectedOrderForPDF(task)} className="p-2 bg-white rounded-lg shadow-sm text-blue-900 hover:scale-110 transition-all"><FileText size={14}/></button>
                                </div>
                                <div className="bg-white/60 p-4 rounded-2xl text-[10px] font-bold text-slate-600 uppercase italic line-clamp-2">
                                   {task.jobDescription || 'Sin especificaciones'}
                                </div>
                                <div className="flex gap-2">
                                   {task.status !== 'listo' && (
                                     <button onClick={() => handleUpdateStatus(task.id, task.status)} className="flex-1 bg-blue-900 text-white py-4 rounded-2xl font-black text-[9px] uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                                       {task.status === 'pendiente' ? <><Play size={12}/> RECIBIR</> : <><Check size={12}/> FINALIZAR</>}
                                     </button>
                                   )}
                                   <select 
                                      className="flex-1 bg-white border border-slate-200 text-[8px] font-black uppercase rounded-2xl px-3 outline-none"
                                      onChange={(e) => handleReassign(task.id, e.target.value)}
                                   >
                                      <option value="">REASIGNAR A...</option>
                                      {settings.designers.filter(d => d.id !== member.id).map(d => (
                                        <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>
                                      ))}
                                   </select>
                                </div>
                             </div>
                          ))}
                          {assignedTasks.length === 0 && <p className="text-center text-slate-300 font-bold uppercase text-[9px] py-10 italic">Sin tareas activas en radar</p>}
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
          <div className="space-y-10 print:hidden">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 gap-4">
                <div>
                  <h3 className="text-3xl font-black text-blue-900 uppercase italic">Inteligencia Gerencial</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Análisis Global Roxtor</p>
                </div>
                <button 
                  onClick={() => setShowGlobalReportPDF(true)} 
                  className="bg-blue-900 text-white px-8 py-5 rounded-[22px] font-black text-[10px] uppercase shadow-xl flex items-center gap-3 hover:bg-blue-800 transition-all active:scale-95"
                >
                   <FileText size={20}/> GENERAR INFORME DETALLADO
                </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 flex flex-col items-center text-center shadow-sm">
                   <DollarSign size={24} className="text-emerald-500 mb-2"/>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ingresos USD</p>
                   <h4 className="text-2xl font-black text-slate-900 italic">${stats.totalUSD.toFixed(2)}</h4>
                </div>
                <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 flex flex-col items-center text-center shadow-sm">
                   <TrendingUp size={24} className="text-blue-500 mb-2"/>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ingresos VES</p>
                   <h4 className="text-2xl font-black text-slate-900 italic">{stats.totalVES.toLocaleString()} Bs.</h4>
                </div>
                <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 flex flex-col items-center text-center shadow-sm">
                   <Clock size={24} className="text-red-500 mb-2"/>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cuentas por Cobrar</p>
                   <h4 className="text-2xl font-black text-red-600 italic">${stats.accountsReceivable.toFixed(2)}</h4>
                </div>
                <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 flex flex-col items-center text-center shadow-sm">
                   <Activity size={24} className="text-blue-900 mb-2"/>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efectividad</p>
                   <h4 className="text-2xl font-black text-blue-900 italic">{(stats.designerStats.reduce((a,b)=>a+b.efficiency,0)/(stats.designerStats.length||1)).toFixed(0)}%</h4>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border-2 border-slate-100 rounded-[50px] p-10 shadow-sm">
                   <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-6 border-b pb-4 italic">Resumen de Ventas por Sede</h4>
                   <div className="space-y-5">
                      {stats.storeStats.map(s => (
                        <div key={s.id} className="p-6 bg-slate-50 rounded-[35px] space-y-3 border border-slate-100 hover:border-blue-900 transition-all">
                           <div className="flex justify-between font-black text-sm uppercase italic text-slate-900">
                              <span>{s.name}</span>
                              <span className="text-blue-900">${s.volumeUSD.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                              <p className="text-[10px] font-bold text-slate-400 uppercase italic">{s.volumeVES.toLocaleString()} Bs.</p>
                              <span className="text-[10px] font-black text-red-500 italic">Pendiente: ${s.pending.toFixed(2)}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="bg-white border-2 border-slate-100 rounded-[50px] p-10 shadow-sm overflow-hidden flex flex-col">
                   <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-6 border-b pb-4 italic">Cuentas por Cobrar (Alertas)</h4>
                   <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                      {stats.pendingOrders.map(o => (
                        <div key={o.id} className="flex justify-between items-center p-6 bg-red-50/50 rounded-[35px] border border-red-100 group hover:bg-red-50 transition-all">
                           <div className="flex flex-col">
                              <span className="font-black text-slate-900 uppercase italic text-sm">{o.orderNumber}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase italic line-clamp-1">{o.clientName}</span>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-red-600 italic text-xl">${o.remainingAmountUSD.toFixed(2)}</p>
                           </div>
                        </div>
                      ))}
                      {stats.pendingOrders.length === 0 && <p className="text-center text-slate-400 font-bold uppercase text-[10px] py-16 italic">No existen deudas pendientes</p>}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* AJUSTES */}
        {activeSubTab === 'profile' && isMasterMode && (
          <div className="space-y-12 pb-20 print:hidden">
            <div className="bg-blue-900 text-white p-16 rounded-[65px] shadow-2xl flex flex-col md:flex-row items-center gap-12 border border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-all pointer-events-none"></div>
              <div onClick={() => logoInputRef.current?.click()} className="w-48 h-48 bg-white rounded-[50px] flex items-center justify-center overflow-hidden cursor-pointer shadow-2xl relative group/logo border-4 border-white/20">
                {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain p-2" /> : <ImageIcon className="text-blue-900" size={72}/>}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-all text-white font-black text-[10px] uppercase tracking-widest">
                   <div className="text-center"><Upload size={32} className="mx-auto mb-2"/> ACTUALIZAR LOGO</div>
                </div>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0]; if(!f) return; const r = new FileReader();
                  r.onloadend = () => onUpdateSettings({ ...settings, companyLogoUrl: r.result as string }); r.readAsDataURL(f);
                }} />
              </div>
              <div className="flex-1 text-center md:text-left space-y-8 w-full">
                <div className="space-y-3">
                   <label className="text-[11px] font-black text-blue-300 uppercase tracking-[0.3em] ml-2 italic">Razón Social Corporativa</label>
                   <input className="bg-white/10 border-b-4 border-white/20 text-5xl font-black italic uppercase tracking-tighter w-full outline-none focus:bg-white/20 focus:border-white transition-all p-5 rounded-t-3xl" value={settings.companyName} onChange={e => onUpdateSettings({...settings, companyName: e.target.value})} placeholder="Ej: INVERSIONES ROXTOR"/>
                </div>
                <div className="space-y-3">
                   <label className="text-[11px] font-black text-blue-300 uppercase tracking-[0.3em] ml-2 italic">RIF Fiscal Venezolano</label>
                   <input className="bg-white/10 border-b-4 border-white/20 text-2xl font-bold uppercase w-full outline-none focus:bg-white/20 focus:border-white transition-all p-5 rounded-t-3xl" value={settings.companyRif} onChange={e => onUpdateSettings({...settings, companyRif: e.target.value})} placeholder="J-00000000-0"/>
                </div>
              </div>
            </div>

            {/* ADN DE MARCA - NUEVO CAMPO TONO DE VOZ */}
            <div className="bg-white border-2 border-slate-100 rounded-[50px] p-12 shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b pb-6">
                 <Sparkles className="text-blue-900" size={32}/>
                 <h4 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">ADN de la Marca (IA de Voz)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Tono de las Respuestas</label>
                    <select className="w-full bg-slate-50 p-6 rounded-3xl font-black text-sm uppercase outline-none shadow-sm cursor-pointer border-2 border-transparent focus:border-blue-900" value={settings.aiTone} onChange={e => onUpdateSettings({...settings, aiTone: e.target.value as any})}>
                       <option value="profesional">ELITE PROFESIONAL</option>
                       <option value="casual">CASUAL Y CERCANO</option>
                       <option value="persuasivo">PERSUASIVO DE VENTAS</option>
                       <option value="amigable">SÚPER AMIGABLE</option>
                    </select>
                    <p className="text-[9px] font-bold text-slate-400 ml-4 italic">Define cómo habla la IA al generar sugerencias para WhatsApp.</p>
                 </div>
              </div>
            </div>

            <div className="flex items-center gap-4 px-6">
               <MapPin className="text-blue-900" size={32}/>
               <h4 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter">Sedes y Sucursales</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-2">
               {settings.stores.map((store, idx) => (
                 <div key={store.id} className="bg-white border-2 border-slate-100 rounded-[60px] p-12 shadow-sm space-y-8 hover:border-blue-900 transition-all group relative">
                    <div className="bg-blue-900 text-white w-14 h-14 rounded-2xl absolute -top-4 -left-4 flex items-center justify-center font-black italic shadow-lg">{idx + 1}</div>
                    <div className="flex items-center gap-4 border-b pb-6">
                       <input className="text-2xl font-black text-blue-900 uppercase italic bg-transparent outline-none flex-1 group-focus-within:text-red-600 transition-all" value={store.name} onChange={e => {
                         const upd = [...settings.stores]; upd[idx].name = e.target.value; onUpdateSettings({...settings, stores: upd});
                       }} placeholder="Nombre de Sede"/>
                    </div>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-3 italic tracking-widest">Dirección Exacta</label>
                          <textarea className="w-full bg-slate-50 p-6 rounded-[30px] font-black text-xs uppercase outline-none shadow-inner border-2 border-transparent focus:border-blue-900 transition-all h-28 resize-none" value={store.address} onChange={e => {
                            const upd = [...settings.stores]; upd[idx].address = e.target.value; onUpdateSettings({...settings, stores: upd});
                          }} placeholder="Calle, Edificio, Piso, Local..."/>
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-3 italic tracking-widest">Teléfono</label>
                             <input className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs uppercase outline-none shadow-inner border-2 border-transparent focus:border-blue-900" value={store.phone} onChange={e => {
                               const upd = [...settings.stores]; upd[idx].phone = e.target.value; onUpdateSettings({...settings, stores: upd});
                             }} placeholder="+58 4XX 0000000"/>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-3 italic tracking-widest">Horarios</label>
                             <input className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs uppercase outline-none shadow-inner border-2 border-transparent focus:border-blue-900" value={store.hours} onChange={e => {
                               const upd = [...settings.stores]; upd[idx].hours = e.target.value; onUpdateSettings({...settings, stores: upd});
                             }} placeholder="Lun-Vie 8am-5pm"/>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL INFORME GLOBAL (PDF / COMPARTIR) */}
      {showGlobalReportPDF && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[550] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-[50px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden my-10 print:m-0 print:shadow-none print:rounded-none">
            <div className="p-10 border-b flex flex-wrap justify-between items-center bg-slate-50 print:hidden gap-4">
               <div>
                  <h3 className="text-2xl font-black text-blue-900 uppercase italic">Informe Gerencial Consolidado</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Análisis Estratégico de Operaciones</p>
               </div>
               <div className="flex gap-3">
                 <button onClick={shareReportWhatsApp} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg"><Share2 size={18}/> COMPARTIR WHATSAPP</button>
                 <button onClick={handlePrint} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg"><Printer size={18}/> DESCARGAR PDF / IMPRIMIR</button>
                 <button onClick={() => setShowGlobalReportPDF(false)} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl"><X size={24}/></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0">
               <div className="max-w-4xl mx-auto border-4 border-slate-900 p-12 rounded-sm bg-white min-h-[1200px] flex flex-col print:border-2">
                  <div className="flex justify-between items-start mb-16 border-b-4 border-slate-900 pb-10">
                    <div className="flex items-center gap-8">
                       {logoUrl ? <img src={logoUrl} className="w-32 h-32 object-contain" /> : <div className="bg-blue-900 w-24 h-24 rounded-3xl flex items-center justify-center text-white font-black text-6xl italic">R</div>}
                       <div className="space-y-1">
                          <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">{settings.companyName}</h2>
                          <p className="text-[12px] font-black text-red-600 uppercase tracking-[0.4em] italic">Intelligence & Creative Solutions</p>
                          <p className="text-[11px] font-bold text-slate-500 uppercase mt-4">RIF: {settings.companyRif}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <h4 className="text-[36px] font-black text-slate-900 italic tracking-tighter leading-none mb-2">REPORTE ANUAL</h4>
                       <p className="text-[12px] font-black text-blue-900 uppercase tracking-widest italic">Fecha Corte: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-10 mb-16">
                     <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 space-y-4">
                        <h5 className="text-[11px] font-black text-blue-900 uppercase tracking-widest italic">FLUJO ECONÓMICO TOTAL</h5>
                        <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Ventas Brutas ($)</span>
                           <span className="text-3xl font-black italic text-slate-900">${stats.totalUSD.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Cuentas por Cobrar ($)</span>
                           <span className="text-3xl font-black italic text-red-600">${stats.accountsReceivable.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end pt-2">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Volumen en Bolívares</span>
                           <span className="text-xl font-black italic text-slate-900">{stats.totalVES.toLocaleString()} Bs.</span>
                        </div>
                     </div>
                     <div className="bg-blue-900 p-10 rounded-[40px] text-white space-y-4">
                        <h5 className="text-[11px] font-black text-blue-400 uppercase tracking-widest italic">RENDIMIENTO OPERATIVO</h5>
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                           <span className="text-[10px] font-bold text-blue-300 uppercase">Órdenes Totales</span>
                           <span className="text-3xl font-black italic text-white">{orders.length}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                           <span className="text-[10px] font-bold text-blue-300 uppercase">Efectividad General</span>
                           <span className="text-3xl font-black italic text-white">{(stats.designerStats.reduce((a,b)=>a+b.efficiency,0)/(stats.designerStats.length||1)).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between items-end pt-2">
                           <span className="text-[10px] font-bold text-blue-300 uppercase">Órdenes Pendientes</span>
                           <span className="text-xl font-black italic text-white">{orders.filter(o=>o.status==='pendiente').length}</span>
                        </div>
                     </div>
                  </div>

                  <div className="mb-16">
                     <h5 className="text-[13px] font-black text-slate-900 uppercase italic mb-8 border-b-2 border-slate-900 pb-2 tracking-widest">DESGLOSE POR SEDE OPERATIVA</h5>
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic border-b">
                              <th className="pb-4">UBICACIÓN / SEDE</th>
                              <th className="pb-4 text-center">ÓRDENES</th>
                              <th className="pb-4 text-right">VOLUMEN ($)</th>
                              <th className="pb-4 text-right">POR COBRAR ($)</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {stats.storeStats.map(s => (
                              <tr key={s.id} className="text-sm font-bold text-slate-700">
                                 <td className="py-6 uppercase font-black italic text-slate-900">{s.name}</td>
                                 <td className="py-6 text-center">{orders.filter(o=>o.storeId===s.id).length}</td>
                                 <td className="py-6 text-right font-black">${s.volumeUSD.toFixed(2)}</td>
                                 <td className="py-6 text-right font-black text-red-600">${s.pending.toFixed(2)}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  <div className="mb-16">
                     <h5 className="text-[13px] font-black text-slate-900 uppercase italic mb-8 border-b-2 border-slate-900 pb-2 tracking-widest">RANKING DE DESEMPEÑO (EQUIPO)</h5>
                     <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        {stats.designerStats.map(d => (
                           <div key={d.id} className="flex justify-between items-center border-b pb-4">
                              <div>
                                 <p className="font-black text-slate-900 uppercase italic text-[13px] leading-none">{d.name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{d.role}</p>
                              </div>
                              <div className="text-right">
                                 <p className="font-black text-blue-900 text-lg italic leading-none">{d.efficiency.toFixed(0)}%</p>
                                 <p className="text-[9px] font-bold text-emerald-600 uppercase mt-1">${d.volumeUSD.toFixed(2)}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="mb-16">
                     <h5 className="text-[13px] font-black text-slate-900 uppercase italic mb-8 border-b-2 border-slate-900 pb-2 tracking-widest">CUENTAS POR COBRAR DETALLADAS</h5>
                     <div className="space-y-3">
                        {stats.pendingOrders.slice(0, 15).map(o => (
                           <div key={o.id} className="flex justify-between items-center text-[11px] font-bold text-slate-600 border-b border-slate-50 pb-2">
                              <span className="uppercase">{o.orderNumber} - {o.clientName}</span>
                              <span className="font-black text-red-600 italic tracking-tighter">${o.remainingAmountUSD.toFixed(2)}</span>
                           </div>
                        ))}
                        {stats.pendingOrders.length > 15 && <p className="text-[9px] text-slate-400 italic font-bold">...Y otros {stats.pendingOrders.length - 15} registros pendientes</p>}
                     </div>
                  </div>

                  <div className="mt-auto border-t-4 border-slate-900 pt-10 text-center space-y-2">
                     <p className="text-[12px] font-black text-slate-900 uppercase italic tracking-[0.4em]">Roxtor Vozify Pro - Soluciones Creativas</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase italic tracking-widest">Validación de Cierre Administrativo - Departamento de Finanzas</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR ORDEN */}
      {isCreatingOrder && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[400] flex items-center justify-center p-6 overflow-y-auto print:hidden">
          <div className="bg-white rounded-[60px] w-full max-w-5xl p-12 space-y-10 shadow-2xl animate-in zoom-in duration-300 my-10">
             <div className="flex justify-between items-center border-b pb-8">
                <h3 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Emitir Orden de Servicio</h3>
                <button onClick={() => setIsCreatingOrder(false)} className="p-4 bg-slate-100 text-slate-400 rounded-full hover:bg-red-50 hover:text-white shadow-lg transition-all"><X/></button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                   <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em] border-l-4 border-blue-900 pl-4 italic">Identificación del Cliente</h4>
                   <div className="grid grid-cols-1 gap-5">
                      <input placeholder="Nombre Completo o Empresa" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-xs uppercase outline-none focus:bg-white border-2 border-transparent focus:border-blue-900 shadow-sm" value={newOrder.clientName} onChange={e => setNewOrder({...newOrder, clientName: e.target.value})} />
                      <div className="grid grid-cols-2 gap-5">
                        <input placeholder="Cédula / RIF" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-xs uppercase outline-none shadow-sm" value={newOrder.clientDoc} onChange={e => setNewOrder({...newOrder, clientDoc: e.target.value})} />
                        <input placeholder="WhatsApp de Contacto" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-xs outline-none shadow-sm" value={newOrder.clientPhone} onChange={e => setNewOrder({...newOrder, clientPhone: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-5 italic flex items-center gap-2 tracking-widest"><Calendar size={12}/> Promesa de Entrega</label>
                        <input type="date" className="w-full bg-slate-50 p-6 rounded-3xl font-black text-xs outline-none shadow-sm" value={newOrder.deliveryDate} onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} />
                      </div>
                   </div>

                   <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em] border-l-4 border-blue-900 pl-4 pt-4 italic">Asignación en Taller</h4>
                   <div className="grid grid-cols-1 gap-5">
                      <select className="w-full bg-slate-50 p-6 rounded-3xl font-black text-xs uppercase outline-none shadow-sm cursor-pointer" value={newOrder.assignedToId} onChange={e => setNewOrder({...newOrder, assignedToId: e.target.value})}>
                        <option value="">Seleccionar Responsable...</option>
                        {settings.designers.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()} ({m.role})</option>)}
                      </select>
                      <textarea placeholder="Descripción detallada del trabajo Ej: Bordar logo central..." className="w-full bg-slate-50 p-6 rounded-3xl font-bold text-xs outline-none min-h-[140px] shadow-sm resize-none uppercase italic border-2 border-transparent focus:border-blue-900" value={newOrder.jobDescription} onChange={e => setNewOrder({...newOrder, jobDescription: e.target.value})} />
                   </div>
                </div>

                <div className="space-y-8">
                   <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em] border-l-4 border-blue-900 pl-4 italic">Presupuesto y Abono</h4>
                   <div className="max-h-72 overflow-y-auto space-y-4 no-scrollbar p-1">
                      {newOrder.items?.map((it, idx) => (
                        <div key={idx} className="flex gap-4 items-center bg-white p-5 rounded-[35px] border-2 border-slate-50 shadow-sm relative group">
                           <div className="flex-1 space-y-2">
                              <select className="w-full bg-slate-50 p-2 rounded-xl font-black text-[10px] uppercase outline-none" onChange={e => {
                                const p = products.find(prod => prod.id === e.target.value);
                                if (p) {
                                  const upd = [...(newOrder.items || [])]; upd[idx] = { ...upd[idx], name: p.name, price: p.price, productId: p.id }; setNewOrder({...newOrder, items: upd});
                                }
                              }}>
                                <option value="">Stock de Catálogo...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                              </select>
                              <input placeholder="Nombre ítem manual..." className="w-full bg-transparent font-bold text-[11px] uppercase outline-none border-t border-slate-100 mt-2 pt-3" value={it.name} onChange={e => {
                                const upd = [...(newOrder.items || [])]; upd[idx].name = e.target.value; setNewOrder({...newOrder, items: upd});
                              }} />
                           </div>
                           <input type="number" placeholder="Cant" className="w-16 bg-slate-50 p-4 rounded-2xl font-black text-center text-xs" value={it.quantity} onChange={e => {
                             const upd = [...(newOrder.items || [])]; upd[idx].quantity = Number(e.target.value); setNewOrder({...newOrder, items: upd});
                           }} />
                           <input type="number" placeholder="$" className="w-20 bg-slate-50 p-4 rounded-2xl font-black text-center text-xs" value={it.price} onChange={e => {
                             const upd = [...(newOrder.items || [])]; upd[idx].price = Number(e.target.value); setNewOrder({...newOrder, items: upd});
                           }} />
                        </div>
                      ))}
                      <button onClick={() => setNewOrder({...newOrder, items: [...(newOrder.items || []), {name: '', quantity: 1, price: 0}]})} className="w-full py-4 bg-slate-50 rounded-2xl text-[9px] font-black uppercase text-slate-400 border-2 border-dashed border-slate-200">Añadir otro ítem</button>
                   </div>
                   
                   <div className="bg-slate-900 p-10 rounded-[50px] text-white shadow-2xl relative overflow-hidden">
                      <div className="flex justify-between items-center text-[11px] font-black uppercase italic tracking-widest text-blue-400">
                         <span>Monto Abonado ($)</span>
                         <input type="number" className="bg-white/10 text-right w-32 p-4 rounded-2xl outline-none text-white font-black text-3xl shadow-inner border border-white/5" value={newOrder.paidAmountUSD} onChange={e => setNewOrder({...newOrder, paidAmountUSD: Number(e.target.value)})} />
                      </div>
                      <div className="flex justify-between items-end border-t border-white/10 pt-8">
                         <span className="text-[14px] font-black uppercase italic text-white tracking-widest">Total Presupuesto</span>
                         <span className="text-6xl font-black italic text-blue-400">${newOrder.items?.reduce((acc, it) => acc + (it.price * it.quantity), 0).toFixed(2)}</span>
                      </div>
                   </div>
                   <button onClick={handleCreateOrderSubmit} className="w-full bg-blue-900 text-white py-9 rounded-[35px] font-black uppercase text-sm shadow-2xl tracking-[0.5em] active:scale-95 transition-all flex items-center justify-center gap-4 hover:bg-blue-800">
                     <FileText size={20}/> PROCESAR ÓRDEN ROXTOR
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL ORDEN (FORMATO IMPRESIÓN / PDF) */}
      {selectedOrderForPDF && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[250] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden my-10 print:m-0 print:shadow-none print:rounded-none">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50 print:hidden">
               <h3 className="text-xl font-black text-blue-900 uppercase italic">Visor de Documento Roxtor</h3>
               <div className="flex gap-2">
                 <button onClick={handlePrint} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg"><Printer size={18}/> IMPRIMIR / GUARDAR PDF</button>
                 <button onClick={() => setSelectedOrderForPDF(null)} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl"><X/></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0">
              <div className="max-w-3xl mx-auto border-4 border-slate-900 p-12 rounded-sm bg-white min-h-[1000px] flex flex-col print:border-2">
                 <div className="flex justify-between items-start mb-12">
                    <div className="space-y-6">
                       <div className="flex items-center gap-6">
                          {logoUrl ? <img src={logoUrl} className="w-28 h-28 object-contain" /> : <div className="bg-blue-900 w-24 h-24 rounded-3xl flex items-center justify-center text-white font-black text-6xl italic">R</div>}
                          <div>
                             <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">{settings.companyName}</h2>
                             <p className="text-[12px] font-black text-red-600 uppercase tracking-[0.3em] italic">Soluciones Creativas</p>
                          </div>
                       </div>
                       <div className="space-y-1 ml-2">
                          <p className="text-[16px] font-black text-slate-900 uppercase italic tracking-tighter">{settings.stores.find(s => s.id === selectedOrderForPDF.storeId)?.headerTitle || 'ORDEN DE SERVICIO'}</p>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">RIF: {settings.companyRif}</p>
                          <p className="text-[11px] uppercase italic text-slate-500">{settings.stores.find(s => s.id === selectedOrderForPDF.storeId)?.address}</p>
                          <p className="text-[11px] uppercase italic text-slate-500">TELF: {settings.stores.find(s => s.id === selectedOrderForPDF.storeId)?.phone}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="bg-slate-900 text-white px-8 py-4 mb-4 font-black italic text-sm tracking-widest uppercase shadow-md">Ficha Operativa</div>
                       <p className="text-[22px] font-black text-slate-900 uppercase tracking-tighter">ORDEN: {selectedOrderForPDF.orderNumber}</p>
                       <p className="text-[11px] font-bold text-slate-400 uppercase mt-2 italic">Fecha: {new Date(selectedOrderForPDF.createdAt).toLocaleDateString()}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-10 mb-10 bg-slate-50 p-12 rounded-3xl border-l-[15px] border-blue-900 shadow-sm print:bg-white print:border-l-4">
                    <div className="space-y-4">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 italic">RECEPTOR / CLIENTE</h4>
                       <p className="text-3xl font-black text-slate-900 uppercase italic leading-none">{selectedOrderForPDF.clientName}</p>
                       <p className="text-[13px] font-bold text-slate-600 uppercase">DOC: {selectedOrderForPDF.clientDoc}</p>
                       <p className="text-[13px] font-bold text-slate-600 uppercase">TELF: {selectedOrderForPDF.clientPhone}</p>
                    </div>
                    <div className="text-right space-y-4">
                       <p className="text-[15px] font-black text-slate-900 uppercase italic">Pago: {selectedOrderForPDF.paymentMethod}</p>
                       <p className="text-[13px] font-black text-red-600 uppercase italic border-2 border-red-600 px-5 py-2 inline-block rounded-xl">META: {selectedOrderForPDF.deliveryDate}</p>
                       <div className="pt-2 text-[11px] font-black text-blue-900 italic uppercase">Responsable: {settings.designers.find(d=>d.id===selectedOrderForPDF.assignedToId)?.name || 'Central Roxtor'}</div>
                    </div>
                 </div>

                 {selectedOrderForPDF.jobDescription && (
                    <div className="mb-10 p-10 bg-blue-50/20 rounded-3xl border border-blue-100 italic print:bg-white print:border-slate-200">
                       <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-4 border-b border-blue-100 pb-2 italic">ESPECIFICACIONES DEL TRABAJO</h4>
                       <p className="text-[15px] font-bold text-slate-800 uppercase leading-relaxed tracking-tight">{selectedOrderForPDF.jobDescription}</p>
                    </div>
                 )}

                 <table className="w-full mb-12 border-collapse">
                    <thead className="border-b-4 border-slate-900">
                      <tr className="text-[14px] font-black text-slate-900 uppercase italic text-left">
                         <th className="pb-6">CANT</th>
                         <th className="pb-6">DESCRIPCIÓN PRODUCTO / SERVICIO</th>
                         <th className="pb-6 text-right">UNIT ($)</th>
                         <th className="pb-6 text-right">SUB ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {selectedOrderForPDF.items.map((it, i) => (
                         <tr key={i} className="text-[16px] font-bold text-slate-700">
                            <td className="py-8 font-black">{it.quantity}</td>
                            <td className="py-8 uppercase font-black text-slate-900 italic tracking-tight">{it.name}</td>
                            <td className="py-8 text-right font-black text-slate-400">${it.price.toFixed(2)}</td>
                            <td className="py-8 text-right font-black text-slate-900 italic tracking-tighter">${(it.quantity * it.price).toFixed(2)}</td>
                         </tr>
                      ))}
                    </tbody>
                 </table>

                 <div className="mt-auto border-t-4 border-slate-900 pt-12 flex justify-end">
                    <div className="w-80 space-y-5">
                       <div className="flex justify-between text-[14px] font-black text-slate-400 italic border-b border-slate-100 pb-3">
                          <span className="uppercase tracking-widest">TOTAL BRUTO:</span>
                          <span className="text-slate-900">${selectedOrderForPDF.totalUSD.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-[14px] font-black text-emerald-600 italic border-b border-slate-100 pb-3">
                          <span className="uppercase tracking-widest">ABONO REALIZADO:</span>
                          <span>${selectedOrderForPDF.paidAmountUSD.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-[18px] font-black text-red-600 italic border-b-4 border-red-100 pb-4">
                          <span className="uppercase tracking-widest">PENDIENTE POR PAGO:</span>
                          <span className="text-2xl">${selectedOrderForPDF.remainingAmountUSD.toFixed(2)}</span>
                       </div>
                       <div className="bg-slate-900 p-8 rounded-[40px] text-center text-white shadow-2xl space-y-3 print:bg-white print:text-black print:border-2 print:shadow-none">
                          <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest italic print:text-slate-400">LIQUIDACIÓN BS (A TASA {selectedOrderForPDF.exchangeRateUsed}):</span>
                          <h5 className="text-4xl font-black italic tracking-tighter">{(selectedOrderForPDF.totalUSD * selectedOrderForPDF.exchangeRateUsed).toLocaleString()} Bs.</h5>
                       </div>
                    </div>
                 </div>
                 <div className="mt-12 text-center border-t-2 border-slate-100 pt-8 opacity-50 text-[10px] font-black uppercase italic tracking-[0.2em] print:opacity-100">
                    Gracias por confiar en el equipo Roxtor - Soluciones Creativas
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FACTURA FISCAL (FORMATO PDF) */}
      {selectedOrderForFiscal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[250] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden my-10 print:m-0 print:rounded-none">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50 print:hidden">
               <h3 className="text-xl font-black text-emerald-600 uppercase italic">Factura Fiscal Reglamentaria</h3>
               <div className="flex gap-2">
                 <button onClick={handlePrint} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-xl"><Printer size={18}/> IMPRIMIR FISCAL</button>
                 <button onClick={() => setSelectedOrderForFiscal(null)} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl"><X/></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 bg-white font-mono print:p-4">
              <div className="max-w-2xl mx-auto border-2 border-slate-300 p-12 bg-white min-h-[950px] shadow-inner print:border-none print:shadow-none">
                 <div className="text-center mb-12 space-y-2">
                    <h2 className="text-4xl font-black uppercase tracking-tighter">{settings.companyName}</h2>
                    <p className="text-md font-bold">RIF: {settings.companyRif}</p>
                    <p className="text-[11px] uppercase tracking-widest font-bold max-w-sm mx-auto">{settings.stores.find(s => s.id === selectedOrderForFiscal.storeId)?.address}</p>
                    <p className="text-[11px] font-bold">CONTACTO: {settings.stores.find(s => s.id === selectedOrderForFiscal.storeId)?.phone}</p>
                 </div>

                 <div className="flex justify-between mb-10 border-y-4 border-slate-900 py-8 text-xs font-bold uppercase tracking-tight">
                    <div className="space-y-3">
                       <p>DOCUMENTO FISCAL NRO: F-{selectedOrderForFiscal.orderNumber}</p>
                       <p>FECHA DE EMISIÓN: {new Date().toLocaleDateString()}</p>
                       <p>ESTADO: TOTALMENTE PAGADO</p>
                    </div>
                    <div className="text-right space-y-3">
                       <p>RAZÓN SOCIAL: {selectedOrderForFiscal.clientName.toUpperCase()}</p>
                       <p>RIF/C.I.: {selectedOrderForFiscal.clientDoc}</p>
                    </div>
                 </div>

                 <table className="w-full text-xs mb-12 border-collapse">
                    <thead className="border-b-2 border-slate-900">
                      <tr className="text-left font-black uppercase italic">
                        <th className="pb-5">CANT</th>
                        <th className="pb-5">DESCRIPCIÓN TÉCNICA</th>
                        <th className="pb-5 text-right">SUBTOTAL BS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrderForFiscal.items.map((it, i) => (
                        <tr key={i}>
                           <td className="py-6 font-bold">{it.quantity}</td>
                           <td className="py-6 uppercase font-bold tracking-tight">{it.name}</td>
                           <td className="py-6 text-right font-black">{(it.quantity * it.price * selectedOrderForFiscal.exchangeRateUsed).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>

                 <div className="border-t-4 border-slate-900 pt-10 space-y-4 text-right">
                    {(() => {
                      const { base, iva } = calculateFiscalIVA(selectedOrderForFiscal.totalVES);
                      return (
                        <>
                          <div className="flex justify-end gap-16 text-md font-bold uppercase">
                            <span>BASE IMPONIBLE (G 16%):</span>
                            <span>{base.toLocaleString()} Bs.</span>
                          </div>
                          <div className="flex justify-end gap-16 text-md font-black uppercase text-red-600 border-b border-slate-100 pb-3">
                            <span>IVA (16.00%):</span>
                            <span>{iva.toLocaleString()} Bs.</span>
                          </div>
                          <div className="pt-8">
                            <div className="flex justify-end gap-16 text-3xl font-black uppercase tracking-tighter">
                              <span>TOTAL A PAGAR:</span>
                              <span>{selectedOrderForFiscal.totalVES.toLocaleString()} Bs.</span>
                            </div>
                            <div className="flex justify-end gap-8 text-[11px] text-slate-400 mt-6 italic font-bold uppercase">
                               <span>Referencia USD: ${selectedOrderForFiscal.totalUSD.toFixed(2)}</span>
                               <span>Tasa BCV: {selectedOrderForFiscal.exchangeRateUsed} Bs/$</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                 </div>
                 <div className="mt-20 text-center text-[9px] font-bold uppercase border-t pt-4 text-slate-400">
                    SISTEMA AUTOMATIZADO ROXTOR VOZIFY PRO - V1.2.5
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MIEMBROS */}
      {(isAddingMember || isEditingMember) && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[450] flex items-center justify-center p-6 print:hidden">
           <div className="bg-white rounded-[50px] w-full max-w-lg p-12 space-y-10 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b pb-6">
                 <h3 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">{isEditingMember ? 'Actualizar Ficha de Agente' : 'Nuevo Integrante Roxtor'}</h3>
                 <button onClick={() => { setIsAddingMember(false); setIsEditingMember(null); }} className="p-4 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-md"><X size={24}/></button>
              </div>
              <div className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-4 italic tracking-widest">Nombre Completo</label>
                    <div className="relative">
                       <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-900" size={24}/>
                       <input placeholder="Ej: Maria Roxtor" className="w-full bg-slate-50 p-6 pl-14 rounded-3xl font-black text-sm uppercase outline-none focus:bg-white border-2 border-transparent focus:border-blue-900 shadow-sm" value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-slate-400 uppercase ml-4 italic tracking-widest">Cargo</label>
                       <select className="w-full bg-slate-50 p-6 rounded-3xl font-black text-[11px] uppercase outline-none shadow-sm cursor-pointer border-2 border-transparent focus:border-blue-900" value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value as any})}>
                          <option value="agente">VENTAS</option>
                          <option value="diseñador">DISEÑO</option>
                          <option value="costura">PRODUCCIÓN</option>
                          <option value="gerencia">GERENCIA</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-slate-400 uppercase ml-4 italic tracking-widest">Sede</label>
                       <select className="w-full bg-slate-50 p-6 rounded-3xl font-black text-[11px] uppercase outline-none shadow-sm cursor-pointer border-2 border-transparent focus:border-blue-900" value={memberForm.assignedStoreId} onChange={e => setMemberForm({...memberForm, assignedStoreId: e.target.value})}>
                          {settings.stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-4 italic tracking-widest">Especialidad Técnica</label>
                    <div className="relative">
                       <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                       <input placeholder="Ej: Estampado Premium" className="w-full bg-slate-50 p-6 pl-14 rounded-3xl font-black text-sm uppercase outline-none focus:bg-white border-2 border-transparent focus:border-blue-900 shadow-sm" value={memberForm.specialty} onChange={e => setMemberForm({...memberForm, specialty: e.target.value})} />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-4 italic tracking-widest">WhatsApp Directo</label>
                    <div className="relative">
                       <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500" size={20}/>
                       <input placeholder="Ej: 584240000000" className="w-full bg-slate-50 p-6 pl-14 rounded-3xl font-black text-sm outline-none focus:bg-white border-2 border-transparent focus:border-blue-900 shadow-sm" value={memberForm.phone} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} />
                    </div>
                 </div>
                 <button onClick={() => {
                   if (!memberForm.name) return alert("Nombre obligatorio");
                   const newMember = { ...memberForm, id: isEditingMember ? isEditingMember.id : Date.now().toString() } as Designer;
                   const designers = isEditingMember 
                    ? settings.designers.map(d => d.id === isEditingMember.id ? newMember : d)
                    : [...settings.designers, newMember];
                   onUpdateSettings({ ...settings, designers });
                   setIsAddingMember(false); setIsEditingMember(null);
                 }} className="w-full bg-blue-900 text-white py-8 rounded-[35px] font-black uppercase text-xs shadow-2xl tracking-[0.5em] transition-all active:scale-95 hover:bg-blue-800">GUARDAR REGISTRO OPERATIVO</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default OperationsManager;
