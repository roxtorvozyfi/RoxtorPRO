
import React, { useState } from 'react';
import { Workshop } from '../types';
import { 
  Warehouse, 
  Plus, 
  Trash2, 
  MessageCircle, 
  User, 
  Phone, 
  Layers,
  ChevronRight,
  Sparkles,
  Scissors,
  Zap,
  FileText
} from 'lucide-react';

interface Props {
  workshops: Workshop[];
  setWorkshops: React.Dispatch<React.SetStateAction<Workshop[]>>;
  currentStoreId: string;
}

const WorkshopManager: React.FC<Props> = ({ workshops, setWorkshops, currentStoreId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Omit<Workshop, 'id' | 'storeId'>>({
    name: '',
    department: 'COSTURA',
    customDepartment: '',
    phone: ''
  });

  const departments = ['COSTURA', 'DTF', 'GIGANTOGRAFIA', 'TALONARIOS', 'OTRO'];

  const handleAdd = () => {
    if (!formData.name || !formData.phone) return;
    
    const workshop: Workshop = {
      id: Math.random().toString(36).substr(2, 9),
      storeId: currentStoreId,
      ...formData
    };

    setWorkshops([...workshops, workshop]);
    setFormData({ name: '', department: 'COSTURA', customDepartment: '', phone: '' });
    setIsAdding(false);
  };

  const getDeptIcon = (dept: string) => {
    switch (dept) {
      case 'COSTURA': return <Scissors size={18} />;
      case 'DTF': return <Zap size={18} />;
      case 'GIGANTOGRAFIA': return <Layers size={18} />;
      case 'TALONARIOS': return <FileText size={18} />;
      default: return <Sparkles size={18} />;
    }
  };

  const sendWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone}`;
    const message = encodeURIComponent(`Hola ${name}, te escribimos desde ROXTOR para consultar disponibilidad operativo.`);
    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h3 className="text-3xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">Aliados de Producción</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 italic">Directorio Externo de Talleres y Maquila</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#000814] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all border-b-8 border-slate-700 shadow-xl active:translate-y-1 active:border-b-4"
        >
          {isAdding ? <Trash2 size={20} /> : <Plus size={20} />}
          {isAdding ? 'CANCELAR' : 'REGISTRAR TALLER'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] p-10 shadow-2xl space-y-10 animate-in slide-in-from-top-6 duration-300">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
            <div className="w-14 h-14 bg-[#004ea1] text-white rounded-2xl flex items-center justify-center shadow-lg rotate-3">
              <Warehouse size={28} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-[#000814] uppercase italic tracking-tighter">Alta de Aliado Externo</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Sincronización de base de datos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest ml-1">Nombre Comercial / Taller *</label>
              <div className="relative">
                <User size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#004ea1] opacity-40" />
                <input 
                  type="text" 
                  placeholder="Ej: Confecciones El Diamante"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] pl-14 pr-6 py-5 text-slate-800 font-black uppercase text-xs focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest ml-1">Número de Contacto *</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-[#004ea1] text-sm">+58</span>
                <input 
                  type="text" 
                  placeholder="412 1234567"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] pl-16 pr-6 py-5 text-slate-800 font-black text-sm tabular-nums focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest ml-1">Especialidad Operativa *</label>
              <div className="relative">
                <Layers size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#004ea1] opacity-40" />
                <select 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] pl-14 pr-6 py-5 text-slate-800 font-black uppercase text-[10px] italic outline-none focus:bg-white focus:border-[#004ea1]/20 appearance-none"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value as any})}
                >
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {formData.department === 'OTRO' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-left-4">
                <label className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest ml-1">Especificar Departamento</label>
                <input 
                  type="text" 
                  placeholder="Ej: Bordados Especiales"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-8 py-5 text-slate-800 font-black uppercase text-xs focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all"
                  value={formData.customDepartment}
                  onChange={(e) => setFormData({...formData, customDepartment: e.target.value})}
                />
              </div>
            )}
          </div>

          <button 
            onClick={handleAdd}
            className="w-full bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all border-b-8 border-slate-700 italic active:translate-y-1 active:border-b-4 shadow-2xl"
          >
            GUARDAR ALIADO EN DIRECTORIO
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workshops.length === 0 ? (
          <div className="col-span-full py-32 text-center border-4 border-dashed border-slate-100 rounded-[4rem] opacity-20 bg-slate-50/50">
            <Warehouse size={80} className="mx-auto mb-6" />
            <p className="font-black uppercase tracking-[0.4em] text-sm italic">Directorio de Talleres Vacío</p>
          </div>
        ) : (
          workshops.map(workshop => (
            <div key={workshop.id} className="bg-white border-4 border-slate-50 p-8 rounded-[3.5rem] shadow-sm hover:shadow-2xl transition-all group flex flex-col border-l-8 border-l-[#000814] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 group-hover:scale-110 duration-700">
                {getDeptIcon(workshop.department)}
              </div>
              
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#004ea1] shadow-inner group-hover:bg-[#000814] group-hover:text-white transition-all duration-500">
                  {getDeptIcon(workshop.department)}
                </div>
                <div className="space-y-1 overflow-hidden">
                  <h5 className="font-black text-[#000814] uppercase text-sm tracking-tighter italic truncate">{workshop.name}</h5>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] bg-[#004ea1] text-white font-black uppercase tracking-widest px-2.5 py-1 rounded-lg italic">
                      {workshop.department === 'OTRO' ? workshop.customDepartment : workshop.department}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button 
                  onClick={() => sendWhatsApp(workshop.phone, workshop.name)}
                  className="flex items-center justify-center gap-3 bg-emerald-50 text-emerald-600 px-4 py-4 rounded-2xl border-2 border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm font-black text-[9px] uppercase tracking-widest italic"
                >
                  <MessageCircle size={16} /> WHATSAPP
                </button>
                <button 
                  onClick={() => setWorkshops(workshops.filter(w => w.id !== workshop.id))}
                  className="flex items-center justify-center gap-3 bg-slate-50 text-slate-300 px-4 py-4 rounded-2xl border-2 border-transparent hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all font-black text-[9px] uppercase tracking-widest italic"
                >
                  <Trash2 size={16} /> ELIMINAR
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkshopManager;
