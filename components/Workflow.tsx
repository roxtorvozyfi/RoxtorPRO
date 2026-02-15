
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, AppSettings, TaskStatus, Agent, Workshop, Product } from '../types';
import { GoogleGenAI } from '@google/genai';
import { 
  Printer, 
  DollarSign,
  X,
  Users,
  Layers,
  Calendar,
  MessageCircle,
  RefreshCw,
  ChevronRight,
  Zap,
  Tag,
  Hash,
  Activity,
  PackageCheck,
  Search,
  ImageIcon,
  Download,
  Eye,
  Plus,
  Trash2,
  Palette,
  FileText,
  AlertCircle
} from 'lucide-react';
import OrderReceipt from './OrderReceipt';

interface Props {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  settings: AppSettings;
  agents: Agent[];
  workshops: Workshop[];
  products: Product[];
}

interface GenderQty {
  gender: string;
  quantity: number;
}

const Workflow: React.FC<Props> = ({ orders, setOrders, settings, agents, workshops, products }) => {
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [transferModalOrder, setTransferModalOrder] = useState<Order | null>(null);
  const [workshopAssignModal, setWorkshopAssignModal] = useState<Order | null>(null);
  const [sewingFormModal, setSewingFormModal] = useState<{ order: Order, workshop: Workshop } | null>(null);
  const [imageGalleryModal, setImageGalleryModal] = useState<Order | null>(null);
  
  const [filterAgentId, setFilterAgentId] = useState<string>('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  
  const [paymentData, setPaymentData] = useState({ amount: 0, method: 'DOLARES $', reference: '' });
  const [transferData, setTransferData] = useState<{ agentId: string, nextStatus: OrderStatus }>({
    agentId: '',
    nextStatus: 'pendiente'
  });

  const [sewingData, setSewingData] = useState({
    productName: '',
    genderSelections: [{ gender: 'DAMA', quantity: 1 }] as GenderQty[],
    fabricType: '',
    color: '',
    sizes: '',
    observations: ''
  });

  const isNearDeadline = (deliveryDateStr: string) => {
    if (!deliveryDateStr) return false;
    try {
      const [day, month, year] = deliveryDateStr.split('/').map(Number);
      const deliveryDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = deliveryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    } catch (e) { return false; }
  };

  const updateTaskStatus = (orderId: string, newStatus: TaskStatus, actionText?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      let action = actionText || '';
      if (!action) {
        switch(newStatus) {
          case 'proceso': action = 'Agente recibió tarea (Iniciado)'; break;
          case 'terminado': action = 'Tarea cumplida (Esperando transferencia)'; break;
          case 'esperando': action = 'Tarea reiniciada a espera'; break;
          case 'confeccion': action = 'Enviado a taller (En espera de confección)'; break;
        }
      }
      return {
        ...order,
        taskStatus: newStatus,
        history: [...order.history, { timestamp: Date.now(), agentId: order.assignedAgentId || 'system', action, status: order.status }]
      };
    }));
  };

  const handleWorkshopAssignment = (workshop: Workshop) => {
    if (!workshopAssignModal) return;
    if (workshop.department === 'COSTURA') {
      setSewingFormModal({ order: workshopAssignModal, workshop });
      setWorkshopAssignModal(null);
      
      const firstItem = workshopAssignModal.items[0];
      setSewingData({
        productName: firstItem ? firstItem.name : '',
        genderSelections: [{ gender: 'DAMA', quantity: firstItem ? firstItem.quantity : 1 }],
        fabricType: '',
        color: '',
        sizes: '',
        observations: ''
      });
    } else {
      setOrders(prev => prev.map(order => {
        if (order.id !== workshopAssignModal.id) return order;
        return {
          ...order,
          assignedWorkshopId: workshop.id,
          taskStatus: 'proceso' as TaskStatus,
          history: [...order.history, { 
            timestamp: Date.now(), 
            agentId: 'admin', 
            action: `Asignado a taller: ${workshop.name} (${workshop.department})`, 
            status: 'taller' as OrderStatus 
          }]
        };
      }));
      setWorkshopAssignModal(null);
    }
  };

  const sendSewingWhatsApp = () => {
    if (!sewingFormModal) return;
    const { order, workshop } = sewingFormModal;
    const urgent = isNearDeadline(order.deliveryDate);
    
    const totalQty = sewingData.genderSelections.reduce((acc, curr) => acc + curr.quantity, 0);
    const genderBreakdown = sewingData.genderSelections
      .map(item => `• ${item.quantity} ${item.gender}`)
      .join('\n');

    const message = `*SOLICITUD DE PRODUCCIÓN - ROXTOR* 🧵\n\n` +
      `📌 *ORDEN:* ${order.orderNumber}\n` +
      `📅 *ENTREGA:* ${order.deliveryDate} ${urgent ? '⚠️ ¡URGENTE!' : ''}\n\n` +
      `📦 *ESPECIFICACIONES:* \n` +
      `• Producto: ${sewingData.productName.toUpperCase()}\n` +
      `• Cantidad Total: ${totalQty}\n` +
      `• Desglose por Género:\n${genderBreakdown}\n` +
      `• Tela: ${sewingData.fabricType.toUpperCase()}\n` +
      `• Color: ${sewingData.color.toUpperCase()}\n` +
      `• Tallas: ${sewingData.sizes.toUpperCase()}\n` +
      (sewingData.observations ? `• Notas: ${sewingData.observations.toUpperCase()}\n\n` : `\n`) +
      `Favor confirmar recepción del material. ¡Gracias! 🙏`;

    const cleanPhone = workshop.phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');

    setOrders(prev => prev.map(o => {
      if (o.id !== order.id) return o;
      return {
        ...o,
        assignedWorkshopId: workshop.id,
        taskStatus: 'confeccion' as TaskStatus, // BLOQUEADO EN ESPERA DE CONFECCION
        history: [...o.history, { 
          timestamp: Date.now(), 
          agentId: 'admin', 
          action: `Enviado a taller: ${workshop.name} (${totalQty} prendas). En espera de retorno.`, 
          status: 'taller' as OrderStatus 
        }]
      };
    }));
    setSewingFormModal(null);
  };

  const handleFinishTotal = (orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        status: 'completado' as OrderStatus,
        taskStatus: 'terminado' as TaskStatus,
        history: [...order.history, { 
          timestamp: Date.now(), 
          agentId: order.assignedAgentId || 'system', 
          action: 'Orden finalizada y lista para retiro', 
          status: 'completado' as OrderStatus 
        }]
      };
    }));
  };

  const handleRegisterPayment = () => {
    if (!paymentModalOrder) return;
    setOrders(prev => prev.map(order => {
      if (order.id !== paymentModalOrder.id) return order;
      const newAbono = order.abonoUsd + paymentData.amount;
      return {
        ...order,
        abonoUsd: newAbono,
        restanteUsd: Math.max(0, order.totalUsd - newAbono),
        paymentMethod: paymentData.method as any,
        paymentReference: paymentData.reference,
        history: [...order.history, { timestamp: Date.now(), agentId: 'admin', action: `Cobro: $${paymentData.amount} vía ${paymentData.method}. Ref: ${paymentData.reference}`, status: order.status }]
      };
    }));
    setPaymentModalOrder(null);
  };

  const handleTransferPhase = () => {
    if (!transferModalOrder) return;
    setOrders(prev => prev.map(order => {
      if (order.id !== transferModalOrder.id) return order;
      return {
        ...order,
        status: transferData.nextStatus,
        assignedAgentId: transferData.agentId,
        taskStatus: 'esperando', // Reinicia el ciclo para el nuevo responsable
        history: [...order.history, { 
          timestamp: Date.now(), 
          agentId: 'admin', 
          action: `Transferido a ${transferData.nextStatus.toUpperCase()} - Responsable: ${agents.find(a => a.id === transferData.agentId)?.name || 'Sin asignar'}`, 
          status: transferData.nextStatus 
        }]
      };
    }));
    setTransferModalOrder(null);
  };

  const downloadImage = (base64Data: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const workflowSteps: OrderStatus[] = ['pendiente', 'diseño', 'impresión', 'taller', 'bordado', 'sublimación'];
  const filteredOrders = filterAgentId ? orders.filter(o => o.assignedAgentId === filterAgentId) : orders;
  
  const readyForDelivery = useMemo(() => 
    orders.filter(o => o.status === 'completado' && !o.isDelivered && 
    (o.customerName.toLowerCase().includes(deliveryFilter.toLowerCase()) || o.orderNumber.includes(deliveryFilter))),
  [orders, deliveryFilter]);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      
      {/* SECCIÓN 1: Flujo de Producción */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-[#000814] rounded-full" />
            <h2 className="text-xl font-black text-[#000814] uppercase italic">Cola de Producción</h2>
          </div>
          <div className="flex items-center gap-3 bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 shadow-sm">
            <Users size={16} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase italic">Filtrar Responsable:</span>
            <select value={filterAgentId} onChange={(e) => setFilterAgentId(e.target.value)} className="text-[10px] font-black uppercase italic outline-none text-[#004ea1] cursor-pointer bg-transparent">
              <option value="">TODOS</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-6 pb-6 custom-scrollbar">
          {workflowSteps.map((status) => (
            <div key={status} className="space-y-6 min-w-[320px]">
              <div className="bg-[#000814] text-white px-5 py-3 rounded-2xl flex items-center justify-between shadow-lg">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic">{status}</h3>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg text-[10px] font-black tabular-nums">{filteredOrders.filter(o => o.status === status).length}</span>
              </div>
              <div className="space-y-4">
                {filteredOrders.filter(o => o.status === status).map(order => {
                  const urgent = isNearDeadline(order.deliveryDate);
                  return (
                    <div key={order.id} className={`bg-white border-2 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all relative border-b-8 ${urgent ? 'border-rose-500' : 'border-slate-100'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">#{order.orderNumber}</span>
                        <div className="flex gap-2">
                          {order.referenceImages?.length > 0 && (
                            <button onClick={() => setImageGalleryModal(order)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><ImageIcon size={14} /></button>
                          )}
                          <button onClick={() => setSelectedOrderForPrint(order)} className="p-2 bg-slate-50 text-slate-400 hover:text-[#004ea1] rounded-xl"><Printer size={14} /></button>
                        </div>
                      </div>
                      <h4 className="font-black uppercase text-sm italic mb-4 truncate">{order.customerName}</h4>
                      
                      <div className="space-y-3 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                         <div className="flex justify-between items-center text-[9px] font-black uppercase italic">
                           <span className="text-slate-400">Estado Tarea:</span>
                           <span className={`font-black ${order.taskStatus === 'confeccion' ? 'text-rose-500 animate-pulse' : 'text-[#004ea1]'}`}>
                              {order.taskStatus === 'confeccion' ? 'ESPERANDO CONFECCIÓN' : order.taskStatus.toUpperCase()}
                           </span>
                         </div>
                         
                         {order.taskStatus === 'esperando' && (
                           <button onClick={() => order.status === 'taller' ? setWorkshopAssignModal(order) : updateTaskStatus(order.id, 'proceso')} className="w-full bg-[#000814] text-white py-2 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-slate-200">RECIBIR TAREA</button>
                         )}
                         
                         {order.taskStatus === 'proceso' && (
                           <button onClick={() => order.status === 'taller' ? setWorkshopAssignModal(order) : updateTaskStatus(order.id, 'terminado')} className="w-full bg-emerald-600 text-white py-2 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-emerald-100">
                             {order.status === 'taller' ? 'ENVIAR A TALLER' : 'COMPLETAR TAREA'}
                           </button>
                         )}

                         {order.taskStatus === 'confeccion' && (
                           <button onClick={() => updateTaskStatus(order.id, 'terminado', 'Pedido recibido de taller (Confección OK)')} className="w-full bg-blue-500 text-white py-2 rounded-xl text-[9px] font-black uppercase animate-pulse shadow-lg shadow-blue-100">RECIBIR DE TALLER</button>
                         )}

                         {order.taskStatus === 'terminado' && (
                           <button onClick={() => { setTransferModalOrder(order); setTransferData({ agentId: order.assignedAgentId || '', nextStatus: order.status }); }} className="w-full bg-blue-600 text-white py-2 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-blue-200">TRANSFERIR TAREA</button>
                         )}

                         <button onClick={() => handleFinishTotal(order.id)} className="w-full border-2 border-emerald-100 text-emerald-600 py-2 rounded-xl text-[9px] font-black uppercase mt-1">FINALIZAR TODO</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: Listas para Entregar */}
      <div className="space-y-6 pt-10 border-t border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-emerald-500 rounded-full" />
            <h2 className="text-xl font-black text-[#000814] uppercase italic">Pedidos Listos para Despacho</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por cliente o nro..." 
              className="pl-12 pr-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black uppercase italic outline-none w-full md:w-64"
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {readyForDelivery.map(order => (
            <div key={order.id} className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h5 className="text-sm font-black text-slate-800 uppercase italic truncate">{order.customerName}</h5>
                   <p className="text-[10px] font-bold text-slate-400">#{order.orderNumber} • {order.deliveryDate}</p>
                 </div>
                 <div className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase ${order.restanteUsd > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {order.restanteUsd > 0 ? 'CON SALDO' : 'PAGADO'}
                 </div>
               </div>
               
               <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                     <span className="text-[9px] font-black text-slate-400 uppercase italic">Saldo Pendiente:</span>
                     <span className={`text-lg font-black italic ${order.restanteUsd > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ${order.restanteUsd.toFixed(2)}
                     </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {order.restanteUsd > 0 && (
                      <button onClick={() => { setPaymentModalOrder(order); setPaymentData({amount: order.restanteUsd, method: 'DOLARES $', reference: ''}); }} className="flex items-center justify-center gap-2 bg-rose-600 text-white py-3 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-rose-200">
                        <DollarSign size={14}/> COBRAR
                      </button>
                    )}
                    <button onClick={() => setOrders(prev => prev.map(o => o.id === order.id ? {...o, isDelivered: true} : o))} className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-emerald-200">
                       <PackageCheck size={14}/> ENTREGAR
                    </button>
                    <button onClick={() => setSelectedOrderForPrint(order)} className="col-span-2 flex items-center justify-center gap-2 bg-[#000814] text-white py-3 rounded-xl text-[9px] font-black uppercase">
                       <Printer size={14}/> IMPRIMIR RECIBO
                    </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* FORMULARIO DE CONFECCIÓN - ESPECIFICACIONES WHATSAPP */}
      {sewingFormModal && (
        <div className="fixed inset-0 z-[170] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white w-full max-w-2xl rounded-[4rem] p-10 shadow-2xl space-y-8 border-8 border-white/10 my-auto">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <h4 className="text-2xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">Hoja de Especificaciones</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">Taller Aliado: {sewingFormModal.workshop.name}</p>
                </div>
                <button onClick={() => setSewingFormModal(null)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"><X size={20}/></button>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 italic flex items-center gap-2"><Tag size={12}/> Producto</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-xs font-black uppercase italic outline-none focus:bg-white focus:border-rose-100"
                      value={sewingData.productName}
                      onChange={(e) => setSewingData({...sewingData, productName: e.target.value})}
                    />
                 </div>

                 <div className="space-y-3 bg-slate-50/50 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 italic">Desglose por Género</label>
                      <button onClick={() => setSewingData({...sewingData, genderSelections: [...sewingData.genderSelections, { gender: 'CABALLERO', quantity: 1 }]})} className="bg-rose-600 text-white p-1.5 rounded-lg shadow-md hover:bg-rose-700 transition-all"><Plus size={14}/></button>
                    </div>
                    <div className="space-y-3">
                      {sewingData.genderSelections.map((row, idx) => (
                        <div key={idx} className="flex gap-3">
                          <select className="flex-1 bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase italic" value={row.gender} onChange={(e) => {
                            const updated = [...sewingData.genderSelections];
                            updated[idx].gender = e.target.value;
                            setSewingData({...sewingData, genderSelections: updated});
                          }}>
                            <option value="DAMA">DAMA</option><option value="CABALLERO">CABALLERO</option><option value="NIÑO/A">NIÑO/A</option><option value="UNISEX">UNISEX</option>
                          </select>
                          <input type="number" className="w-20 bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black" value={row.quantity} onChange={(e) => {
                            const updated = [...sewingData.genderSelections];
                            updated[idx].quantity = parseInt(e.target.value) || 1;
                            setSewingData({...sewingData, genderSelections: updated});
                          }} />
                          <button onClick={() => setSewingData({...sewingData, genderSelections: sewingData.genderSelections.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                      ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 italic flex items-center gap-2"><Palette size={12}/> Color</label>
                      <input type="text" className="w-full bg-slate-50 border-2 rounded-2xl p-4 text-xs font-black italic uppercase" value={sewingData.color} onChange={(e) => setSewingData({...sewingData, color: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 italic flex items-center gap-2"><Activity size={12}/> Tela</label>
                      <input type="text" className="w-full bg-slate-50 border-2 rounded-2xl p-4 text-xs font-black italic uppercase" value={sewingData.fabricType} onChange={(e) => setSewingData({...sewingData, fabricType: e.target.value})} />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 italic flex items-center gap-2"><FileText size={12}/> Tallas y Notas</label>
                    <textarea className="w-full bg-slate-50 border-2 rounded-2xl p-4 text-xs font-bold uppercase outline-none min-h-[80px]" value={sewingData.observations} onChange={(e) => setSewingData({...sewingData, observations: e.target.value})} />
                 </div>

                 <button onClick={sendSewingWhatsApp} className="w-full bg-[#000814] text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-4 italic shadow-2xl border-b-8 border-slate-900 active:translate-y-1 active:border-b-4 transition-all">
                    <MessageCircle size={20} className="text-emerald-400" /> ENVIAR A TALLER VÍA WHATSAPP
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DE TRANSFERENCIA */}
      {transferModalOrder && (
        <div className="fixed inset-0 z-[160] bg-[#000814]/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl space-y-8">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-black uppercase italic">Transferir Tarea</h4>
              <button onClick={() => setTransferModalOrder(null)}><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1">Próximo Departamento:</label>
                <select className="w-full bg-slate-50 border-2 rounded-xl p-4 text-xs font-black uppercase italic outline-none" value={transferData.nextStatus} onChange={(e) => setTransferData({...transferData, nextStatus: e.target.value as OrderStatus})}>
                  {workflowSteps.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="completado">COMPLETADO</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1">Nuevo Responsable:</label>
                <select className="w-full bg-slate-50 border-2 rounded-xl p-4 text-xs font-black uppercase italic outline-none" value={transferData.agentId} onChange={(e) => setTransferData({...transferData, agentId: e.target.value})}>
                  <option value="">SIN ASIGNAR</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleTransferPhase} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase shadow-2xl active:scale-95 transition-all">CONFIRMAR TRANSFERENCIA</button>
          </div>
        </div>
      )}

      {/* MODAL DE COBRO CON CÁLCULO BS */}
      {paymentModalOrder && (
        <div className="fixed inset-0 z-[110] bg-[#000814]/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl space-y-8">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-black uppercase italic">Registrar Cobro</h4>
              <button onClick={() => setPaymentModalOrder(null)}><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1">Monto a recibir (USD):</label>
                <div className="relative">
                   <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-[#004ea1]" size={24} />
                   <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 pl-14 text-3xl font-black italic outline-none text-[#004ea1]" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0})} />
                </div>
                {/* CÁLCULO EN BS SEGÚN TASA DEL DÍA */}
                <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-xl border border-emerald-100 mt-2">
                  <span className="text-[9px] font-black text-emerald-600 uppercase italic">Referencia en Bs. (Tasa: {settings.bcvRate}):</span>
                  <span className="text-lg font-black text-emerald-700 italic">Bs. {(paymentData.amount * settings.bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1">Método de Pago:</label>
                  <select className="w-full bg-slate-50 border-2 rounded-xl p-4 text-xs font-black uppercase italic outline-none" value={paymentData.method} onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}>
                    <option value="DOLARES $">DOLARES $</option><option value="PAGO MOVIL">PAGO MOVIL</option><option value="TRANSFERENCIA">TRANSFERENCIA</option><option value="EFECTIVO">EFECTIVO</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1">Nro Referencia:</label>
                  <input type="text" className="w-full bg-slate-50 border-2 rounded-xl p-4 text-xs font-black uppercase italic outline-none" value={paymentData.reference} onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})} />
                </div>
              </div>
            </div>
            <button onClick={handleRegisterPayment} className="w-full bg-[#000814] text-white py-6 rounded-3xl font-black uppercase shadow-2xl active:scale-95 transition-all">CONFIRMAR COBRO</button>
          </div>
        </div>
      )}

      {/* MODAL DE GALERÍA CON DESCARGA */}
      {imageGalleryModal && (
        <div className="fixed inset-0 z-[180] bg-[#000814]/98 backdrop-blur-2xl flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-8 border-white/10">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><ImageIcon size={24}/></div>
                    <div>
                       <h4 className="text-xl font-black text-[#000814] uppercase italic tracking-tighter">Referencias Orden #{imageGalleryModal.orderNumber}</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{imageGalleryModal.referenceImages.length} Archivos</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => imageGalleryModal.referenceImages.forEach((img, i) => downloadImage(img, `REF_${imageGalleryModal.orderNumber}_${i+1}.png`))} className="bg-[#004ea1] text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                       <Download size={16} /> DESCARGAR TODO
                    </button>
                    <button onClick={() => setImageGalleryModal(null)} className="w-12 h-12 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all"><X size={24}/></button>
                 </div>
              </div>
              <div className="p-10 overflow-y-auto bg-white flex-1 custom-scrollbar">
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {imageGalleryModal.referenceImages.map((img, idx) => (
                       <div key={idx} className="group relative aspect-square rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-sm hover:shadow-2xl transition-all">
                          <img src={img} alt={`Ref ${idx+1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-[#000814]/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                             <button onClick={() => downloadImage(img, `REF_${imageGalleryModal.orderNumber}_${idx+1}.png`)} className="bg-white text-[#000814] px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform">
                                <Download size={16} /> DESCARGAR
                             </button>
                             <button onClick={() => window.open(img, '_blank')} className="text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:underline"><Eye size={16} /> VER COMPLETO</button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {selectedOrderForPrint && <OrderReceipt order={selectedOrderForPrint} settings={settings} onClose={() => setSelectedOrderForPrint(null)} />}
      
      {workshopAssignModal && (
        <div className="fixed inset-0 z-[160] bg-[#000814]/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl space-y-8">
            <div className="flex justify-between items-center"><h4 className="text-xl font-black uppercase italic">Asignar Taller</h4><button onClick={() => setWorkshopAssignModal(null)}><X size={24}/></button></div>
            <div className="space-y-4">
              {workshops.map(w => (
                <button key={w.id} onClick={() => handleWorkshopAssignment(w)} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-[#000814] transition-all flex items-center justify-between group">
                  <div className="text-left"><p className="font-black text-[#000814] uppercase text-sm italic">{w.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase italic">{w.department}</p></div>
                  <ChevronRight className="text-slate-300 group-hover:text-[#000814] transition-all" size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workflow;
