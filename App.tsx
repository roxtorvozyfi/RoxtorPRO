
import React, { useState, useEffect } from 'react';
import { Product, Order, WorkshopGroup, PaymentMethod, AppSettings } from './types';
import CatalogManager from './components/CatalogManager';
import VoiceAssistant from './components/VoiceAssistant';
import OperationsManager from './components/OperationsManager';
import { LayoutDashboard, ClipboardList, Lock, ShieldCheck, Zap, Share2, Download } from 'lucide-react';

// Helper para convertir enlaces de Google Drive en enlaces directos de imagen
export const getDirectImageUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/\/d\/([^\/]+)/) || url.match(/id=([^\&]+)/);
    if (idMatch && idMatch[1]) {
      return `https://docs.google.com/uc?export=view&id=${idMatch[1]}`;
    }
  }
  return url;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'assistant' | 'operations'>('assistant');
  
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('vozify_catalog') || '[]'));
  const [orders, setOrders] = useState<Order[]>(() => JSON.parse(localStorage.getItem('vozify_orders') || '[]'));
  const [groups, setGroups] = useState<WorkshopGroup[]>(() => JSON.parse(localStorage.getItem('vozify_groups') || '[]'));
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => JSON.parse(localStorage.getItem('vozify_payments') || '[{"id":"1","name":"Banesco","details":"Pago Móvil: 0424-9635252 RIF J-402959737"},{"id":"2","name":"Zelle","details":"Email: admin@roxtor.com (Inversiones Roxtor)"}]'));
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('vozify_settings');
    if (saved) return JSON.parse(saved);
    return {
      companyName: 'ROXTOR',
      companyRif: 'J-402959737',
      companyLogoUrl: '',
      currentBcvRate: 36.45,
      lastRateUpdate: '',
      masterPin: '2025',
      stores: [
        { id: '1', name: 'Roxtor Principal', address: 'Dirección Tienda Principal', phone: '+58 424 9635252', email: 'principal@roxtor.com', hours: 'Lun-Vie: 8am - 5pm', whatsappId: 'P', lastOrderNumber: 1000, headerTitle: 'ORDEN DE SERVICIO PRINCIPAL' },
        { id: '2', name: 'Roxtor Centro', address: 'Dirección Tienda Centro', phone: '+58 412 1234567', email: 'centro@roxtor.com', hours: 'Lun-Sab: 9am - 7pm', whatsappId: 'C', lastOrderNumber: 2000, headerTitle: 'ORDEN DE SERVICIO CENTRO' }
      ],
      designers: [
        { id: '1', name: 'Carlos Arts', specialty: 'Branding y Logotipos', phone: '+584241112233', assignedStoreId: '1' },
        { id: '2', name: 'Elena Designs', specialty: 'Ilustración Textil', phone: '+584244445566', assignedStoreId: '2' }
      ],
      agents: [
        { id: '1', name: 'Andrea Agente', responsibleName: 'Equipo Principal', privatePhone: '+584149990000', salesCount: 0, totalVolume: 0, efficiency: 0 },
        { id: '2', name: 'Marcos Cierre', responsibleName: 'Equipo Centro', privatePhone: '+584148881111', salesCount: 0, totalVolume: 0, efficiency: 0 }
      ]
    };
  });
  
  const [pinCode, setPinCode] = useState(() => localStorage.getItem('vozify_pin') || '');
  const [isLocked, setIsLocked] = useState(!!localStorage.getItem('vozify_pin'));
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    localStorage.setItem('vozify_catalog', JSON.stringify(products));
    localStorage.setItem('vozify_orders', JSON.stringify(orders));
    localStorage.setItem('vozify_settings', JSON.stringify(settings));
    localStorage.setItem('vozify_payments', JSON.stringify(paymentMethods));
    localStorage.setItem('vozify_groups', JSON.stringify(groups));
    localStorage.setItem('vozify_pin', pinCode);
  }, [products, orders, groups, paymentMethods, settings, pinCode]);

  const checkPin = () => {
    if (pinInput === pinCode) { setIsLocked(false); setPinInput(''); }
    else { setPinInput(''); alert("PIN INCORRECTO"); }
  };

  const exportDataADN = () => {
    const data = { products, orders, settings, pinCode, paymentMethods };
    const adn = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    navigator.clipboard.writeText(adn);
    alert("🧬 ADN del Sistema copiado. Pégalo en otro dispositivo para sincronizar.");
  };

  const importDataADN = () => {
    const adn = prompt("Pega el ADN del Sistema:");
    if (!adn) return;
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(adn))));
      setProducts(decoded.products);
      setOrders(decoded.orders);
      setSettings(decoded.settings);
      setPinCode(decoded.pinCode);
      if (decoded.paymentMethods) setPaymentMethods(decoded.paymentMethods);
      alert("✅ Sincronización Exitosa.");
      window.location.reload();
    } catch (e) {
      alert("❌ Error: ADN inválido.");
    }
  };

  const logoUrl = getDirectImageUrl(settings.companyLogoUrl || '');

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24 md:pb-0 overflow-x-hidden">
      {isLocked && (
        <div className="fixed inset-0 bg-blue-950 flex flex-col items-center justify-center p-6 z-[100]">
          <div className="bg-white/10 p-8 rounded-[50px] mb-12 border border-white/10 backdrop-blur-xl">
            <Lock className="text-white w-20 h-20 animate-pulse" />
          </div>
          <div className="flex gap-4 mb-14">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 border-blue-400/50 ${pinInput.length >= i ? 'bg-blue-400 scale-125' : ''}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-[320px] w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(btn => (
              <button key={btn.toString()} onClick={() => {
                  if (btn === 'C') setPinInput('');
                  else if (btn === 'OK') checkPin();
                  else if (typeof btn === 'number' && pinInput.length < 4) setPinInput(p => p + btn);
                }} className="aspect-square rounded-full flex items-center justify-center text-2xl font-black bg-blue-900/40 text-white border border-white/10">
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 px-6 h-24 flex items-center shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} className="w-14 h-14 object-contain rounded-xl shadow-lg bg-white" alt="Logo" />
            ) : (
              <div className="bg-blue-900 w-14 h-14 rounded-[22px] flex items-center justify-center font-black text-white text-2xl italic shadow-2xl">R</div>
            )}
            <div>
              <h1 className="font-black text-xl text-blue-900 uppercase italic tracking-tighter">{settings.companyName}</h1>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Soluciones Creativas</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportDataADN} className="p-3 text-blue-900 bg-blue-50 rounded-xl"><Share2 size={18}/></button>
            <button onClick={importDataADN} className="p-3 text-emerald-600 bg-emerald-50 rounded-xl"><Download size={18}/></button>
            {pinCode && <button onClick={() => setIsLocked(true)} className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><ShieldCheck size={24} /></button>}
          </div>
        </div>
      </header>

      <nav className="fixed bottom-6 left-6 right-6 bg-slate-900/95 backdrop-blur-2xl flex justify-around p-4 z-50 rounded-[35px] shadow-2xl">
        {[
          { id: 'assistant', icon: Zap, label: 'RADAR' },
          { id: 'catalog', icon: LayoutDashboard, label: 'STOCK' },
          { id: 'operations', icon: ClipboardList, label: 'GESTIÓN' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1.5 ${activeTab === tab.id ? 'text-white scale-110' : 'text-slate-50'}`}>
            <tab.icon size={24} className={activeTab === tab.id ? 'text-blue-400' : ''} />
            <span className="text-[7px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {activeTab === 'assistant' && (
          <VoiceAssistant 
            products={products} orders={orders} settings={settings} 
            onUpdateSettings={setSettings} onOrderCreated={(o) => setOrders(v => [o, ...v])} 
          />
        )}
        {activeTab === 'catalog' && <CatalogManager products={products} onAdd={(p) => setProducts(v => [...v, {...p, id: Date.now().toString()}])} onDelete={(id) => setProducts(v => v.filter(p => p.id !== id))} onUpdate={(p) => setProducts(v => v.map(old => old.id === p.id ? p : old))} onBulkAdd={(items) => setProducts(v => [...v, ...items as any])} settings={settings} />}
        {activeTab === 'operations' && (
          <OperationsManager 
            orders={orders} groups={groups} products={products} paymentMethods={paymentMethods} 
            settings={settings} onUpdateSettings={setSettings} 
            onUpdatePaymentMethods={setPaymentMethods}
            syncKey="" onSyncKeyChange={() => {}} onForceSync={() => {}} 
            onAddOrder={(o) => setOrders(v => [o, ...v])}
            onUpdateOrderStatus={(id, s) => setOrders(v => v.map(o => o.id === id ? {...o, status: s} : o))} 
            onSetPin={setPinCode} onWipeData={() => {localStorage.clear(); window.location.reload();}} currentPin={pinCode} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
