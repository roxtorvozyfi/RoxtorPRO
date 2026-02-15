
import React, { useState, useMemo } from 'react';
import { Order, AppSettings, StoreConfig } from '../types';
import { 
  Calculator, 
  Store, 
  DollarSign, 
  Smartphone, 
  ArrowRightLeft, 
  Wallet, 
  CreditCard, 
  Zap,
  Calendar,
  Printer,
  TrendingUp,
  MessageCircle,
  ShieldCheck,
  EyeOff
} from 'lucide-react';

interface Props {
  orders: Order[];
  settings: AppSettings;
  filterStoreId?: string; // Si se provee, solo muestra esta tienda
}

const CashClosing: React.FC<Props> = ({ orders, settings, filterStoreId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const formatDateToStore = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const storeSummaries = useMemo(() => {
    const formattedDate = formatDateToStore(selectedDate);
    
    // Si hay un filtro, solo procesamos esa tienda, de lo contrario todas
    const storesToProcess = filterStoreId 
      ? settings.stores.filter(s => s.id === filterStoreId)
      : settings.stores;

    return storesToProcess.map(store => {
      const storeOrders = orders.filter(o => o.storeId === store.id);
      const startOfDay = new Date(selectedDate).setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate).setHours(23, 59, 59, 999);

      const totals = {
        'DOLARES $': 0,
        'PAGO MOVIL': 0,
        'TRANSFERENCIA': 0,
        'EFECTIVO': 0,
        'PUNTO DE VENTA': 0,
        'BIOPAGO': 0,
      };

      storeOrders.forEach(order => {
        if (order.issueDate === formattedDate) {
          const method = order.paymentMethod || 'EFECTIVO';
          if (totals.hasOwnProperty(method)) {
            totals[method as keyof typeof totals] += order.abonoUsd;
          }
        }

        order.history.forEach(h => {
          if (h.timestamp >= startOfDay && h.timestamp <= endOfDay) {
            const match = h.action.match(/(?:Pago|Abono|Cobro)[^$]*\$([\d.]+)/i);
            if (match && !h.action.includes("Orden generada")) {
              const amount = parseFloat(match[1]);
              let method = order.paymentMethod;
              if (h.action.includes("PAGO MOVIL")) method = "PAGO MOVIL";
              else if (h.action.includes("TRANSFERENCIA")) method = "TRANSFERENCIA";
              else if (h.action.includes("DOLARES")) method = "DOLARES $";
              else if (h.action.includes("EFECTIVO")) method = "EFECTIVO";
              else if (h.action.includes("PUNTO DE VENTA")) method = "PUNTO DE VENTA";
              else if (h.action.includes("BIOPAGO")) method = "BIOPAGO";

              if (totals.hasOwnProperty(method)) {
                totals[method as keyof typeof totals] += amount;
              }
            }
          }
        });
      });

      const totalStoreUsd = Object.values(totals).reduce((a, b) => a + b, 0);
      const totalStoreBs = totalStoreUsd * settings.bcvRate;

      return {
        ...store,
        totals,
        totalStoreUsd,
        totalStoreBs
      };
    });
  }, [orders, settings, selectedDate, filterStoreId]);

  const totalGlobalUsd = useMemo(() => storeSummaries.reduce((acc, curr) => acc + curr.totalStoreUsd, 0), [storeSummaries]);
  const totalGlobalBs = useMemo(() => storeSummaries.reduce((acc, curr) => acc + curr.totalStoreBs, 0), [storeSummaries]);

  const sendSummaryToWhatsApp = (summary: any) => {
    const formattedDate = formatDateToStore(selectedDate);
    let message = `*CIERRE DE CAJA ROXTOR* 📊\n`;
    message += `📅 *FECHA:* ${formattedDate}\n`;
    message += `🏪 *TIENDA:* ${summary.name}\n`;
    message += `--------------------------\n`;
    message += `💵 *DÓLARES ($):* $${summary.totals['DOLARES $'].toFixed(2)}\n`;
    message += `💸 *EFECTIVO (Bs):* $${summary.totals['EFECTIVO'].toFixed(2)} (Bs. ${(summary.totals['EFECTIVO'] * settings.bcvRate).toLocaleString()})\n`;
    message += `📱 *PAGO MÓVIL:* $${summary.totals['PAGO MOVIL'].toFixed(2)} (Bs. ${(summary.totals['PAGO MOVIL'] * settings.bcvRate).toLocaleString()})\n`;
    message += `🔄 *TRANSF:* $${summary.totals['TRANSFERENCIA'].toFixed(2)}\n`;
    message += `💳 *PUNTO/BIO:* $${(summary.totals['PUNTO DE VENTA'] + summary.totals['BIOPAGO']).toFixed(2)}\n`;
    message += `--------------------------\n`;
    message += `💰 *TOTAL PERCIBIDO:* $${summary.totalStoreUsd.toFixed(2)}\n`;
    message += `📈 *REF BCV:* ${settings.bcvRate}\n\n`;
    message += `_Generado por Radar AI Operativo_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h3 className="text-3xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">
            {filterStoreId ? 'Mi Cierre Diario' : 'Cierre Consolidado'}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 italic">
            {filterStoreId ? 'Vista restringida a esta sucursal' : 'Panel de control financiero gerencial'}
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white border-2 border-slate-100 rounded-2xl px-6 py-3 shadow-sm">
          <Calendar size={18} className="text-[#004ea1]" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase italic">Fecha de Consulta:</span>
            <input 
              type="date" 
              className="text-xs font-black uppercase italic outline-none text-[#000814] cursor-pointer bg-transparent"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filterStoreId && (
        <div className="bg-blue-50 border-2 border-blue-100 p-5 rounded-[2rem] flex items-center gap-4 animate-pulse">
           <EyeOff size={20} className="text-blue-500" />
           <p className="text-[10px] font-black text-blue-700 uppercase italic">Modo Privacidad Activo: Los datos de otras sedes están ocultos por seguridad.</p>
        </div>
      )}

      <div className={`grid grid-cols-1 ${!filterStoreId ? 'lg:grid-cols-2' : ''} gap-10`}>
        {storeSummaries.map((summary) => (
          <div key={summary.id} className="bg-white border-4 border-slate-50 rounded-[4rem] p-10 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
            
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <Calculator size={200} />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#000814] text-white rounded-2xl flex items-center justify-center shadow-lg rotate-3">
                    <Store size={28} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">{summary.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{summary.location || 'SUCURSAL ACTIVA'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block italic mb-1">Total Percibido</span>
                  <span className="text-3xl font-black text-[#004ea1] italic tracking-tighter">${summary.totalStoreUsd.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PaymentRow icon={<DollarSign size={16}/>} label="Dólares ($)" amount={summary.totals['DOLARES $']} color="text-emerald-600" />
                <PaymentRow icon={<Wallet size={16}/>} label="Efectivo (Bs)" amount={summary.totals['EFECTIVO']} subtext={`Bs. ${(summary.totals['EFECTIVO'] * settings.bcvRate).toLocaleString()}`} />
                <PaymentRow icon={<Smartphone size={16}/>} label="Pago Móvil" amount={summary.totals['PAGO MOVIL']} subtext={`Bs. ${(summary.totals['PAGO MOVIL'] * settings.bcvRate).toLocaleString()}`} />
                <PaymentRow icon={<ArrowRightLeft size={16}/>} label="Transferencias" amount={summary.totals['TRANSFERENCIA']} />
                <PaymentRow icon={<CreditCard size={16}/>} label="Punto de Venta" amount={summary.totals['PUNTO DE VENTA']} />
                <PaymentRow icon={<Zap size={16}/>} label="Biopago" amount={summary.totals['BIOPAGO']} />
              </div>

              <div className="bg-[#000814] rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Total en Bolívares</p>
                  <p className="text-3xl font-black italic tracking-tighter">Bs. {summary.totalStoreBs.toLocaleString('es-VE')}</p>
                </div>
                <div className="relative z-10 flex gap-3">
                  <button 
                    onClick={() => sendSummaryToWhatsApp(summary)}
                    className="p-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                    title="Enviar a WhatsApp"
                  >
                    <MessageCircle size={20} />
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all shadow-lg active:scale-95"
                    title="Imprimir Reporte"
                  >
                    <Printer size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Resumen Global - SOLO VISIBLE EN VISTA GERENCIA (Sin filtro de tienda) */}
      {!filterStoreId && (
        <div className="bg-white border-4 border-slate-50 rounded-[4rem] p-12 shadow-sm animate-in slide-in-from-bottom-8">
           <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-[#004ea1] text-white rounded-2xl flex items-center justify-center shadow-xl">
                 <ShieldCheck size={32} />
              </div>
              <div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Global Percibido Consolidad</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Suma total de todas las sucursales para {formatDateToStore(selectedDate)}</p>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic block">GRAN TOTAL USD (GLOBAL)</span>
                 <div className="text-6xl font-black text-[#000814] italic tracking-tighter">
                    ${totalGlobalUsd.toFixed(2)}
                 </div>
              </div>
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic block">GRAN TOTAL BS (GLOBAL)</span>
                 <div className="text-6xl font-black text-[#004ea1] italic tracking-tighter">
                    Bs. {totalGlobalBs.toLocaleString('es-VE')}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const PaymentRow = ({ icon, label, amount, subtext, color }: any) => (
  <div className="bg-slate-50/50 border-2 border-slate-100 rounded-3xl p-5 flex items-center justify-between hover:bg-white hover:border-slate-200 transition-all">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-[#004ea1] shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase italic leading-none mb-1">{label}</p>
        <p className={`text-sm font-black italic ${color || 'text-slate-800'}`}>${amount.toFixed(2)}</p>
      </div>
    </div>
    {subtext && (
      <div className="text-right">
        <p className="text-[8px] font-black text-slate-300 uppercase italic">Ref. Bs</p>
        <p className="text-[10px] font-black text-slate-500 italic">{subtext}</p>
      </div>
    )}
  </div>
);

export default CashClosing;
