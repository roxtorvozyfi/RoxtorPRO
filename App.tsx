
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Product, Order, WorkshopGroup, PaymentMethod, AppSettings } from './types';
import CatalogManager from './components/CatalogManager';
import VoiceAssistant from './components/VoiceAssistant';
import OperationsManager from './components/OperationsManager';
import { Mic, LayoutDashboard, ClipboardList, Lock, ShieldCheck, Cloud, RefreshCw, AlertTriangle, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'assistant' | 'operations'>('assistant');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('vozify_catalog') || '[]'));
  const [orders, setOrders] = useState<Order[]>(() => JSON.parse(localStorage.getItem('vozify_orders') || '[]'));
  const [groups, setGroups] = useState<WorkshopGroup[]>(() => JSON.parse(localStorage.getItem('vozify_groups') || '[]'));
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => JSON.parse(localStorage.getItem('vozify_payments') || '[]'));
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('vozify_settings');
    if (saved) return JSON.parse(saved);
    return {
      companyName: 'INVERSIONES ROXTOR, C.A',
      companyRif: 'J-402959737',
      companyPhone: '+58 424 9635252',
      companyAddress: 'Bolívar, Venezuela',
      absenceMessage: 'Hola, estamos en producción...',
      companyLogo: ''
    };
  });
  
  const [syncKey, setSyncKey] = useState(() => localStorage.getItem('vozify_sync_key') || '');
  const [pinCode, setPinCode] = useState(() => localStorage.getItem('vozify_pin') || '');
  const [isLocked, setIsLocked] = useState(!!localStorage.getItem('vozify_pin'));
  const [pinInput, setPinInput] = useState('');

  const syncWithCloud = useCallback(async (key: string, dataToPush?: any) => {
    if (!key) return;
    setSyncStatus('syncing');
    try {
      const STORAGE_URL = `https://kvstore.com/api/v1/items/${key}`;
      if (dataToPush) {
        await fetch(STORAGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...dataToPush, updatedAt: new Date().toISOString() })
        });
      } else {
        const response = await fetch(STORAGE_URL);
        if (response.ok) {
          const cloudData = await response.json();
          if (cloudData.products) setProducts(cloudData.products);
          if (cloudData.orders) setOrders(cloudData.orders);
          if (cloudData.settings) setSettings(cloudData.settings);
        }
      }
      setSyncStatus('success');
    } catch (e) { setSyncStatus('error'); }
  }, []);

  useEffect(() => {
    localStorage.setItem('vozify_catalog', JSON.stringify(products));
    localStorage.setItem('vozify_orders', JSON.stringify(orders));
    localStorage.setItem('vozify_settings', JSON.stringify(settings));
    localStorage.setItem('vozify_payments', JSON.stringify(paymentMethods));
    if (syncKey) syncWithCloud(syncKey, { products, orders, groups, paymentMethods, settings });
  }, [products, orders, groups, paymentMethods, settings, syncKey, syncWithCloud]);

  const checkPin = () => {
    if (pinInput === pinCode) { setIsLocked(false); setPinInput(''); }
    else { setPinInput(''); alert("PIN INCORRECTO"); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24 md:pb-0 overflow-x-hidden">
      {isLocked && (
        <div className="fixed inset-0 bg-blue-950 flex flex-col items-center justify-center p-6 z-[100] animate-in fade-in duration-500">
          <div className="bg-yellow-400/20 p-8 rounded-[40px] mb-8 border-2 border-yellow-400/30">
            <Lock className="text-yellow-400 w-16 h-16" />
          </div>
          <h2 className="text-white text-3xl font-black mb-10 italic tracking-tighter uppercase">Roxtor <span className="text-red-500">Security</span></h2>
          <div className="flex gap-4 mb-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`w-5 h-5 rounded-full border-2 border-yellow-400 ${pinInput.length >= i ? 'bg-yellow-400 scale-125 shadow-lg' : ''}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-[300px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(btn => (
              <button key={btn.toString()} onClick={() => {
                if (btn === 'C') setPinInput('');
                else if (btn === 'OK') checkPin();
                else if (typeof btn === 'number' && pinInput.length < 4) setPinInput(p => p + btn);
              }} className="w-16 h-16 rounded-full bg-blue-900 text-white text-2xl font-black shadow-xl active:scale-90 transition-all border border-blue-800">
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}

      <header className="bg-white border-b sticky top-0 z-40 px-4 h-20 shadow-sm">
        <div className="max-w-4xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-2xl italic shadow-lg overflow-hidden">
              {settings.companyLogo ? (
                <img src={settings.companyLogo} className="w-full h-full object-contain" />
              ) : (
                'R'
              )}
            </div>
            <div className="hidden sm:block">
              <h1 className="font-black text-lg text-blue-900 uppercase italic leading-none">{settings.companyName.split(',')[0]} <span className="text-red-600">Vozify</span></h1>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Smart Sales OS</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {syncKey && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black ${syncStatus === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                {syncStatus === 'syncing' ? <RefreshCw size={10} className="animate-spin"/> : <Cloud size={10}/>}
                <span className="hidden xs:inline">NUBE OK</span>
              </div>
            )}
            <button onClick={() => setIsLocked(true)} className="p-2 text-slate-300 hover:text-blue-900 transition-colors">
              <ShieldCheck size={28} />
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-slate-100 flex justify-around p-3 md:hidden z-50 rounded-[32px] shadow-2xl">
        {[
          { id: 'assistant', icon: Zap, label: 'PILOTO' },
          { id: 'catalog', icon: LayoutDashboard, label: 'CATÁLOGO' },
          { id: 'operations', icon: ClipboardList, label: 'GESTIÓN' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-blue-900 scale-110 font-black' : 'text-slate-400 font-bold'}`}>
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 3 : 2} />
            <span className="text-[8px] uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {activeTab === 'assistant' && <VoiceAssistant products={products} orders={orders} groups={groups} paymentMethods={paymentMethods} settings={settings} onOrderCreated={(o) => setOrders(v => [o, ...v])} />}
        {activeTab === 'catalog' && <CatalogManager products={products} onAdd={(p) => setProducts(v => [...v, {...p, id: Date.now().toString()}])} onDelete={(id) => setProducts(v => v.filter(p => p.id !== id))} onUpdate={(p) => setProducts(v => v.map(old => old.id === p.id ? p : old))} onBulkAdd={(items) => setProducts(v => [...v, ...items as any])} settings={settings} />}
        {activeTab === 'operations' && <OperationsManager orders={orders} groups={groups} products={products} paymentMethods={paymentMethods} settings={settings} onUpdateSettings={setSettings} syncKey={syncKey} onSyncKeyChange={setSyncKey} onForceSync={() => syncWithCloud(syncKey)} onAddGroup={(g) => setGroups(v => [...v, {...g, id: Date.now().toString()}])} onDeleteGroup={(id) => setGroups(v => v.filter(g => g.id !== id))} onAddPayment={(p) => setPaymentMethods(v => [...v, {...p, id: Date.now().toString()}])} onUpdatePayment={(p) => setPaymentMethods(v => v.map(old => old.id === p.id ? p : old))} onDeletePayment={(id) => setPaymentMethods(v => v.filter(pm => pm.id !== id))} onUpdateOrderStatus={(id, s) => setOrders(v => v.map(o => o.id === id ? {...o, status: s} : o))} onSetPin={setPinCode} onWipeData={() => {localStorage.clear(); window.location.reload();}} currentPin={pinCode} />}
      </main>
    </div>
  );
};

export default App;
