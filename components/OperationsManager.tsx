
import React, { useState, useRef } from 'react';
import { Order, WorkshopGroup, Product, PaymentMethod, AppSettings } from '../types';
import { ClipboardList, Users, Plus, Trash2, Wallet, RefreshCw, Lock, ShieldCheck, Key, Settings, Zap, Globe, Download, ExternalLink, Camera, Image as ImageIcon, MapPin, Phone, Hash } from 'lucide-react';

interface Props {
  orders: Order[];
  groups: WorkshopGroup[];
  products: Product[];
  paymentMethods: PaymentMethod[];
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  syncKey: string;
  onSyncKeyChange: (key: string) => void;
  onForceSync: () => void;
  onAddGroup: (group: Omit<WorkshopGroup, 'id'>) => void;
  onDeleteGroup: (id: string) => void;
  onAddPayment: (payment: Omit<PaymentMethod, 'id'>) => void;
  onUpdatePayment: (payment: PaymentMethod) => void;
  onDeletePayment: (id: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onSetPin: (pin: string) => void;
  onWipeData: () => void;
  currentPin: string;
}

const OperationsManager: React.FC<Props> = ({ orders, groups, products, paymentMethods, settings, onUpdateSettings, syncKey, onSyncKeyChange, onForceSync, onAddGroup, onDeleteGroup, onAddPayment, onUpdatePayment, onDeletePayment, onUpdateOrderStatus, onSetPin, onWipeData, currentPin }) => {
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'security' | 'cloud' | 'profile'>('orders');
  const [pinInput, setPinInput] = useState(currentPin);
  const [localSyncKey, setLocalSyncKey] = useState(syncKey);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({ ...settings, companyLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadOrderReceipt = (order: Order) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 800; canvas.height = 1100;

    const render = (logoImg?: HTMLImageElement) => {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1e3a8a'; ctx.fillRect(0, 0, canvas.width, 240);
      
      if (logoImg) {
        ctx.drawImage(logoImg, 40, 40, 160, 160);
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Inter';
      ctx.fillText(settings.companyName, logoImg ? 220 : 50, 90);
      ctx.font = '20px Inter';
      ctx.fillText(`RIF: ${settings.companyRif}`, logoImg ? 220 : 50, 130);
      ctx.fillText(settings.companyPhone, logoImg ? 220 : 50, 165);

      ctx.fillStyle = '#0f172a'; ctx.font = '900 32px Inter'; ctx.fillText(`CLIENTE: ${order.clientName.toUpperCase()}`, 50, 320);
      ctx.font = 'bold 20px Inter'; ctx.fillStyle = '#64748b';
      ctx.fillText(`ORDEN: #${order.orderNumber} | FECHA: ${new Date().toLocaleDateString()}`, 50, 360);
      
      let y = 490;
      order.items.forEach(item => {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 22px Inter'; ctx.fillText(`${item.quantity}x ${item.name}`, 50, y);
        ctx.textAlign = 'right'; ctx.fillText(`$${(item.price * item.quantity).toFixed(2)}`, 750, y);
        ctx.textAlign = 'left'; y += 60;
      });
      ctx.fillStyle = '#1e3a8a'; ctx.font = '900 50px Inter'; ctx.textAlign = 'right';
      ctx.fillText(`TOTAL: $${order.total.toFixed(2)}`, 750, 950);
      
      const link = document.createElement('a');
      link.download = `Orden_${order.orderNumber}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    };

    if (settings.companyLogo) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => render(img);
      img.src = settings.companyLogo;
    } else render();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex bg-slate-200/50 p-1.5 rounded-[24px] w-full border border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'orders', label: 'PEDIDOS', icon: ClipboardList },
          { id: 'profile', label: 'PERFIL', icon: Zap },
          { id: 'cloud', label: 'NUBE', icon: Globe },
          { id: 'security', label: 'SEGURIDAD', icon: ShieldCheck }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`flex-1 min-w-[80px] flex flex-col sm:flex-row items-center justify-center gap-2 py-3 rounded-[18px] text-[9px] font-black transition-all ${activeSubTab === tab.id ? 'bg-white text-blue-900 shadow-md' : 'text-slate-500'}`}>
            <tab.icon size={14} />
            <span className="uppercase">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeSubTab === 'profile' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <div className="bg-white border rounded-[40px] p-8 shadow-sm space-y-8">
            <div className="flex flex-col items-center gap-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo de Empresa</label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden relative group"
              >
                {settings.companyLogo ? (
                  <img src={settings.companyLogo} className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon size={40} className="text-slate-300" />
                )}
                <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><Zap size={10}/> Nombre Empresa</label>
                <input className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" value={settings.companyName} onChange={e => onUpdateSettings({...settings, companyName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><Hash size={10}/> RIF</label>
                <input className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" value={settings.companyRif} onChange={e => onUpdateSettings({...settings, companyRif: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><Phone size={10}/> WhatsApp</label>
                <input className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" value={settings.companyPhone} onChange={e => onUpdateSettings({...settings, companyPhone: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><MapPin size={10}/> Dirección</label>
                <input className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" value={settings.companyAddress} onChange={e => onUpdateSettings({...settings, companyAddress: e.target.value})} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'orders' && (
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-black text-blue-900 text-[10px] tracking-widest uppercase italic">Historial Roxtor</h3>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black">{orders.length} VENTAS</span>
          </div>
          {orders.map(order => (
            <div key={order.id} className="bg-white border rounded-[30px] p-6 shadow-sm flex flex-col gap-4 border-slate-100 group hover:border-blue-400 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-black text-blue-900 text-lg tracking-tighter">#{order.orderNumber}</span>
                  <p className="font-black text-red-600 text-[10px] uppercase mt-1">{order.clientName}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadOrderReceipt(order)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-blue-900 hover:text-white transition-all shadow-sm">
                    <Download size={18}/>
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase">
                    <span>{it.quantity}x {it.name}</span>
                    <span>${(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <select 
                  value={order.status} 
                  onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as any)}
                  className={`text-[9px] font-black uppercase px-4 py-2 rounded-full border-none outline-none ${order.status === 'pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="listo">Listo</option>
                  <option value="entregado">Entregado</option>
                </select>
                <span className="font-black text-blue-900 text-lg">$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'cloud' && (
        <div className="bg-blue-900 rounded-[40px] p-10 text-white shadow-2xl space-y-8 border-2 border-yellow-400">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-400 p-4 rounded-3xl text-blue-900 shadow-xl"><Zap size={24}/></div>
            <div>
              <h3 className="font-black text-xl italic uppercase tracking-tighter">Roxtor Cloud</h3>
              <p className="text-[10px] font-bold text-blue-300 tracking-widest uppercase">Sincronizar Equipo</p>
            </div>
          </div>
          <div className="space-y-3">
            <input type="text" className="w-full bg-blue-950 border-none rounded-2xl px-6 py-5 text-yellow-400 font-black uppercase outline-none focus:ring-2 focus:ring-yellow-400 tracking-widest" value={localSyncKey} onChange={e => setLocalSyncKey(e.target.value.toUpperCase())} placeholder="CÓDIGO DE EQUIPO"/>
            <button onClick={() => onSyncKeyChange(localSyncKey)} className="w-full bg-yellow-400 text-blue-900 py-5 rounded-2xl font-black text-xs uppercase shadow-xl">VINCULAR EQUIPO</button>
          </div>
        </div>
      )}

      {activeSubTab === 'security' && (
        <div className="bg-white border rounded-[40px] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-red-50 text-red-600 rounded-3xl"><ShieldCheck size={28}/></div>
            <h3 className="font-black text-blue-900 uppercase text-lg italic tracking-tighter">Seguridad Roxtor</h3>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Pin de Bloqueo (4 Dígitos)</label>
            <input type="password" maxLength={4} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-center text-2xl font-black tracking-[1em] outline-none" value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}/>
            <button onClick={() => onSetPin(pinInput)} className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase shadow-lg">GUARDAR NUEVO PIN</button>
          </div>
          <button onClick={onWipeData} className="w-full py-4 text-red-400 text-[10px] font-black uppercase hover:text-red-600 transition-colors">Borrar todos los datos de esta App</button>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Version 1.2.3 • INVERSIONES ROXTOR C.A</span>
      </div>
    </div>
  );
};

export default OperationsManager;