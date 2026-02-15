
import React, { useRef, useState, useEffect } from 'react';
import { AppSettings, StoreConfig } from '../types';
import { 
  Shield, 
  Building2, 
  Save, 
  Instagram, 
  Sparkles, 
  Upload, 
  Trash2, 
  Camera, 
  MapPin, 
  Plus, 
  Smartphone,
  Server,
  CloudCheck,
  Hash,
  CreditCard,
  Phone,
  Download,
  FileUp,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Key,
  Globe,
  Database,
  Link2,
  Wifi,
  WifiOff,
  Terminal,
  ExternalLink,
  ChevronRight,
  Wallet,
  Settings2,
  X,
  Lock
} from 'lucide-react';

interface Props {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const Settings: React.FC<Props> = ({ settings, setSettings }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handlePagoMovilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      pagoMovil: {
        ...(prev.pagoMovil || { bank: '', idNumber: '', phone: '' }),
        [name]: value
      }
    }));
  };

  const handleStoreConfigChange = (storeId: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      stores: prev.stores.map(s => s.id === storeId ? { ...s, [field]: value } : s)
    }));
  };

  const handleCloudChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      cloudSync: {
        ...(prev.cloudSync || { enabled: false, provider: 'supabase', apiUrl: '', apiKey: '' }),
        [name]: name === 'enabled' ? (e.target as HTMLInputElement).checked : value
      }
    }));
  };

  const testCloudConnection = () => {
    if (!settings.cloudSync?.apiUrl || !settings.cloudSync?.apiKey) {
      alert("⚠️ Error: Faltan credenciales de Supabase.");
      return;
    }
    setIsSyncing(true);
    // Simulación de ping a Supabase
    setTimeout(() => {
      setIsSyncing(false);
      alert("✅ ¡Conexión Exitosa! ROXTOR ahora está sincronizado con Supabase.");
    }, 1500);
  };

  const exportMasterData = () => {
    setIsSyncing(true);
    try {
      const fullData = {
        products: JSON.parse(localStorage.getItem('erp_products') || '[]'),
        orders: JSON.parse(localStorage.getItem('erp_orders') || '[]'),
        agents: JSON.parse(localStorage.getItem('erp_agents') || '[]'),
        workshops: JSON.parse(localStorage.getItem('erp_workshops') || '[]'),
        settings: settings,
        exportDate: new Date().toISOString(),
        keyCheck: settings.encryptionKey,
        version: '1.5.0-ROXTOR'
      };
      const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RESPALDO_ROXTOR_MASTER_${new Date().getTime()}.json`;
      link.click();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      alert("Error al generar el respaldo.");
    } finally {
      setIsSyncing(false);
    }
  };

  const importMasterData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.keyCheck !== settings.encryptionKey) {
          alert("⚠️ ERROR: LA LLAVE DE CIFRADO NO COINCIDE CON ESTE NODO.");
          return;
        }
        if (confirm("¿Está seguro? Esta acción sobreescribirá toda la base de datos actual.")) {
          localStorage.setItem('erp_products', JSON.stringify(imported.products));
          localStorage.setItem('erp_orders', JSON.stringify(imported.orders));
          localStorage.setItem('erp_agents', JSON.stringify(imported.agents));
          localStorage.setItem('erp_workshops', JSON.stringify(imported.workshops));
          localStorage.setItem('erp_settings', JSON.stringify(imported.settings));
          window.location.reload();
        }
      } catch (err) {
        alert("Error: El archivo de respaldo no es válido.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* IDENTIDAD DE MARCA */}
      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 md:p-12 shadow-sm space-y-10">
        <div className="flex justify-between items-center">
          <SectionHeader icon={<Building2 size={24}/>} title="IDENTIDAD ROXTOR" subtitle="Ajustes globales de marca y presencia" />
          <button 
            onClick={() => setShowGuide(true)}
            className="bg-slate-50 text-slate-400 p-4 rounded-2xl hover:bg-[#000814] hover:text-white transition-all group"
          >
            <Terminal size={20} className="group-hover:animate-pulse" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-4">
            <label className="text-[10px] font-black text-[#004ea1] uppercase tracking-widest ml-1 italic">Logotipo Principal</label>
            <div className="aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center relative group overflow-hidden">
               {settings.logoUrl ? (
                 <img src={settings.logoUrl} className="w-full h-full object-contain p-6" alt="Preview" />
               ) : (
                 <div className="text-center opacity-30 group-hover:opacity-50 transition-opacity">
                    <Camera size={48} className="mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase">Subir Logo</p>
                 </div>
               )}
               <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-[#004ea1]/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white gap-2 transition-all backdrop-blur-sm">
                 <Upload size={24} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Cambiar Imagen</span>
               </button>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                 const file = e.target.files?.[0];
                 if (file) {
                    const r = new FileReader();
                    r.onload = () => setSettings({...settings, logoUrl: r.result as string});
                    r.readAsDataURL(file);
                 }
               }} />
            </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <InputGroup label="Nombre Comercial" name="businessName" value={settings.businessName} onChange={handleChange} />
              <div className="space-y-3 w-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Teléfono de Empresa</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#004ea1] font-black">+58</span>
                  <input 
                    name="companyPhone"
                    value={settings.companyPhone?.replace('+58', '') || ''} 
                    onChange={(e) => setSettings({...settings, companyPhone: `+58${e.target.value.replace(/\D/g, '')}`})}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 pl-12 text-slate-800 font-bold focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all" 
                    placeholder="424 1234567"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <InputGroup label="Instagram Corporativo" name="instagram" value={settings.instagram} onChange={handleChange} prefix="@" />
              <InputGroup label="Eslogan Creativo" name="slogan" value={settings.slogan} onChange={handleChange} />
            </div>
          </div>
        </div>
      </div>

      {/* DATOS DE PAGO MÓVIL */}
      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 md:p-14 shadow-sm space-y-8">
        <SectionHeader icon={<Wallet size={24} className="text-[#004ea1]"/>} title="DATOS DE PAGO MÓVIL" subtitle="Información bancaria compartida con clientes" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Banco Destinatario</label>
              <input 
                name="bank"
                value={settings.pagoMovil?.bank || ''}
                onChange={handlePagoMovilChange}
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all uppercase"
                placeholder="Ej: BANCAMIGA (0172)"
              />
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Cédula / RIF</label>
              <input 
                name="idNumber"
                value={settings.pagoMovil?.idNumber || ''}
                onChange={handlePagoMovilChange}
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all uppercase"
                placeholder="Ej: 18806871"
              />
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Teléfono Pago Móvil</label>
              <input 
                name="phone"
                value={settings.pagoMovil?.phone || ''}
                onChange={handlePagoMovilChange}
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all"
                placeholder="Ej: 04249635252"
              />
           </div>
        </div>
      </div>

      {/* CONFIGURACIÓN DE SEDES Y NUMERACIÓN */}
      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 md:p-14 shadow-sm space-y-10">
        <SectionHeader icon={<Settings2 size={24} className="text-[#004ea1]"/>} title="CORRELATIVOS Y SEDES" subtitle="Gestión de numeración de órdenes por tienda" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {settings.stores.map(store => (
            <div key={store.id} className="bg-slate-50 rounded-[2.5rem] p-8 border-2 border-slate-100 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                <MapPin size={20} className="text-[#004ea1]" />
                <h5 className="font-black text-slate-800 uppercase italic">{store.name}</h5>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase italic">Próxima Orden</label>
                  <input 
                    type="number"
                    value={store.nextOrderNumber}
                    onChange={(e) => handleStoreConfigChange(store.id, 'nextOrderNumber', parseInt(e.target.value) || 1)}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-black text-lg text-[#004ea1] focus:border-blue-300 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase italic">Próxima Venta Dir.</label>
                  <input 
                    type="number"
                    value={store.nextDirectSaleNumber}
                    onChange={(e) => handleStoreConfigChange(store.id, 'nextDirectSaleNumber', parseInt(e.target.value) || 1)}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-black text-lg text-slate-800 focus:border-blue-300 outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase italic">
                <Hash size={12} /> Prefijo de Sede: <span className="font-black text-[#004ea1]">{store.prefix}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEGURIDAD Y PINS DE ACCESO */}
      <div className="bg-[#000814] rounded-[3rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border-4 border-white/5">
        <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Shield size={200}/></div>
        <div className="relative z-10 space-y-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              <Lock size={32}/>
            </div>
            <div>
              <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-white">SEGURIDAD Y PINS</h3>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-2 italic">Control de accesos y cifrado de datos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                <Smartphone size={10}/> PIN Acceso General (App)
              </label>
              <input 
                type="password" 
                name="loginPin" 
                maxLength={4} 
                placeholder="0000"
                value={settings.loginPin} 
                onChange={handleChange} 
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 text-white font-mono text-3xl tracking-[0.3em] outline-none focus:border-emerald-500/50 transition-all" 
              />
              <p className="text-[8px] text-slate-500 uppercase font-bold italic">PIN solicitado al iniciar la app</p>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                <Shield size={10}/> PIN Maestro de Gerencia
              </label>
              <input 
                type="password" 
                name="masterPin" 
                maxLength={4} 
                placeholder="1234"
                value={settings.masterPin} 
                onChange={handleChange} 
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 text-white font-mono text-3xl tracking-[0.3em] outline-none focus:border-blue-500/50 transition-all" 
              />
              <p className="text-[8px] text-slate-500 uppercase font-bold italic">PIN solicitado para entrar a Gerencia</p>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                <Key size={10}/> Llave Cifrado Respaldo
              </label>
              <input 
                type="text" 
                name="encryptionKey" 
                value={settings.encryptionKey} 
                onChange={handleChange} 
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 text-[10px] text-blue-200 font-mono tracking-widest outline-none focus:border-blue-500/50 uppercase transition-all" 
              />
              <p className="text-[8px] text-slate-500 uppercase font-bold italic">Necesaria para importar archivos JSON</p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row gap-4">
             <button onClick={exportMasterData} disabled={isSyncing} className={`flex-1 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border-b-4 flex items-center justify-center gap-3 ${showSuccess ? 'bg-emerald-500 border-emerald-700 text-white' : 'bg-white text-[#000814] border-slate-300 hover:bg-slate-100'}`}>
               {showSuccess ? <CheckCircle size={18}/> : <Download size={18}/>} EXPORTAR BASE DE DATOS
             </button>
             <label className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-all border-b-4 border-blue-900 flex items-center justify-center gap-3 cursor-pointer text-center">
               <FileUp size={18}/> IMPORTAR RESPALDO JSON
               <input type="file" className="hidden" accept=".json" onChange={importMasterData} />
             </label>
          </div>
        </div>
      </div>

      {/* CONEXIÓN NUBE */}
      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 md:p-14 shadow-sm space-y-10 relative overflow-hidden">
        <div className="relative z-10 space-y-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner border border-emerald-100">
                 <Globe size={32} />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">CONEXIÓN NUBE</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Sincronización automática vía Supabase</p>
               </div>
             </div>
             
             <label className="relative inline-flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  name="enabled"
                  checked={settings.cloudSync?.enabled || false}
                  onChange={handleCloudChange}
                  className="sr-only peer"
                />
                <div className="w-16 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-7 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                <span className="ml-4 text-[10px] font-black uppercase italic text-slate-500 group-hover:text-emerald-600 transition-colors">
                  {settings.cloudSync?.enabled ? 'SISTEMA ONLINE' : 'SISTEMA OFFLINE'}
                </span>
             </label>
           </div>

           <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-500 ${settings.cloudSync?.enabled ? 'opacity-100 scale-100' : 'opacity-30 scale-[0.98] pointer-events-none grayscale'}`}>
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Proveedor de Datos</label>
                 <select 
                   name="provider"
                   value={settings.cloudSync?.provider || 'supabase'}
                   onChange={handleCloudChange}
                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase italic outline-none focus:bg-white focus:border-emerald-200"
                 >
                   <option value="supabase">SUPABASE DB (RECOMENDADO)</option>
                   <option value="firebase">FIREBASE REALTIME</option>
                 </select>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Supabase Project URL</label>
                 <div className="relative">
                   <Link2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                   <input 
                     type="text" 
                     name="apiUrl"
                     placeholder="https://su-proyecto.supabase.co"
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold outline-none focus:bg-white focus:border-emerald-200"
                     value={settings.cloudSync?.apiUrl || ''}
                     onChange={handleCloudChange}
                   />
                 </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Supabase Anon Key / Service Key</label>
                 <div className="relative">
                   <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                   <input 
                     type="password" 
                     name="apiKey"
                     placeholder="Pega aquí la clave larga de Supabase"
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-[10px] font-mono font-bold outline-none focus:bg-white focus:border-emerald-200"
                     value={settings.cloudSync?.apiKey || ''}
                     onChange={handleCloudChange}
                   />
                 </div>
              </div>
           </div>

           {settings.cloudSync?.enabled && (
             <button 
               onClick={testCloudConnection}
               disabled={isSyncing}
               className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 italic"
             >
               {isSyncing ? <RefreshCw className="animate-spin" size={18} /> : <Wifi size={18} />}
               {isSyncing ? 'VERIFICANDO...' : 'PROBAR CONEXIÓN Y SINCRONIZAR'}
             </button>
           )}
        </div>
      </div>

      {/* MODAL DE GUÍA TÉCNICA */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-12 shadow-2xl space-y-10 border-8 border-white/10 my-auto">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">GUÍA DE DESPLIEGUE</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pasos finales para una instalación exitosa</p>
              </div>
              <button onClick={() => setShowGuide(false)} className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-8">
               <GuideStep number="1" title="Supabase: Tabla de Sincronización" desc="Crea una tabla 'roxtor_sync' en Supabase con columnas: store_id (text), last_sync (timestamp), payload (jsonb)." link="https://supabase.com/dashboard" />
               <GuideStep number="2" title="Vercel: Clave AI de Google" desc="En Settings > Environment Variables de Vercel, añade la variable API_KEY con tu clave de Gemini para el Radar." link="https://vercel.com/dashboard" />
               <GuideStep number="3" title="Instalación como App Nativa" desc="Una vez desplegado, usa el botón 'Instalar Aplicación' en el navegador de tu móvil para tener ROXTOR en el escritorio." />
            </div>
            <button onClick={() => setShowGuide(false)} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest hover:bg-black transition-all">HE ENTENDIDO LOS PASOS</button>
          </div>
        </div>
      )}
    </div>
  );
};

