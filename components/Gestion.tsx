
import React, { useState } from 'react';
import { Order, Product, Agent, AppSettings, Workshop } from '../types';
import Reports from './Reports';
import TeamManager from './TeamManager';
import WorkshopManager from './WorkshopManager';
import Settings from './Settings';
import CashClosing from './CashClosing';
import { 
  BarChart3, 
  Users, 
  Settings as SettingsIcon,
  Warehouse,
  Calculator
} from 'lucide-react';

interface Props {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  workshops: Workshop[];
  setWorkshops: React.Dispatch<React.SetStateAction<Workshop[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  currentStoreId: string;
}

const Gestion: React.FC<Props> = ({ 
  orders, 
  setOrders, 
  products, 
  agents, 
  setAgents, 
  workshops, 
  setWorkshops, 
  settings, 
  setSettings, 
  currentStoreId 
}) => {
  const [subTab, setSubTab] = useState<'reports' | 'cash' | 'team' | 'workshop' | 'brand'>('reports');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-[#000814] rounded-[2.5rem] p-2 flex flex-wrap lg:flex-nowrap gap-1 shadow-2xl overflow-x-auto no-scrollbar">
        <SubNavItem active={subTab === 'reports'} onClick={() => setSubTab('reports')} icon={<BarChart3 size={18}/>} label="Data & Métricas" />
        <SubNavItem active={subTab === 'cash'} onClick={() => setSubTab('cash')} icon={<Calculator size={18}/>} label="Cierre Consolidado" />
        <SubNavItem active={subTab === 'team'} onClick={() => setSubTab('team')} icon={<Users size={18}/>} label="Equipo Roxtor" />
        <SubNavItem active={subTab === 'workshop'} onClick={() => setSubTab('workshop')} icon={<Warehouse size={18}/>} label="Aliados Externos" />
        <SubNavItem active={subTab === 'brand'} onClick={() => setSubTab('brand')} icon={<SettingsIcon size={18}/>} label="Ajustes de Marca" />
      </div>

      <div className="min-h-[60vh]">
        {subTab === 'reports' && <Reports orders={orders} setOrders={setOrders} products={products} settings={settings} agents={agents} workshops={workshops} />}
        {subTab === 'cash' && <CashClosing orders={orders} settings={settings} />}
        {subTab === 'team' && <TeamManager agents={agents} setAgents={setAgents} currentStoreId={currentStoreId} />}
        {subTab === 'workshop' && <WorkshopManager workshops={workshops} setWorkshops={setWorkshops} currentStoreId={currentStoreId} />}
        {subTab === 'brand' && <Settings settings={settings} setSettings={setSettings} />}
      </div>
    </div>
  );
};

const SubNavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 whitespace-nowrap ${active ? 'bg-white text-[#000814] shadow-md font-black' : 'text-slate-500 hover:text-white hover:bg-white/5 font-bold'}`}>
    {icon}
    <span className="text-[10px] uppercase tracking-widest italic">{label}</span>
  </button>
);

export default Gestion;
