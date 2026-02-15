
import React, { useState } from 'react';
import { Agent } from '../types';
import { 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Scissors, 
  Paintbrush, 
  Briefcase, 
  User, 
  Phone, 
  Star, 
  MessageCircle,
  ExternalLink
} from 'lucide-react';

interface Props {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  currentStoreId: string;
}

const TeamManager: React.FC<Props> = ({ agents, setAgents, currentStoreId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newAgent, setNewAgent] = useState({ 
    name: '', 
    role: 'AGENTE DE VENTAS',
    specialty: '',
    phone: ''
  });

  const roles = [
    'AGENTE DE VENTAS', 
    'DISEÑADOR', 
    'OPERACIONES', 
    'TALLER/PRODUCCIÓN', 
    'ADMINISTRACIÓN', 
    'OTRO'
  ];

  const handleAdd = () => {
    if (!newAgent.name || !newAgent.role) return;
    
    const agent: Agent = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAgent.name,
      role: newAgent.role,
      storeId: currentStoreId,
      specialty: newAgent.specialty,
      phone: newAgent.phone ? `+58${newAgent.phone.replace(/\s/g, '')}` : undefined
    };

    setAgents([...agents, agent]);
    setNewAgent({ name: '', role: 'AGENTE DE VENTAS', specialty: '', phone: '' });
    setIsAdding(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DISEÑADOR': return <Paintbrush size={16} />;
      case 'TALLER/PRODUCCIÓN': return <Scissors size={16} />;
      case 'ADMINISTRACIÓN': return <ShieldCheck size={16} />;
      case 'AGENTE DE VENTAS': return <Briefcase size={16} />;
      default: return <User size={16} />;
    }
  };

  const openWhatsApp = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\+/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-[#000814] uppercase italic tracking-tighter">EQUIPO OPERATIVO</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Gestión de personal y especialistas Roxtor</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#000814] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all border-b-4 border-slate-600 shadow-xl"
        >
          {isAdding ? <Trash2 size={18} /> : <UserPlus size={18} />} {isAdding ? 'CANCELAR' : 'REGISTRAR AGENTE'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 md:p-10 shadow-xl animate-in slide-in-from-top-4 duration-300 space-y-8">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg rotate-3">
              <UserPlus size={24} />
            </div>
            <h4 className="text-xl font-black text-[#000814] uppercase italic tracking-tighter">Nueva Ficha de Agente</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nombre Completo *</label>
              <input 
                type="text" 
                placeholder="Ej: Juan Pérez"
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-100 outline-none transition-all"
                value={newAgent.name}
                onChange={(e) => setNewAgent({...newAgent, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Cargo / Función *</label>
              <select 
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-xs font-black uppercase italic outline-none focus:bg-white focus:border-blue-100 appearance-none"
                value={newAgent.role}
                onChange={(e) => setNewAgent({...newAgent, role: e.target.value})}
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Especialidad</label>
              <div className="relative">
                <Star className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 opacity-40" size={16} />
                <input 
                  type="text" 
                  placeholder="Ej: Bordado en Hilo, Patronaje..."
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-100 outline-none transition-all"
                  value={newAgent.specialty}
                  onChange={(e) => setNewAgent({...newAgent, specialty: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Número Telefónico</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-blue-600">+58</span>
                <input 
                  type="text" 
                  placeholder="412 1234567"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-14 pr-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-100 outline-none transition-all"
                  value={newAgent.phone}
                  onChange={(e) => setNewAgent({...newAgent, phone: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleAdd}
            className="w-full bg-[#000814] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-800 transition-all border-b-8 border-slate-700 italic active:translate-y-1 active:border-b-4 shadow-xl"
          >
            GUARDAR AGENTE EN TODOS LOS NODOS
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {agents.length === 0 ? (
          <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-100 rounded-[3rem] opacity-20">
            <User size={64} className="mx-auto mb-4" />
            <p className="font-black uppercase tracking-[0.3em] text-xs italic">No hay personal registrado en esta sede</p>
          </div>
        ) : (
          agents.map(agent => (
            <div key={agent.id} className="bg-white border-4 border-slate-50 p-8 rounded-[3rem] shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row items-center justify-between gap-6 border-l-8 border-l-[#000814]">
              <div className="flex items-center gap-6 flex-1 w-full">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner group-hover:scale-110 transition-transform">
                  {getRoleIcon(agent.role)}
                </div>
                <div className="space-y-1 overflow-hidden">
                  <h5 className="font-black text-[#000814] uppercase text-sm tracking-tighter italic truncate">{agent.name}</h5>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] bg-slate-100 text-slate-500 font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border border-slate-200">
                      {agent.role}
                    </span>
                    {agent.specialty && (
                      <span className="text-[9px] bg-blue-50 text-blue-600 font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border border-blue-100 italic">
                        {agent.specialty}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {agent.phone && (
                  <button 
                    onClick={() => openWhatsApp(agent.phone)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                    title="Enviar WhatsApp"
                  >
                    <MessageCircle size={18} />
                    <span className="text-[10px] font-black uppercase md:hidden lg:inline">WhatsApp</span>
                  </button>
                )}
                <button 
                  onClick={() => setAgents(agents.filter(a => a.id !== agent.id))}
                  className="p-3 bg-slate-50 text-slate-200 hover:text-red-500 hover:bg-red-50 hover:border-red-100 border border-transparent rounded-xl transition-all"
                  title="Eliminar Agente"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamManager;
