
import React, { useState, useMemo, useRef } from 'react';
import { Order, WorkshopGroup, Product, PaymentMethod, AppSettings, Designer, Agent, StoreInfo } from '../types';
import { 
  ClipboardList, Plus, ShieldCheck, 
  Globe, Trash, CreditCard, LayoutDashboard,
  Brush, MapPin, Phone, Download, BarChart3,
  Edit3, X, Save, CheckCircle, Users, FileText,
  User, Calculator, TrendingUp, DollarSign, Wallet,
  Printer, Instagram, Key, ChevronRight, AlertCircle, Send, Clock, UserPlus, Briefcase, Share2, Copy, ImageIcon
} from 'lucide-react';
import { getDirectImageUrl } from '../App';

interface Props {
  orders: Order[];
  groups: WorkshopGroup[];
  products: Product[];
  paymentMethods: PaymentMethod[];
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  onUpdatePaymentMethods?: (pm: PaymentMethod[]) => void;
  syncKey: string;
  onSyncKeyChange: (key: string) => void;
  onForceSync: () => void;
  onAddOrder: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onSetPin: (pin: string) => void;
  onWipeData: () => void;
  currentPin: string;
}

const OperationsManager: React.FC<Props> = ({ 
  orders, products, settings, onUpdateSettings, paymentMethods,
  onUpdatePaymentMethods, onAddOrder, onUpdateOrderStatus
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'designers' | 'dashboard' | 'profile' | 'reports'>('orders');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState<'agent' | 'designer' | null>(null);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isMasterMode, setIsMasterMode] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<any>(null);
  const [selectedOrderForPDF, setSelectedOrderForPDF] = useState<Order | null>(null);

  const pdfRef = useRef<HTMLDivElement>(null);

  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    storeId: settings.stores[0]?.id || '',
    agentId: settings.agents[0]?.id || '',
    items: [{ name: '', quantity: 1, price: 0, customDetails: '' }],
    paymentMethod: 'Dólares Efectivo',
    paidAmountUSD: 0,
    clientName: '',
    clientDoc: '',
    clientPhone: '',
    clientAddress: '',
    assignedToId: ''
  });

  const [memberForm, setMemberForm] = useState({
    name: '',
    responsible: '',
    phone: '',
    specialty: '',
    storeId: settings.stores[0]?.id || ''
  });

  const [paymentForm, setPaymentForm] = useState({
    name: '',
    details: ''
  });

  const handleTabChange = (tab: any) => {
    if ((tab === 'reports' || tab === 'profile') && !isMasterMode) {
      setPendingTab(tab);
      setShowPinModal(true);
    } else {
      setActiveSubTab(tab);
    }
  };

  const verifyMasterPin = () => {
    if (pinInput === settings.masterPin) {
      setIsMasterMode(true);
      if (pendingTab) setActiveSubTab(pendingTab);
      setShowPinModal(false);
      setPinInput('');
    } else {
      alert("LLAVE MAESTRA INCORRECTA. Clave por defecto: 2025");
      setPinInput('');
    }
  };

  const saveSettings = (updated: Partial<AppSettings>) => {
    onUpdateSettings({ ...settings, ...updated });
  };

  const handleAddPayment = () => {
    if (!paymentForm.name || !paymentForm.details) return alert("Completa nombre y detalles");
    const newPM: PaymentMethod = {
      id: Date.now().toString(),
      name: paymentForm.name,
      details: paymentForm.details
    };
    onUpdatePaymentMethods?.([...paymentMethods, newPM]);
    setIsAddingPayment(false);
    setPaymentForm({ name: '', details: '' });
  };

  const handleDeletePayment = (id: string) => {
    if (confirm("¿Eliminar este método de pago?")) {
      onUpdatePaymentMethods?.(paymentMethods.filter(pm => pm.id !== id));
    }
  };

  const handleAddMember = () => {
    if (!memberForm.name) return alert("El nombre es obligatorio");
    
    if (isAddingMember === 'agent') {
      const newAgent: Agent = {
        id: Date.now().toString(),
        name: memberForm.name,
        responsibleName: memberForm.responsible,
        privatePhone: memberForm.phone,
        salesCount: 0,
        totalVolume: 0,
        efficiency: 0
      };
      saveSettings({ agents: [...settings.agents, newAgent] });
    } else {
      const newDesigner: Designer = {
        id: Date.now().toString(),
        name: memberForm.name,
        specialty: memberForm.specialty,
        phone: memberForm.phone,
        assignedStoreId: memberForm.storeId
      };
      saveSettings({ designers: [...settings.designers, newDesigner] });
    }
    
    setIsAddingMember(null);
    setMemberForm({ name: '', responsible: '', phone: '', specialty: '', storeId: settings.stores[0]?.id || '' });
  };

  const sendOrderWhatsApp = (order: Order) => {
    const store = settings.stores.find(s => s.id === order.storeId);
    const message = `🚀 *ORDEN DE SERVICIO ROXTOR: ${order.orderNumber}*\n\n` +
      `👤 *Cliente:* ${order.clientName}\n` +
      `📄 *Documento:* ${order.clientDoc}\n` +
      `📍 *Tienda:* ${store?.name}\n\n` +
      `*DETALLE DEL PEDIDO:*\n` +
      order.items.map(it => `- ${it.quantity}x ${it.name} ${it.customDetails ? `(${it.customDetails})` : ''}`).join('\n') +
      `\n\n💰 *Total:* Ref. ${order.totalUSD.toFixed(2)}` +
      `\n💵 *Abono:* Ref. ${order.paidAmountUSD.toFixed(2)}` +
      `\n🔴 *Restante:* Ref. ${order.remainingAmountUSD.toFixed(2)}` +
      `\n📊 *Total VES:* ${order.totalVES.toLocaleString()} Bs (Tasa ${order.exchangeRateUsed})` +
      `\n\n_Gracias por elegir ROXTOR - Soluciones Creativas_`;

    window.open(`https://wa.me/${order.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const sharePaymentMethods = () => {
    const text = `🏦 *DATOS DE PAGO - ROXTOR*\n\n` + 
      paymentMethods.map(pm => `*${pm.name.toUpperCase()}*\n${pm.details}`).join('\n\n') +
      `\n\n_Por favor enviar comprobante de pago._`;
    
    navigator.clipboard.writeText(text);
    alert("✅ Datos de pago copiados al portapapeles. Pégalos en WhatsApp.");
  };

  const handlePrintPDF = () => {
    const printContent = pdfRef.current;
    if (!printContent) return;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); 
  };

  const logoUrl = getDirectImageUrl(settings.companyLogoUrl || '');

  return (
    <div className="space-y-6 pb-20">
      
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-6">
          <div className="bg-white rounded-[45px] p-12 max-w-sm w-full text-center space-y-8 shadow-2xl border border-blue-900/10">
            <div className="bg-blue-900 w-24 h-24 rounded-[30px] flex items-center justify-center mx-auto text-white shadow-2xl">
              <Key size={44} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-blue-900 uppercase italic">Llave Maestra</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Acceso Reservado a Gerencia</p>
            </div>
            <input 
              type="password" 
              autoFocus
              placeholder="••••"
              className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl text-center text-3xl font-black tracking-[0.5em] outline-none focus:border-blue-900"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verifyMasterPin()}
            />
            <div className="flex gap-4">
              <button onClick={() => setShowPinModal(false)} className="flex-1 text-slate-400 font-black text-xs uppercase">Cerrar</button>
              <button onClick={verifyMasterPin} className="flex-1 bg-blue-900 text-white py-4 rounded-2xl font-black text-xs uppercase">Validar</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex bg-slate-200/50 p-1.5 rounded-[28px] w-full border border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'orders', label: 'ORDENES', icon: ClipboardList, master: false },
          { id: 'designers', label: 'EQUIPO', icon: Brush, master: false },
          { id: 'reports', label: 'REPORTES', icon: BarChart3, master: true },
          { id: 'profile', label: 'TIENDAS', icon: LayoutDashboard, master: true }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => handleTabChange(tab.id as any)} 
            className={`flex-1 min-w-[120px] flex flex-col items-center justify-center gap-1.5 py-4 rounded-[22px] text-[8px] font-black transition-all ${activeSubTab === tab.id ? 'bg-white text-blue-900 shadow-xl scale-105 border border-slate-100' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
          >
            {tab.master && !isMasterMode && <Key size={8} className="mb-0.5 text-blue-900"/>}
            <tab.icon size={18} />
            <span className="uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="animate-in fade-in duration-500">
        
        {/* MODULO: ORDENES */}
        {activeSubTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 gap-4">
              <div>
                <h3 className="text-3xl font-black text-blue-900 uppercase italic leading-none">Ordenes de Servicio</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Control Maestro ROXTOR</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={sharePaymentMethods} className="flex-1 md:flex-none bg-emerald-50 text-emerald-600 border border-emerald-100 px-6 py-5 rounded-3xl font-black text-[10px] uppercase shadow-sm flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-white transition-all">
                  <Copy size={16}/> COMPARTIR PAGOS
                </button>
                <button onClick={() => setIsCreatingOrder(true)} className="flex-1 md:flex-none bg-blue-900 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all">
                  <Plus size={20} className="inline mr-2"/> NUEVA ORDEN
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map(order => (
                <div key={order.id} className="bg-white border-2 border-slate-100 rounded-[45px] p-8 shadow-sm hover:border-blue-900 transition-all flex flex-col group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[9px] font-black italic">{order.orderNumber}</span>
                        <span className="text-[7px] font-black text-slate-400 uppercase">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-xl font-black text-blue-900 uppercase italic mt-2 tracking-tighter">{order.clientName}</h4>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{settings.stores.find(s => s.id === order.storeId)?.name}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase shadow-sm ${order.status === 'pendiente' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {order.status}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3 mb-8 border-y border-slate-50 py-6">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <p className="text-[10px] font-bold text-slate-600 uppercase">
                          {it.quantity}x {it.name}
                        </p>
                        <p className="text-[10px] font-black text-blue-900 italic">${(it.quantity * it.price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                       <div className="bg-slate-50 p-4 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Abonado</p>
                          <p className="text-sm font-black text-emerald-600 italic">${order.paidAmountUSD.toFixed(2)}</p>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Restante</p>
                          <p className="text-sm font-black text-red-600 italic">${order.remainingAmountUSD.toFixed(2)}</p>
                       </div>
                    </div>
                    <div className="flex justify-between items-center bg-blue-900 p-5 rounded-2xl shadow-xl">
                      <p className="text-[9px] font-black text-blue-300 uppercase italic">Total Ref.</p>
                      <p className="text-2xl font-black text-white italic">${order.totalUSD.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedOrderForPDF(order)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                        <FileText size={14}/> PDF
                      </button>
                      <button onClick={() => sendOrderWhatsApp(order)} className="p-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg">
                        <Send size={18}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULO: TIENDAS */}
        {activeSubTab === 'profile' && isMasterMode && (
          <div className="space-y-10">
            <div className="bg-blue-900 text-white p-16 rounded-[60px] shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                 <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4 leading-none">Control Maestro</h2>
                 <p className="text-blue-400 font-black text-xs uppercase tracking-[0.5em] italic">CONFIGURACIÓN CORPORATIVA ROXTOR</p>
               </div>
               <div className="absolute top-0 right-0 p-12 opacity-10"><MapPin size={240}/></div>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-[45px] p-12 shadow-sm space-y-10">
               <h3 className="text-2xl font-black text-blue-900 uppercase italic flex items-center gap-3"><ImageIcon size={24}/> Identidad Corporativa</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                 <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Nombre de Empresa</label>
                      <input className="w-full bg-slate-50 p-5 rounded-[22px] font-black text-sm uppercase" value={settings.companyName} onChange={e => saveSettings({ companyName: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-4">RIF Corporativo</label>
                      <input className="w-full bg-slate-50 p-5 rounded-[22px] font-black text-sm uppercase" value={settings.companyRif} onChange={e => saveSettings({ companyRif: e.target.value })} />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-4">URL del Logo (Directo o Drive)</label>
                      <input placeholder="https://..." className="w-full bg-slate-50 p-5 rounded-[22px] font-bold text-xs" value={settings.companyLogoUrl || ''} onChange={e => saveSettings({ companyLogoUrl: e.target.value })} />
                    </div>
                    {logoUrl && (
                      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border">
                        <img src={logoUrl} className="w-12 h-12 object-contain" alt="Preview" />
                        <span className="text-[8px] font-black text-slate-400 uppercase">Previsualización del Logo</span>
                      </div>
                    )}
                 </div>
               </div>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-[45px] p-12 shadow-sm space-y-10">
               <div className="flex justify-between items-center border-b pb-8">
                  <div>
                    <h3 className="text-2xl font-black text-blue-900 uppercase italic flex items-center gap-3"><Wallet size={24}/> Configuración de Cobros</h3>
                  </div>
                  <button onClick={() => setIsAddingPayment(true)} className="bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black text-[9px] uppercase shadow-lg flex items-center gap-2">
                    <Plus size={14}/> NUEVO MÉTODO
                  </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paymentMethods.map(pm => (
                    <div key={pm.id} className="bg-slate-50 p-8 rounded-[35px] border-2 border-transparent hover:border-blue-900 transition-all relative group">
                       <button onClick={() => handleDeletePayment(pm.id)} className="absolute top-6 right-6 p-3 text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash size={18}/></button>
                       <h4 className="text-lg font-black text-blue-900 uppercase italic mb-3">{pm.name}</h4>
                       <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">{pm.details}</p>
                    </div>
                  ))}
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {settings.stores.map(store => (
                <div key={store.id} className="bg-white border-2 border-slate-100 rounded-[55px] p-12 shadow-sm relative group hover:border-blue-900 transition-all space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="bg-blue-100 p-6 rounded-[25px] text-blue-900 transition-all"><MapPin size={32}/></div>
                    <div>
                      <input className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter bg-transparent outline-none border-b-2 border-transparent focus:border-blue-900" value={store.name} onChange={e => {
                        const updated = settings.stores.map(s => s.id === store.id ? {...s, name: e.target.value} : s);
                        saveSettings({ stores: updated });
                      }} />
                      <p className="text-[9px] font-black text-slate-400 uppercase">ID: {store.whatsappId}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Dirección Física</label>
                      <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-xs outline-none uppercase" value={store.address} onChange={e => {
                        const updated = settings.stores.map(s => s.id === store.id ? {...s, address: e.target.value} : s);
                        saveSettings({ stores: updated });
                      }} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Teléfono Sede</label>
                      <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-xs outline-none uppercase" value={store.phone} onChange={e => {
                        const updated = settings.stores.map(s => s.id === store.id ? {...s, phone: e.target.value} : s);
                        // FIXED: Corrected property name from 'updated' to 'stores' to match AppSettings type
                        saveSettings({ stores: updated });
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* VISOR DE DOCUMENTO ACTUALIZADO */}
      {selectedOrderForPDF && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[250] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50">
               <div className="flex items-center gap-4">
                 <div className="bg-blue-900 p-3 rounded-2xl text-white"><FileText size={24}/></div>
                 <h3 className="text-xl font-black text-blue-900 uppercase italic">Documento Oficial {settings.companyName}</h3>
               </div>
               <div className="flex gap-2">
                 <button onClick={handlePrintPDF} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2">
                   <Printer size={18}/> Imprimir / PDF
                 </button>
                 <button onClick={() => setSelectedOrderForPDF(null)} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl"><X size={24}/></button>
               </div>
            </div>

            <div ref={pdfRef} className="flex-1 overflow-y-auto p-12 bg-white">
              <div className="max-w-3xl mx-auto border-4 border-slate-900 p-12 rounded-sm relative bg-white">
                 <div className="flex justify-between items-start mb-12">
                    <div className="space-y-6">
                       <div className="flex items-center gap-5">
                          {logoUrl ? (
                            <img src={logoUrl} className="w-24 h-24 object-contain shadow-lg" alt="Logo ROXTOR" />
                          ) : (
                            <div className="bg-blue-900 w-24 h-24 rounded-3xl flex items-center justify-center text-white font-black text-6xl italic shadow-2xl">R</div>
                          )}
                          <div>
                             <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">{settings.companyName}</h2>
                             <p className="text-[12px] font-black text-red-600 uppercase tracking-[0.3em] italic">Soluciones Creativas</p>
                          </div>
                       </div>
                       <div className="space-y-1 ml-2">
                          <p className="text-[14px] font-black text-slate-900 uppercase italic tracking-tighter">{settings.stores.find(s => s.id === selectedOrderForPDF.storeId)?.headerTitle || 'NOTA DE ENTREGA'}</p>
                          <p className="text-[10px] font-bold text-slate-500">RIF: {settings.companyRif}</p>
                          <div className="pt-2 space-y-0.5">
                             <p className="text-[9px] font-black text-slate-900 uppercase italic flex items-center gap-2"><MapPin size={10}/> {settings.stores.find(s => s.id === selectedOrderForPDF.storeId)?.address}</p>
                             <p className="text-[9px] font-black text-slate-900 uppercase italic flex items-center gap-2"><Phone size={10}/> {settings.stores.find(s => s.id === selectedOrderForPDF.storeId)?.phone}</p>
                             <p className="text-[9px] font-black text-blue-900 uppercase italic flex items-center gap-2"><Instagram size={10}/> @roxtor.pzo</p>
                          </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="bg-slate-900 text-white px-8 py-4 mb-4 font-black italic text-sm tracking-widest uppercase">Orden de Servicio</div>
                       <p className="text-[16px] font-black text-slate-900 uppercase tracking-tighter">NRO: {selectedOrderForPDF.orderNumber}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">EMISIÓN: {new Date(selectedOrderForPDF.createdAt).toLocaleDateString()}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-10 mb-12 bg-slate-50 p-10 rounded-2xl border-l-8 border-blue-900">
                    <div className="space-y-3">
                       <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">DATOS DEL CLIENTE</h4>
                       <p className="text-xl font-black text-slate-900 uppercase italic leading-none">{selectedOrderForPDF.clientName}</p>
                       <p className="text-[10px] font-bold text-slate-600 uppercase mt-1">DOC: {selectedOrderForPDF.clientDoc}</p>
                    </div>
                    <div className="text-right space-y-3">
                       <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 text-right">RESUMEN</h4>
                       <p className="text-[11px] font-black text-slate-900 uppercase italic">Pago: {selectedOrderForPDF.paymentMethod}</p>
                       <p className="text-[9px] font-black text-blue-900 uppercase italic">Atendido por: {settings.agents.find(a => a.id === selectedOrderForPDF.agentId)?.name}</p>
                    </div>
                 </div>

                 <table className="w-full mb-12">
                    <thead className="border-b-4 border-slate-900">
                      <tr className="text-[11px] font-black text-slate-900 uppercase italic text-left">
                         <th className="pb-4 pt-2">CANT</th>
                         <th className="pb-4 pt-2">PRODUCTO / DESCRIPCIÓN</th>
                         <th className="pb-4 pt-2 text-right">UNIT.</th>
                         <th className="pb-4 pt-2 text-right">TOTAL REF.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {selectedOrderForPDF.items.map((it, i) => (
                         <tr key={i} className="text-[12px] font-bold text-slate-700">
                            <td className="py-5 font-black align-top">{it.quantity}</td>
                            <td className="py-5 align-top">
                               <p className="uppercase font-black text-slate-900 italic leading-none mb-1">{it.name}</p>
                               {it.customDetails && <p className="text-[9px] text-slate-400 italic leading-none">"{it.customDetails}"</p>}
                            </td>
                            <td className="py-5 text-right font-black align-top">${it.price.toFixed(2)}</td>
                            <td className="py-5 text-right font-black align-top text-slate-900">${(it.quantity * it.price).toFixed(2)}</td>
                         </tr>
                      ))}
                    </tbody>
                 </table>

                 <div className="flex justify-end mb-16">
                    <div className="w-72 space-y-4">
                       <div className="flex justify-between items-center text-[11px] font-black border-b border-slate-100 pb-3">
                          <span className="text-slate-400 uppercase tracking-widest">TOTAL REF:</span>
                          <span className="text-slate-900 font-black">${selectedOrderForPDF.totalUSD.toFixed(2)}</span>
                       </div>
                       <div className="bg-slate-900 p-5 rounded-xl flex justify-between items-center shadow-xl">
                          <span className="text-[10px] font-black text-blue-300 uppercase italic">A PAGAR EN Bs:</span>
                          <span className="text-xl font-black text-white italic">{(selectedOrderForPDF.totalUSD * selectedOrderForPDF.exchangeRateUsed).toLocaleString()} Bs.</span>
                       </div>
                    </div>
                 </div>

                 <div className="text-center pt-10 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-900 uppercase italic tracking-[0.2em]">Gracias por su confianza</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic mt-2">ROXTOR - SOLUCIONES CREATIVAS</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR PAGO */}
      {isAddingPayment && (
         <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[400] flex items-center justify-center p-6">
            <div className="bg-white rounded-[50px] w-full max-w-lg p-12 space-y-8 shadow-2xl">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-blue-900 uppercase italic">Nuevo Método de Pago</h3>
                  <button onClick={() => setIsAddingPayment(false)} className="p-3 bg-slate-100 rounded-full"><X/></button>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Nombre (Ej: Pago Móvil Banesco)</label>
                     <input 
                        className="w-full bg-slate-50 p-5 rounded-[22px] font-black text-sm outline-none border-2 border-transparent focus:border-blue-900" 
                        value={paymentForm.name}
                        onChange={e => setPaymentForm({...paymentForm, name: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Detalles (Número, RIF, Banco...)</label>
                     <textarea 
                        className="w-full bg-slate-50 p-5 rounded-[22px] font-black text-xs outline-none border-2 border-transparent focus:border-blue-900 min-h-[120px]" 
                        value={paymentForm.details}
                        onChange={e => setPaymentForm({...paymentForm, details: e.target.value})}
                        placeholder="0424... RIF: J-... Banesco..."
                     />
                  </div>
                  <button onClick={handleAddPayment} className="w-full bg-blue-900 text-white py-6 rounded-[30px] font-black uppercase text-xs shadow-2xl tracking-widest">
                     GUARDAR CONFIGURACIÓN
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default OperationsManager;
