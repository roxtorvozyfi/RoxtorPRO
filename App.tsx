
import React, { useState, useEffect } from 'react';
import { Product, Order, AppSettings, Designer, PaymentRecord, AssignmentLog } from './types';
import CatalogManager from './components/CatalogManager';
import VoiceAssistant from './components/VoiceAssistant';
import OperationsManager from './components/OperationsManager';
import { LayoutDashboard, ClipboardList, Lock, ShieldCheck, Zap } from 'lucide-react';

export const getDirectImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('data:image')) return url;
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
  
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('roxtor_catalog') || '[]'));
  const [orders, setOrders] = useState<Order[]>(() => JSON.parse(localStorage.getItem('roxtor_orders') || '[]'));
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('roxtor_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.accessPin) parsed.accessPin = '1234';
      return parsed;
    }
    
    return {
      companyName: 'INVERSIONES ROXTOR C.A.',
      companyRif: 'J-402959737',
      companyLogoUrl: '',
      companyAddress: 'Puerto Ordaz, Estado Bolívar, Venezuela',
      companyPhone: '+58 424 9635252',
      companyInstagram: '@roxtor.pzo',
      currentBcvRate: 36.45,
      lastRateUpdate: '',
      accessPin: '1234',
      masterPin: '2025',
      aiTone: 'profesional',
      stores: [
        { id: '1', name: 'Roxtor Principal', address: 'Calle Principal PZO', phone: '+58 424 0000001', email: 'pzo@roxtor.com', hours: 'Lun-Vie: 8am - 5pm', whatsappId: 'P', lastOrderNumber: 1000, headerTitle: 'ORDEN DE SERVICIO PRINCIPAL' },
        { id: '2', name: 'Roxtor Centro', address: 'Av. Las Américas', phone: '+58 424 0000002', email: 'centro@roxtor.com', hours: 'Lun-Sab: 9am - 6pm', whatsappId: 'C', lastOrderNumber: 2000, headerTitle: 'ORDEN DE SERVICIO CENTRO' }
      ],
      designers: [
        { id: 't1', name: 'Alejo', specialty: 'Diseño Gráfico', phone: '584240000001', assignedStoreId: '1', role: 'diseñador' },
        { id: 't2', name: 'Emi', specialty: 'Costura Senior', phone: '584240000002', assignedStoreId: '1', role: 'costura' }
      ],
      agents: []
    };
  });
  
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    localStorage.setItem('roxtor_catalog', JSON.stringify(products));
    localStorage.setItem('roxtor_orders', JSON.stringify(orders));
    localStorage.setItem('roxtor_settings', JSON.stringify(settings));
  }, [products, orders, settings]);

  const handleUpdateOrderPayments = (orderId: string, payments: PaymentRecord[]) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const paidAmountUSD = payments.reduce((acc, p) => acc + p.amountUSD, 0);
        return {
          ...order,
          payments,
          paidAmountUSD,
          remainingAmountUSD: order.totalUSD - paidAmountUSD
        };
      }
      return order;
    }));
  };

  const handleUpdateOrderAssignment = (orderId: string, agentId: string, history: AssignmentLog[]) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, assignedToId: agentId, assignmentHistory: history } : order
    ));
  };

  const checkPin = () => {
    if (pinInput === settings.accessPin) { 
      setIsLocked(false); 
      setPinInput(''); 
    } else { 
      setPinInput(''); 
      alert("PIN DE ACCESO INCORRECTO"); 
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
          <p className="text-blue-300 font-black text-xs uppercase tracking-[0.3em] mb-4">Ingrese su clave de acceso</p>
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
                }} className="aspect-square rounded-full flex items-center justify-center text-2xl font-black bg-blue-900/40 text-white border border-white/10 active:bg-blue-400 active:text-blue-950 transition-all">
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 px-6 h-24 flex items-center shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} className="w-14 h-14 object-contain rounded-xl shadow-lg bg-white" alt="Logo" />
            ) : (
              <div className="bg-blue-900 w-14 h-14 rounded-[22px] flex items-center justify-center font-black text-white text-2xl italic shadow-2xl">R</div>
            )}
            <div>
              <h1 className="font-black text-xl text-blue-900 uppercase italic tracking-tighter leading-none">{settings.companyName}</h1>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{settings.companyInstagram} • {settings.companyRif}</p>
            </div>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-6 left-6 right-6 bg-slate-900/95 backdrop-blur-2xl flex justify-around p-4 z-50 rounded-[35px] shadow-2xl border border-white/5 print:hidden">
        {[
          { id: 'assistant', icon: Zap, label: 'RADAR' },
          { id: 'catalog', icon: LayoutDashboard, label: 'STOCK' },
          { id: 'operations', icon: ClipboardList, label: 'GESTIÓN' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-white scale-110 transform translate-y-[-5px]' : 'text-slate-400 hover:text-white'}`}>
            <tab.icon size={24} className={activeTab === tab.id ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]' : ''} />
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
            orders={orders} products={products} 
            settings={settings} onUpdateSettings={setSettings} 
            onAddOrder={(o) => setOrders(v => [o, ...v])}
            onUpdateOrderStatus={(id, s) => setOrders(v => v.map(o => o.id === id ? {...o, status: s} : o))} 
            onUpdateOrderPayments={handleUpdateOrderPayments}
            onUpdateOrderAssignment={handleUpdateOrderAssignment}
          />
        )}
      </main>
    </div>
  );
};

export default App;
