
import React, { useState, useMemo } from 'react';
import { Order, Product, AppSettings, Agent, Workshop } from '../types';
import { 
  TrendingUp, 
  CreditCard, 
  Printer, 
  CheckCircle, 
  Search, 
  DollarSign, 
  X, 
  Warehouse, 
  PackageCheck,
  Calendar,
  FileText,
  BarChart3,
  ArrowUpRight,
  Store,
  ChevronRight,
  Download
} from 'lucide-react';
import OrderReceipt from './OrderReceipt';

interface Props {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  settings: AppSettings;
  agents: Agent[];
  workshops: Workshop[];
}

const Reports: React.FC<Props> = ({ orders, setOrders, products, settings, agents, workshops }) => {
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [paymentData, setPaymentData] = useState({ amount: 0, method: 'DOLARES $', reference: '' });
  const [filterText, setFilterText] = useState('');
  
  // Filtros de fecha
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const months = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", 
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];

  // Utilidad para parsear dd/mm/yyyy
  const parseStoreDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [d, m, y] = dateStr.split('/').map(Number);
    return { day: d, month: m - 1, year: y };
  };

  // Filtrado de órdenes por el mes seleccionado
  const filteredByMonth = useMemo(() => {
    return orders.filter(o => {
      const date = parseStoreDate(o.issueDate);
      return date && date.month === viewMonth && date.year === viewYear;
    });
  }, [orders, viewMonth, viewYear]);

  // Cálculos de Facturación
  const totalSalesUsd = filteredByMonth.reduce((acc, o) => acc + (o.totalUsd || 0), 0);
  const pendingCollection = filteredByMonth
    .filter(o => o.restanteUsd > 0)
    .reduce((acc, o) => acc + (o.restanteUsd || 0), 0);
  
  const salesByStore = useMemo(() => {
    return settings.stores.map(store => {
      const storeTotal = filteredByMonth
        .filter(o => o.storeId === store.id)
        .reduce((acc, o) => acc + (o.totalUsd || 0), 0);
      return { ...store, total: storeTotal };
    });
  }, [filteredByMonth, settings.stores]);

  // Histórico de últimos 6 meses para comparación
  const monthlyHistory = useMemo(() => {
    const history = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const monthOrders = orders.filter(o => {
        const date = parseStoreDate(o.issueDate);
        return date && date.month === m && date.year === y;
      });

      history.push({
        label: `${months[m]} ${y}`,
        total: monthOrders.reduce((acc, o) => acc + (o.totalUsd || 0), 0),
        count: monthOrders.length
      });
    }
    return history;
  }, [orders]);

  // Rendimiento de Agentes del mes
  const agentPerformance = useMemo(() => {
    return agents.map(agent => {
      const agentOrders = filteredByMonth.filter(o => o.assignedAgentId === agent.id && o.status === 'completado');
      let onTime = 0;
      let late = 0;

      agentOrders.forEach(order => {
        const completionLog = order.history.find(h => h.status === 'completado');
        const deadline = parseStoreDate(order.deliveryDate);
        if (completionLog && deadline) {
          const deadlineMs = new Date(deadline.year, deadline.month, deadline.day, 23, 59, 59).getTime();
          completionLog.timestamp <= deadlineMs ? onTime++ : late++;
        } else {
          onTime++; 
        }
      });

      const total = onTime + late;
      return { ...agent, onTime, late, total, efficiency: total > 0 ? Math.round((onTime / total) * 100) : 0 };
    }).sort((a, b) => b.efficiency - a.efficiency);
  }, [filteredByMonth, agents]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700 print:bg-white print:p-0">
      
      {/* HEADER DE REPORTE (Visible solo en impresión) */}
      <div className="hidden print:flex flex-col border-b-4 border-[#000814] pb-8 mb-10">
        <div className="flex justify-between items-start">
           <div>
             <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#000814]">{settings.businessName}</h1>
             <p className="text-rose-600 font-bold uppercase tracking-widest text-xs">{settings.slogan}</p>
           </div>
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INFORME DE GESTIÓN MENSUAL</p>
             <p className="text-2xl font-black italic text-[#004ea1]">{months[viewMonth]} {viewYear}</p>
           </div>
        </div>
      </div>

      {/* CONTROLES DE FILTRO (Ocultos en impresión) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden">
        <div className="space-y-1">
          <h3 className="text-3xl font-black text-[#000814] tracking-tighter uppercase leading-none italic">Centro de Métricas</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 italic">
            <BarChart3 size={14} className="text-[#004ea1]" /> AUDITORÍA DE RENDIMIENTO OPERATIVO
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center bg-white border-2 border-slate-100 p-4 rounded-[2.5rem] shadow-sm">
           <div className="flex items-center gap-3 border-r border-slate-100 pr-4">
              <Calendar size={18} className="text-rose-600" />
              <select 
                value={viewMonth} 
                onChange={(e) => setViewMonth(parseInt(e.target.value))}
                className="text-[10px] font-black uppercase italic outline-none bg-transparent cursor-pointer"
              >
                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select 
                value={viewYear} 
                onChange={(e) => setViewYear(parseInt(e.target.value))}
                className="text-[10px] font-black uppercase italic outline-none bg-transparent cursor-pointer"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
           <button 
             onClick={handlePrintReport}
             className="bg-[#000814] text-white px-6 py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
           >
             <Printer size={16} /> GENERAR INFORME PDF
           </button>
        </div>
      </div>

      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MetricCard title="Facturación Mes" value={`$${totalSalesUsd.toLocaleString()}`} icon={<TrendingUp size={24} />} color="#004ea1" subtitle={`TOTAL ${months[viewMonth]}`} />
        <MetricCard title="Cuentas por Cobrar" value={`$${pendingCollection.toLocaleString()}`} icon={<CreditCard size={24} />} color="#e11d48" subtitle="SALDOS DE ESTE MES" />
        <MetricCard title="Órdenes Mensuales" value={`${filteredByMonth.length}`} icon={<FileText size={24} />} color="#000814" subtitle="REGISTRADAS EN PERIODO" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* DESGLOSE POR SEDE Y HISTÓRICO */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Facturación por Sede */}
          <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 shadow-sm space-y-8">
             <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                <div className="w-12 h-12 bg-blue-50 text-[#004ea1] rounded-2xl flex items-center justify-center shadow-inner"><Store size={24}/></div>
                <h4 className="text-xl font-black text-[#000814] uppercase italic tracking-tighter">Desglose de Ventas por Sede</h4>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {salesByStore.map(store => (
                  <div key={store.id} className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2rem] flex justify-between items-center group hover:bg-white hover:border-blue-100 transition-all">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{store.name}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black italic text-slate-800 tracking-tighter">${store.total.toLocaleString()}</span>
                        <div className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          {totalSalesUsd > 0 ? Math.round((store.total / totalSalesUsd) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-200 group-hover:text-blue-500 transition-colors shadow-sm">
                      <ArrowUpRight size={20} />
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Histórico Mes a Mes */}
          <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 shadow-sm space-y-8">
             <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                <div className="w-12 h-12 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center shadow-inner"><BarChart3 size={24}/></div>
                <h4 className="text-xl font-black text-[#000814] uppercase italic tracking-tighter">Evolución Semestral</h4>
             </div>
             <div className="space-y-4">
                {monthlyHistory.map((item, i) => (
                  <div key={i} className="flex items-center gap-6">
                    <div className="w-24 text-[10px] font-black text-slate-400 uppercase italic">{item.label}</div>
                    <div className="flex-1 h-12 bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-100">
                       <div 
                        className="h-full bg-[#004ea1] transition-all duration-1000 ease-out" 
                        style={{ width: `${Math.max(15, (item.total / (Math.max(...monthlyHistory.map(h => h.total)) || 1)) * 100)}%` }}
                       />
                       <div className="absolute inset-0 flex items-center justify-between px-6">
                          <span className="text-[10px] font-black text-white mix-blend-difference italic">{item.count} PEDIDOS</span>
                          <span className="text-sm font-black italic tracking-tighter text-slate-800">${item.total.toLocaleString()}</span>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* EFICACIA DE EQUIPO */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-[#000814] text-white rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><CheckCircle size={100}/></div>
            <div className="relative z-10 space-y-8">
              <h4 className="text-xl font-black italic tracking-tighter uppercase border-b border-white/10 pb-4">Eficiencia de Equipo</h4>
              <div className="space-y-6">
                {agentPerformance.map(agent => (
                  <div key={agent.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm font-black italic tracking-tighter">{agent.name}</p>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{agent.role}</p>
                      </div>
                      <span className={`text-xl font-black italic ${agent.efficiency >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{agent.efficiency}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-700 ${agent.efficiency >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${agent.efficiency}%` }} />
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase italic">
                       <span>{agent.onTime} ENTREGAS A TIEMPO</span>
                       <span>{agent.total} TOTAL MES</span>
                    </div>
                  </div>
                ))}
                {agentPerformance.length === 0 && <p className="text-[10px] text-slate-600 italic">Sin actividad este mes</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE HISTORIAL DE DATOS CERRADOS */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
           <div className="w-1.5 h-6 bg-slate-800 rounded-full" />
           <h3 className="text-xl font-black text-[#000814] uppercase italic tracking-tighter">Historial y Archivo Operativo</h3>
        </div>
        <div className="bg-white border-4 border-slate-50 rounded-[3rem] shadow-sm overflow-hidden print:border-slate-200">
           <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 print:hidden">
              <div className="relative w-full max-w-md">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                 <input 
                  type="text" 
                  placeholder="Buscar en el archivo por nombre o código..."
                  className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black uppercase italic outline-none focus:border-blue-200"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase italic">{filteredByMonth.length} Registros en {months[viewMonth]}</p>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-6">ID ORDEN</th>
                    <th className="px-10 py-6">CLIENTE</th>
                    <th className="px-10 py-6">FECHA EMISIÓN</th>
                    <th className="px-10 py-6">TOTAL USD</th>
                    <th className="px-10 py-6">ESTADO FINAL</th>
                    <th className="px-10 py-6 text-right print:hidden">GESTIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 italic">
                  {filteredByMonth.filter(o => 
                    o.customerName.toLowerCase().includes(filterText.toLowerCase()) || 
                    o.orderNumber.toLowerCase().includes(filterText.toLowerCase())
                  ).map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-10 py-6 font-black text-[#004ea1] text-xs">#{order.orderNumber}</td>
                      <td className="px-10 py-6 font-black text-slate-800 text-xs uppercase">{order.customerName}</td>
                      <td className="px-10 py-6 text-[10px] font-bold text-slate-400">{order.issueDate}</td>
                      <td className="px-10 py-6 font-black text-slate-900 text-sm">${order.totalUsd.toFixed(2)}</td>
                      <td className="px-10 py-6">
                         <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase italic ${order.status === 'completado' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                           {order.status}
                         </span>
                      </td>
                      <td className="px-10 py-6 text-right print:hidden">
                         <button 
                          onClick={() => setSelectedOrderForPrint(order)}
                          className="p-3 bg-white border-2 border-slate-100 text-slate-300 hover:text-[#004ea1] hover:border-[#004ea1]/20 rounded-xl transition-all shadow-sm"
                         >
                           <Printer size={16} />
                         </button>
                      </td>
                    </tr>
                  ))}
                  {filteredByMonth.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-10 py-20 text-center text-slate-300 uppercase text-[10px] font-black italic">Sin actividad registrada para este periodo</td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* FIRMA DE GERENCIA (Visible solo en impresión) */}
      <div className="hidden print:grid grid-cols-2 gap-20 mt-32 px-20">
         <div className="text-center border-t-2 border-slate-200 pt-4">
            <p className="text-[10px] font-black uppercase text-slate-800">GERENCIA GENERAL</p>
         </div>
         <div className="text-center border-t-2 border-slate-200 pt-4">
            <p className="text-[10px] font-black uppercase text-slate-800">SISTEMA INTELIGENTE ROXTOR</p>
         </div>
      </div>

      {selectedOrderForPrint && <OrderReceipt order={selectedOrderForPrint} settings={settings} onClose={() => setSelectedOrderForPrint(null)} />}
      
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:border-slate-200 { border-color: #e2e8f0 !important; }
          @page { size: auto; margin: 15mm; }
        }
      `}</style>
    </div>
  );
};

const MetricCard = ({ title, value, icon, color, subtitle }: any) => (
  <div className="bg-white border-4 border-slate-50 p-8 rounded-[3rem] shadow-sm hover:shadow-xl transition-all relative overflow-hidden group print:border-slate-200 print:shadow-none">
    <div className="flex justify-between items-start mb-6">
      <div className="p-4 rounded-2xl text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform print:shadow-none" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="text-right">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-1">{title}</p>
        <span className="text-2xl font-black italic tracking-tighter" style={{ color: color }}>{value}</span>
      </div>
    </div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">{subtitle}</p>
  </div>
);

export default Reports;
