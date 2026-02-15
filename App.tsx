
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Order, AppSettings, Agent, StoreConfig, Workshop } from './types';
import Radar from './components/Radar';
import Inventory from './components/Inventory';
import Gestion from './components/Gestion';
import Operaciones from './components/Operaciones';
import { 
  Radar as RadarIcon, 
  Package, 
  Briefcase,
  Lock,
  Instagram,
  MapPin,
  Activity,
  ShieldCheck,
  Cloud,
  CloudOff,
  MonitorSmartphone,
  HardDrive,
  Power,
  Zap,
  ChevronRight,
  ShieldAlert,
  Download,
  Key
} from 'lucide-react';

const App: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'radar' | 'operaciones' | 'stock' | 'gestion'>('radar');
  const [currentStoreId, setCurrentStoreId] = useState<string>('store_1');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [products, setProducts] = useState<Product[]>([
    { id: 'p1', storeId: 'global', name: 'FRANELA MICRODURAZNO', priceRetail: 8, priceWholesale: 5.5, material: 'MICRODURAZNO Premium', description: 'Ideal para sublimación', stock: 100, category: 'producto' },
    { id: 'p2', storeId: 'global', name: 'GORRA TRUCKER BORDADA', priceRetail: 12, priceWholesale: 8, material: 'Malla y Acrílico', description: 'Incluye logo frontal', stock: 50, category: 'producto' },
    { id: 'p3', storeId: 'global', name: 'SERVICIO BORDADO LOGO', priceRetail: 5, priceWholesale: 3, material: 'Hilos Madeira', description: 'Hasta 10.000 puntadas', stock: 0, category: 'servicio' }
  ]);
  
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [agents, setAgents] = useState<Agent[]>([
    { 
      id: 'a1', 
      name: 'ALEJANDRO', 
      role: 'OPERACIONES', 
      storeId: 'store_1', 
      specialty: 'DISEÑOS JR/CORTES VINIL/DTF/TECNICO SUBLIMACION/SELLOS', 
      phone: '+584128798816' 
    },
    { 
      id: 'a2', 
      name: 'EMIRIUSKA', 
      role: 'AGENTE DE VENTAS', 
      storeId: 'store_1', 
      specialty: 'COORDINACION Y ASINACION TAREAS/INVENTARIO/GESTION CLIENTES', 
      phone: '+584249185159' 
    }
  ]);

  const [workshops, setWorkshops] = useState<Workshop[]>([
    { id: 'w1', name: 'TALLER DOÑA JUANA', department: 'COSTURA', phone: '04120000000', storeId: 'store_1' },
    { id: 'w2', name: 'ESTAMPADOS RAPID-ZAP', department: 'DTF', phone: '04121111111', storeId: 'store_1' }
  ]);

  const [isLocked, setIsLocked] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  
  const [settings, setSettings] = useState<AppSettings>({
    masterPin: '1234',
    loginPin: '0000',
    businessName: 'ROXTOR',
    slogan: 'PERSONALIZACIÓN PROFESIONAL',
    instagram: 'ROXTOR.PZO',
    companyPhone: '+584249635252',
    preferredTone: 'cercano',
    bcvRate: 0,
    logoUrl: '',
    encryptionKey: 'roxtor_secure_key',
    pagoMovil: {
      bank: 'BANCAMIGA (0172)',
      idNumber: '18806871',
      phone: '04249635252'
    },
    stores: [
      { id: 'store_1', name: 'ROXTOR PRINCIPAL', location: 'Puerto Ordaz', prefix: 'P', nextOrderNumber: 1, nextDirectSaleNumber: 1 },
      { id: 'store_2', name: 'ROXTOR CENTRO', location: 'Centro PZO', prefix: 'C', nextOrderNumber: 1, nextDirectSaleNumber: 1 }
    ]
  });

  const syncToSupabase = useCallback(async () => {
    if (!isOnline || !settings.cloudSync?.enabled || !settings.cloudSync.apiUrl) return;
    setSyncStatus('syncing');
    try {
      const data = {
        store_id: currentStoreId,
        last_sync: new Date().toISOString(),
        payload: { products, orders, agents, workshops, settings }
      };
      // Usamos el endpoint REST de Supabase con Upsert habilitado mediante 'resolution=merge-duplicates'
      const response = await fetch(`${settings.cloudSync.apiUrl}/rest/v1/roxtor_sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': settings.cloudSync.apiKey,
          'Authorization': `Bearer ${settings.cloudSync.apiKey}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(data)
      });
      if (response.ok) setSyncStatus('synced');
      else throw new Error('Sync failed');
    } catch (e) {
      console.error('Supabase Sync Error:', e);
      setSyncStatus('offline');
    }
  }, [isOnline, settings.cloudSync, products, orders, agents, workshops, currentStoreId, settings]);

  useEffect(() => {
    const savedProducts = localStorage.getItem('erp_products');
    const savedOrders = localStorage.getItem('erp_orders');
    const savedSettings = localStorage.getItem('erp_settings');
    const savedAgents = localStorage.getItem('erp_agents');
    const savedWorkshops = localStorage.getItem('erp_workshops');
    
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    if (savedAgents) setAgents(JSON.parse(savedAgents));
    if (savedWorkshops) setWorkshops(JSON.parse(savedWorkshops));
    if (savedSettings) setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
  }, []);

  // Efecto de sincronización periódica
  useEffect(() => {
    if (isSessionActive && settings.cloudSync?.enabled) {
      const timer = setTimeout(() => {
        syncToSupabase();
      }, 5000); // Esperar 5 seg tras cambios para no saturar
      return () => clearTimeout(timer);
    }
  }, [products, orders, settings, agents, workshops, isSessionActive, syncToSupabase, settings.cloudSync?.enabled]);

  useEffect(() => {
    if (isSessionActive) {
      localStorage.setItem('erp_products', JSON.stringify(products));
      localStorage.setItem('erp_orders', JSON.stringify(orders));
      localStorage.setItem('erp_settings', JSON.stringify(settings));
      localStorage.setItem('erp_agents', JSON.stringify(agents));
      localStorage.setItem('erp_workshops', JSON.stringify(workshops));
    }
  }, [products, orders, settings, agents, workshops, isSessionActive]);

  const handleUnlockMaster = (pin: string) => {
    if (pin === settings.masterPin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const handleLogin = (pin: string) => {
    if (pin === settings.loginPin) {
      setIsSessionActive(true);
      return true;
    }
    return false;
  };

  if (!isSessionActive) {
    return <LandingPage settings={settings} onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      <div className={`${!isOnline ? 'bg-rose-600' : 'bg-[#000814]'} h-10 flex items-center justify-between px-6 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-colors duration-500 z-50`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            {!isOnline ? <CloudOff size={12} className="text-white/50" /> : <Cloud size={12} className="text-blue-400" />}
            <span>NUBE: {syncStatus.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <button onClick={() => setIsSessionActive(false)} className="bg-white/10 hover:bg-rose-500 hover:text-white px-3 py-1 rounded-lg flex items-center gap-2 transition-all">
             <Power size={10} /> CERRAR SESIÓN
           </button>
           <div className="flex items-center gap-2">
              <Activity size={10} className={syncStatus === 'syncing' ? 'animate-spin text-amber-400' : 'text-emerald-400'} />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
           </div>
        </div>
      </div>

      <header className="h-24 border-b bg-white flex items-center justify-between px-6 z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 border-r border-slate-100 pr-6">
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-2xl shadow-sm border border-slate-100 p-1" />
              ) : (
                <div className="w-full h-full bg-[#000814] rounded-2xl flex items-center justify-center text-white italic font-black text-2xl shadow-lg rotate-3">R</div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter text-[#000814] italic uppercase leading-none">{settings.businessName}</span>
              <span className="text-[10px] font-bold text-rose-600 tracking-[0.05em] uppercase italic">{settings.slogan}</span>
            </div>
          </div>
          {activeTab !== 'operaciones' && (
            <div className="relative group">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">VISTA GLOBAL</span>
                <select value={currentStoreId} onChange={(e) => setCurrentStoreId(e.target.value)} className="appearance-none bg-blue-50/50 border-2 border-blue-100/50 rounded-xl px-4 py-2 pr-10 text-xs font-black text-[#004ea1] uppercase italic tracking-wider outline-none cursor-pointer">
                  {settings.stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!isLocked ? (
            <button onClick={() => setIsLocked(true)} className="bg-[#000814] text-white px-6 py-3 rounded-2xl text-[10px] font-black flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> MODO GERENTE
            </button>
          ) : (
             <button onClick={() => setActiveTab('gestion')} className="flex items-center gap-3 text-slate-400 bg-slate-100 px-6 py-3 rounded-2xl text-[10px] font-black border border-slate-200">
               <Lock size={12} className="text-slate-300" /> VISTA RESTRINGIDA
             </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 bg-slate-50/50">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'radar' && (
            <Radar products={products} settings={settings} currentStoreId={currentStoreId} onNewOrder={(o) => setOrders([o, ...orders])} onUpdateSettings={(s) => setSettings(s)} />
          )}
          {activeTab === 'operaciones' && (
            <Operaciones orders={orders} setOrders={setOrders} products={products} agents={agents} workshops={workshops} settings={settings} setSettings={setSettings} currentStoreId={currentStoreId} />
          )}
          {activeTab === 'stock' && (
            <Inventory products={products} setProducts={setProducts} currentStoreId={currentStoreId} />
          )}
          {activeTab === 'gestion' && (
            isLocked ? <PINScreen onUnlock={handleUnlockMaster} label="Panel Gerencial" icon={<Lock size={40} />} /> : (
              <Gestion orders={orders} setOrders={setOrders} products={products} agents={agents} setAgents={setAgents} workshops={workshops} setWorkshops={setWorkshops} settings={settings} setSettings={setSettings} currentStoreId={currentStoreId} />
            )
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#000814] border-t border-white/5 flex items-center justify-center gap-4 md:gap-12 px-4 z-30 shadow-2xl">
        <TabItem active={activeTab === 'radar'} onClick={() => setActiveTab('radar')} icon={<RadarIcon size={22}/>} label="Radar" />
        <TabItem active={activeTab === 'operaciones'} onClick={() => setActiveTab('operaciones'} icon={<Zap size={22}/>} label="Operaciones" />
        <TabItem active={activeTab === 'stock'} onClick={() => setActiveTab('stock')} icon={<Package size={22}/>} label="Inventario" />
        <TabItem active={activeTab === 'gestion'} onClick={() => setActiveTab('gestion')} icon={<ShieldCheck size={22}/>} label="Gerencia" />
      </nav>
    </div>
  );
};

const LandingPage = ({ settings, onLogin }: any) => {
  const [showPin, setShowPin] = useState(false);
  return (
    <div className="h-screen w-screen bg-[#000814] flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
      {!showPin ? (
        <div className="relative z-10 flex flex-col items-center gap-12 animate-in fade-in zoom-in duration-1000">
           <div className="relative">
             <div className="absolute inset-0 bg-blue-400/20 blur-3xl rounded-full scale-150"></div>
             {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-56 h-56 object-contain relative z-10 drop-shadow-[0_0_50px_rgba(59,130,246,0.3)] hover:scale-110 transition-transform duration-700" />
             ) : (
                <div className="w-56 h-56 bg-white text-[#000814] rounded-[4rem] flex items-center justify-center text-8xl font-black italic shadow-2xl rotate-3 relative z-10">R</div>
             )}
           </div>
           <div className="text-center space-y-4">
             <h1 className="text-7xl font-black italic tracking-tighter text-white uppercase leading-none tracking-tighter">
                {settings.businessName} <span className="text-blue-500">ERP</span>
             </h1>
             <p className="text-slate-500 font-black text-xs uppercase tracking-[0.5em] italic">{settings.slogan}</p>
           </div>
           <button 
             onClick={() => setShowPin(true)}
             className="group flex items-center gap-6 bg-white text-[#000814] pl-10 pr-4 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all duration-500 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-blue-500/20"
           >
             INICIAR SISTEMA OPERATIVO
             <div className="w-12 h-12 bg-[#000814] group-hover:bg-white group-hover:text-[#000814] text-white rounded-full flex items-center justify-center transition-all">
                <ChevronRight size={24} />
             </div>
           </button>
        </div>
      ) : (
        <PINScreen onUnlock={onLogin} label="ACCESO GENERAL" icon={<Key size={40} className="text-blue-500" />} onBack={() => setShowPin(false)} />
      )}
      <div className="absolute bottom-10 text-[8px] font-black text-slate-700 uppercase tracking-widest italic opacity-40">
        Roxtor Intelligence Systems • Version 1.5.0-PRO
      </div>
    </div>
  );
};

const PINScreen = ({ onUnlock, label, icon, onBack }: any) => {
  const [pin, setPin] = useState('');
  const addDigit = (d: string) => {
    if (pin.length < 4) {
      const newPin = pin + d;
      setPin(newPin);
      if (newPin.length === 4) setTimeout(() => { if (!onUnlock(newPin)) setPin(''); }, 150);
    }
  };
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
      <div className="bg-white/5 backdrop-blur-3xl border-4 border-white/10 rounded-[4rem] p-12 shadow-2xl w-full max-sm flex flex-col items-center space-y-10">
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-white shadow-inner">{icon}</div>
        <div className="text-center">
          <h4 className="font-black text-xl uppercase tracking-tighter italic text-white">{label}</h4>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Introduzca PIN de 4 dígitos</p>
        </div>
        <div className="flex gap-5">{[0, 1, 2, 3].map(i => <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-blue-500 scale-150 shadow-[0_0_15px_#3b82f6]' : 'bg-white/10'}`} />)}</div>
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map(v => (
            <button key={v} onClick={() => v === 'C' ? setPin('') : v === '←' ? (onBack ? onBack() : setPin(pin.slice(0, -1))) : addDigit(v.toString())} className="h-16 rounded-[1.5rem] bg-white/5 border border-white/5 font-black text-white hover:bg-white hover:text-[#000814] active:scale-90 transition-all flex items-center justify-center text-lg">{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

const TabItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className="relative flex flex-col items-center justify-center w-24 h-full transition-all duration-300 group">
    <div className={`relative z-10 transition-all duration-300 ${active ? 'text-white scale-125 -translate-y-1' : 'text-slate-600 group-hover:text-slate-400'}`}>{icon}</div>
    <span className={`relative z-10 text-[9px] font-black uppercase tracking-[0.15em] mt-2 italic transition-colors ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
    {active && <div className="absolute bottom-0 w-10 h-1 bg-blue-500 rounded-t-full shadow-[0_0_20px_#3b82f6]" />}
  </button>
);

export default App;
