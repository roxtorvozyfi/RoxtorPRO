
import React from 'react';
import { Order, AppSettings } from '../types';
import { Printer, X, ShieldAlert, Image as ImageIcon, Zap, ShieldCheck } from 'lucide-react';

interface Props {
  order: Order;
  settings: AppSettings;
  onClose: () => void;
}

const OrderReceipt: React.FC<Props> = ({ order, settings, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const bcvRate = order.bcvRate || 0;
  const restanteBs = (order.restanteUsd || 0) * bcvRate;
  const isPending = order.restanteUsd > 0;
  const isDirect = order.isDirectSale === true;

  return (
    <div className="fixed inset-0 z-[100] bg-[#000814]/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border-8 border-white/10">
        
        {/* Barra de Herramientas del Preview */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${isDirect ? 'bg-[#004ea1]' : 'bg-[#000814]'} text-white rounded-2xl flex items-center justify-center shadow-lg rotate-3`}>
              {isDirect ? <Zap size={24} /> : <Printer size={24} />}
            </div>
            <div>
              <h4 className="text-sm font-black text-[#000814] uppercase tracking-tighter italic">
                {isDirect ? 'Nota de Entrega' : 'Orden de Servicio'}
              </h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trazabilidad Roxtor #{order.orderNumber}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handlePrint}
              className={`bg-[#004ea1] text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl active:scale-95 border-b-4 border-blue-900`}
            >
              <Printer size={18} /> IMPRIMIR / PDF
            </button>
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Area Imprimible */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-100/50">
          <div id="printable-order" className="bg-white mx-auto shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-[15mm] text-[#000814] font-sans print:shadow-none print:p-0 print:m-0 relative overflow-hidden">
            
            {/* Marca de Agua */}
            {isDirect ? (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[35deg] opacity-[0.03] pointer-events-none select-none">
                  <p className="text-[120px] font-black border-[20px] border-[#004ea1] text-[#004ea1] px-10 rounded-[60px] leading-none">PAGADO</p>
               </div>
            ) : isPending && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[35deg] opacity-[0.04] pointer-events-none select-none">
                <p className="text-[180px] font-black border-[30px] border-rose-600 text-rose-600 px-20 rounded-[100px] leading-none">DEUDA</p>
              </div>
            )}

            {/* Header Factura */}
            <div className="flex justify-between items-start border-b-[6px] border-[#000814] pb-8 mb-8">
              <div className="flex items-center gap-8">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="h-24 w-auto object-contain" />
                ) : (
                  <div className="w-24 h-24 bg-[#000814] text-white flex items-center justify-center text-5xl font-black italic rounded-[2rem] shadow-xl rotate-3">R</div>
                )}
                <div>
                  <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">{settings.businessName}</h1>
                  <p className="text-[11px] font-bold text-rose-600 uppercase tracking-[0.2em] mt-2">{settings.slogan}</p>
                  <div className="mt-5 text-[10px] font-bold text-slate-500 space-y-1 uppercase">
                    <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> IG: @{settings.instagram}</p>
                    <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> SEDE: {settings.stores.find(s => s.id === order.storeId)?.name || 'PRINCIPAL'}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-white px-8 py-4 rounded-[2rem] inline-block mb-3 shadow-xl ${isDirect ? 'bg-[#004ea1]' : 'bg-[#000814]'}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">
                    {isDirect ? 'Nota de Entrega' : 'Orden de Pedido'}
                  </p>
                  <p className="text-4xl font-black italic tracking-tighter">{order.orderNumber}</p>
                </div>
                <div className="text-[11px] font-black space-y-1.5">
                  <p className="flex items-center justify-end gap-2"><span className="text-slate-400 italic font-bold">FECHA EMISIÓN:</span> {order.issueDate}</p>
                </div>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="grid grid-cols-2 gap-10 mb-10">
              <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border-2 border-slate-100 shadow-inner">
                <p className="text-[10px] font-black text-[#004ea1] uppercase tracking-[0.2em] mb-4 italic">IDENTIFICACIÓN CLIENTE</p>
                <div className="space-y-3">
                  <p className="text-xl font-black uppercase italic leading-none text-slate-800">{order.customerName}</p>
                  <div className="h-px bg-slate-200 w-12 my-2"></div>
                  <p className="text-xs font-bold text-slate-500">C.I / R.I.F: <span className="text-[#000814] font-black ml-2">{order.customerCi || '---'}</span></p>
                  <p className="text-xs font-bold text-slate-500">CONTACTO: <span className="text-[#000814] font-black ml-2">{order.customerPhone || '---'}</span></p>
                </div>
              </div>
              <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border-2 border-slate-100 shadow-inner">
                <p className="text-[10px] font-black text-[#004ea1] uppercase tracking-[0.2em] mb-4 italic">DETALLES DOCUMENTO</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">TIPO:</span>
                    <span className={`px-3 py-1 rounded-xl font-black uppercase text-[10px] italic shadow-sm ${isDirect ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'}`}>
                      {isDirect ? 'VENTA DIRECTA' : 'PEDIDO SERVICIO'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500">REFERENCIA BCV: <span className="text-[#000814] font-black ml-2">Bs. {bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span></p>
                  <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 italic bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <ShieldCheck size={12} /> GARANTÍA ROXTOR ACTIVA
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de Items */}
            <div className="mb-8 rounded-[2rem] border-2 border-[#000814] overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#000814] text-white">
                    <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] italic">CANT.</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] italic">DETALLE DE VENTA / SERVICIO</th>
                    <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] italic">P. UNIT ($)</th>
                    <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] italic">TOTAL ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 italic">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="px-6 py-4 font-black text-slate-800 text-sm">{item.quantity}</td>
                      <td className="px-6 py-4">
                        <p className="font-black text-xs uppercase text-slate-700 tracking-tight">{item.name}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-500 text-xs">${item.priceUsd.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-black text-[#000814] text-sm">${(item.priceUsd * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bloque Inferior Financiero */}
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-7 space-y-4">
                <div className="bg-slate-50 rounded-[2rem] p-6 border-2 border-slate-100 shadow-inner">
                  <p className="text-[9px] font-black text-[#004ea1] uppercase tracking-[0.2em] mb-3 italic">INFORMACIÓN FINANCIERA</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase italic">Forma de Pago:</p>
                      <p className="text-xs font-black text-slate-800 uppercase italic flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {order.paymentMethod || 'EFECTIVO'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase italic">Referencia:</p>
                      <p className="text-xs font-black text-[#004ea1] uppercase italic truncate">{order.paymentReference || 'CONTADO'}</p>
                    </div>
                  </div>
                </div>

                {!isDirect && (
                  <div className="bg-slate-50 rounded-[2rem] p-6 border-2 border-slate-100 shadow-inner">
                    <p className="text-[9px] font-black text-[#004ea1] uppercase tracking-[0.2em] mb-2 italic">NOTAS TÉCNICAS</p>
                    <p className="text-[10px] text-slate-600 font-bold leading-relaxed whitespace-pre-line uppercase italic">
                      {order.technicalDetails || 'PROCEDIMIENTO ESTÁNDAR.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="col-span-5">
                <div className={`rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden text-white ${isDirect ? 'bg-[#004ea1]' : 'bg-[#000814]'}`}>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center opacity-40">
                      <span className="text-[9px] font-black uppercase italic tracking-widest">SUBTOTAL VENTA:</span>
                      <span className="text-base font-black italic tracking-tighter">${order.totalUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase italic tracking-widest">PAGADO / ABONO:</span>
                      <span className="text-xl font-black italic tracking-tighter">-${order.abonoUsd.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black uppercase italic tracking-widest">
                        {isPending ? 'POR COBRAR:' : 'TOTAL CANCELADO:'}
                      </span>
                      <div className="text-right">
                        <p className="text-3xl font-black italic leading-none tracking-tighter">
                          ${order.restanteUsd.toFixed(2)}
                        </p>
                        <p className="text-[9px] font-black text-slate-300 mt-1 uppercase italic">Bs. {restanteBs.toLocaleString('es-VE')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN DE TÉRMINOS Y CONDICIONES (REGLAS GENERALES ACTUALIZADAS) */}
            <div className="mt-8 bg-rose-50/50 border-2 border-rose-100 rounded-[2rem] p-6">
              <div className="flex items-center gap-3 mb-3 border-b border-rose-100 pb-2">
                <ShieldAlert size={14} className="text-rose-600" />
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-[0.3em] italic">REGLAS GENERALES DEL SERVICIO</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
                <ConditionItem text="1. TODO TRABAJO REQUIERE DEL 50% MINIMO DEL PAGO PARA PODER SER PROCESADO." />
                <ConditionItem text="2. DESPUES QUE EL DISEÑO ESTE APROBADO POR EL CLIENTE, NO SE REALIZAN CAMBIOS." />
                <ConditionItem text="3. REVISE SU PEDIDO ANTES DE RETIRAR." />
                <ConditionItem text="4. NO SE HACEN DEVOLUCIONES DE DINERO, SIN EXCEPCION." />
              </div>
            </div>

            {/* SECCIÓN DE IMÁGENES */}
            {!isDirect && order.referenceImages && order.referenceImages.length > 0 && (
              <div className="mt-8 border-t-2 border-slate-100 pt-6">
                <p className="text-[9px] font-black text-[#004ea1] uppercase tracking-[0.2em] mb-4 italic flex items-center gap-2">
                  <ImageIcon size={14} /> REFERENCIAS DE DISEÑO
                </p>
                <div className="grid grid-cols-5 gap-4">
                  {order.referenceImages.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
                      <img src={img} alt={`Ref ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Firmas */}
            <div className="mt-16 grid grid-cols-2 gap-20 px-8 pb-6">
              <div className="text-center">
                <div className="border-t-[2px] border-slate-200 pt-3">
                  <p className="text-[10px] font-black uppercase tracking-widest italic text-slate-800">{settings.businessName}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">FIRMA AUTORIZADA</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-[2px] border-slate-200 pt-3">
                  <p className="text-[10px] font-black uppercase tracking-widest italic text-slate-800">{order.customerName}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">ACEPTACIÓN CLIENTE</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-slate-50 text-center">
              <p className="text-[9px] font-black text-[#004ea1] uppercase tracking-[0.4em] italic opacity-60">
                SISTEMA OPERATIVO ROXTOR • {isDirect ? 'NOTA DE ENTREGA' : 'EXPEDIENTE DE SERVICIO'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-order, #printable-order * { visibility: visible; }
          #printable-order { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 0; 
            margin: 0; 
            box-shadow: none; 
          }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
};

const ConditionItem = ({ text }: { text: string }) => (
  <div className="flex gap-2 items-start">
    <div className="w-1 h-1 bg-rose-600 rounded-full shrink-0 mt-1" />
    <p className="text-[7px] font-black text-rose-600 uppercase leading-tight italic tracking-tighter">
      {text}
    </p>
  </div>
);

export default OrderReceipt;