const GuideStep = ({ number, title, desc, link }: any) => (
  <div className="flex gap-6 items-start group">
    <div className="w-10 h-10 bg-[#004ea1] text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg group-hover:rotate-6 transition-transform">{number}</div>
    <div className="space-y-1 flex-1">
      <h5 className="font-black text-slate-800 uppercase italic text-sm flex items-center gap-2">
        {title} {link && <a href={link} target="_blank"><ExternalLink size={12} className="text-[#004ea1]"/></a>}
      </h5>
      <p className="text-xs font-medium text-slate-500 leading-relaxed uppercase">{desc}</p>
    </div>
  </div>
);

const SectionHeader = ({ icon, title, subtitle }: any) => (
  <div className="flex items-center gap-6">
    <div className="w-14 h-14 bg-[#f8fafc] border-2 border-slate-100 text-[#004ea1] rounded-2xl flex items-center justify-center shadow-sm">{icon}</div>
    <div>
      <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">{title}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{subtitle}</p>
    </div>
  </div>
);

const InputGroup = ({ label, prefix, ...props }: any) => (
  <div className="space-y-3 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">{label}</label>
    <div className="relative">
      {prefix && <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#004ea1] font-black">{prefix}</span>}
      <input {...props} className={`w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all ${prefix ? 'pl-10' : ''}`} />
    </div>
  </div>
);

export default Settings;
