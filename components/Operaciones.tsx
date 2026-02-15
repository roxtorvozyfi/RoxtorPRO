
import React, { useState, useMemo } from 'react';
import { Order, Product, Agent, AppSettings, Workshop } from '../types';
import Workflow from './Workflow';
import ServiceOrderForm from './ServiceOrderForm';
import DirectSaleForm from './DirectSaleForm';
import CashClosing from './CashClosing';
import VoiceAssistant from './VoiceAssistant';
import { 
  Layers, 
  PlusCircle,
  Zap,
  Calculator,
  Mic,
  Users,
  MapPin,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  LogOut
} from 'lucide-react';

interface Props {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  agents: Agent[];
  workshops: Workshop[];
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  currentStoreId: string;
}

const Operaciones: React.FC<Props> = ({ 
  orders, 
  setOrders, 
  products, 
  agents, 
  workshops,
  settings, 
  setSettings, 
  currentStoreId 
}) => {
  const [subTab, setSubTab] = useState<'flow' | 'orders' | 'direct' | 'cash' | 'voice'>('flow');
  const [sessionAgentId, setSessionAgentId] = useState<string | null>(null);
  const [sessionStoreId, setSessionStoreId] = useState<string>(currentStoreId);

  const selectedAgent = agents.find(a => a.id === sessionAgentId);
  const selectedStore = settings.stores.find(s => s.id === sessionStoreId);

  // Lógica de Priorización por Fecha de Entrega
  const parseDate = (d: string) => {
    const [day, month, year] = d.split('/').map(Number);
    return new Date(year, month - 1, day).getTime();
  };

  const agentWorkload = useMemo(() => {
    if (!sessionAgentId) return [];
    return orders
      .filter(o => o.assignedAgentId === sessionAgentId && o.status !== 'completado')
      .sort((a, b) => parseDate(a.deliveryDate) - parseDate(b.deliveryDate));
  }, [orders, sessionAgentId]);

  if (!sessionAgentId) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-[#000814] text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl rotate-3">
             <Users size={40} />
          </div>
          <h2 className="text-4xl font-black text-[#000814] uppercase italic tracking-tighter">Portal del Operador</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">Seleccione su identificación y sucursal de hoy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                 <MapPin className="text-[#004ea1]" size={20} />
                 <h4 className="text-sm font-black uppercase italic text-slate-800">Ubicación de Servicio</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {settings.stores.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setSessionStoreId(s.id)}
                    className={`p-6 rounded-2xl border-4 text-left transition-all relative overflow-hidden ${sessionStoreId === s.id ? 'bg-[#004ea1] border-[#004ea1] text-white shadow-xl shadow-blue-100' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-100'}`}
                  >
                    <span className="text-[10px] font-black uppercase italic opacity-50 block mb-1">Sede de Operación</span>
                    <span className="text-lg font-black uppercase italic tracking-tighter">{s.name}</span>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10"><MapPin size={40}/></div>
                  </button>
                ))}
              </div>
           </div>

           <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                 <ShieldCheck className="text-emerald-500" size={20} />
                 <h4 className="text-sm font-black uppercase italic text-slate-800">Identidad del Agente</h4>
              </div>
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {agents.filter(a => a.storeId === sessionStoreId || a.storeId === 'global').map(agent => (
                  <button 
                    key={agent.id} 
                    onClick={() => setSessionAgentId(agent.id)}
                    className="group w-full p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-[#000814] hover:shadow-xl transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-[#000814] group-hover:text-white transition-all">
                          <Users size={20} />
                       </div>
                       <div className="text-left">
                          <p className="font-black text-slate-800 uppercase italic text-sm">{agent.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase italic">{agent.role}</p>
                       </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-200 group-hover:text-[#000814] group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header del Agente Activo */}
      <div className="bg-[#000814] rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Zap size={150}/></div>
         <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 italic font-black text-2xl rotate-3">
              {selectedAgent.name[0]}
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Operador en línea: {selectedStore?.name}</p>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase">{selectedAgent.name}</h3>
            </div>
         </div>
         <div className="flex items-center gap-4 relative z-10">
            <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl text-center">
               <p className="text-[8px] font-black text-slate-500 uppercase italic">Mis Trabajos Pendientes</p>
               <p className="text-xl font-black italic text-blue-400">{agentWorkload.length}</p>
            </div>
            <button onClick={() => setSessionAgentId(null)} className="w-12 h-12 bg-rose-600/20 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
               <LogOut size={20} />
            </button>
         </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-2 flex flex-wrap lg:flex-nowrap gap-1 shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
        <SubNavItem active={subTab === 'flow'} onClick={() => setSubTab('flow')} icon={<Layers size={18}/>} label="Tablero de Combate" />
        <SubNavItem active={subTab === 'orders'} onClick={() => setSubTab('orders')} icon={<PlusCircle size={18} className="text-rose-500" />} label="Cargar Pedido" highlight />
        <SubNavItem active={subTab === 'voice'} onClick={() => setSubTab('voice')} icon={<Mic size={18} className="text-blue-500" />} label="Vozify AI" />
        <SubNavItem active={subTab === 'direct'} onClick={() => setSubTab('direct')} icon={<Zap size={18} className="text-[#004ea1]" />} label="Caja Rápida" />
        <SubNavItem active={subTab === 'cash'} onClick={() => setSubTab('cash')} icon={<Calculator size={18} className="text-emerald-500" />} label="Mi Cierre" />
      </div>

      <div className="min-h-[60vh]">
        {subTab === 'flow' && (
           <div className="space-y-8">
              {/* Prioridad Roja (Urgentes) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agentWorkload.map(order => {
                  const urgent = isNearDeadline(order.deliveryDate);
                  return (
                    <div key={order.id} className={`bg-white border-4 rounded-[3rem] p-8 shadow-sm transition-all relative overflow-hidden group ${urgent ? 'border-rose-100' : 'border-slate-50'}`}>
                       {urgent && (
                         <div className="absolute top-4 right-4 animate-pulse flex items-center gap-2 bg-rose-600 text-white px-3 py-1 rounded-full text-[8px] font-black italic uppercase">
                           <Clock size={10} /> ¡ENTREGA INMEDIATA!
                         </div>
                       )}
                       <div className="space-y-4">
                         <div className="flex justify-between items-start">
                           <span className="text-[10px] font-black text-slate-300 uppercase italic">#{order.orderNumber}</span>
                           <span className="text-[10px] font-black text-[#004ea1] bg-blue-50 px-2 py-1 rounded-lg uppercase italic">{order.status}</span>
                         </div>
                         <h4 className="text-lg font-black text-[#000814] uppercase italic tracking-tighter leading-none">{order.customerName}</h4>
                         <div className="flex items-center gap-3 text-slate-400">
                           <Clock size={14} className={urgent ? 'text-rose-500' : ''} />
                           <span className={`text-[10px] font-black uppercase italic ${urgent ? 'text-rose-600' : ''}`}>Cierra el: {order.deliveryDate}</span>
                         </div>
                         <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase italic">Saldo:</span>
                            <span className={`text-sm font-black italic ${order.restanteUsd > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${order.restanteUsd.toFixed(2)}</span>
                         </div>
                         <button 
                            onClick={() => setSubTab('flow')} // En un ERP real esto abriría el detalle
                            className="w-full bg-[#000814] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest italic group-hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
                         >
                            GESTIONAR TAREA <ChevronRight size={14} />
                         </button>
                       </div>
                    </div>
                  );
                })}
              </div>
              
              {agentWorkload.length === 0 && (
                <div className="py-32 text-center opacity-10">
                   <ShieldCheck size={80} className="mx-auto mb-4" />
                   <p className="text-lg font-black uppercase italic tracking-[0.4em]">Sin tareas asignadas</p>
                </div>
              )}

              {/* Acceso a Workflow General si el Agente necesita ver todo */}
              <div className="pt-12 border-t border-slate-200">
                <Workflow orders={orders} setOrders={setOrders} settings={settings} agents={agents} workshops={workshops} products={products} />
              </div>
           </div>
        )}
        {subTab === 'orders' && <ServiceOrderForm products={products} settings={settings} setSettings={setSettings} agents={agents} currentStoreId={sessionStoreId} onSave={(newOrder) => setOrders([newOrder, ...orders])} />}
        {subTab === 'voice' && <VoiceAssistant products={products} settings={settings} />}
        {subTab === 'direct' && <DirectSaleForm products={products} settings={settings} setSettings={setSettings} currentStoreId={sessionStoreId} onSave={(newSale) => setOrders([newSale, ...orders])} />}
        {subTab === 'cash' && <CashClosing orders={orders} settings={settings} filterStoreId={sessionStoreId} />}
      </div>
    </div>
  );
};

const SubNavItem = ({ active, onClick, icon, label, highlight }: any) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 whitespace-nowrap ${active ? 'bg-[#000814] text-white shadow-xl scale-[1.02] z-10 font-black' : `text-slate-400 hover:text-[#004ea1] hover:bg-slate-50 font-bold ${highlight ? 'text-rose-500/80' : ''}`}`}>
    {icon}
    <span className="text-[10px] uppercase tracking-widest italic">{label}</span>
  </button>
);

const isNearDeadline = (deliveryDateStr: string) => {
  if (!deliveryDateStr) return false;
  try {
    const [day, month, year] = deliveryDateStr.split('/').map(Number);
    const deliveryDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2; // Crítico: 2 días o menos
  } catch (e) { return false; }
};

export default Operaciones;
