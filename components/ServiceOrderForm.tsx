
import React, { useState, useMemo, useRef } from 'react';
import { Product, Order, AppSettings, Agent, ServiceOrderItem, OrderStatus } from '../types';
import { 
  User, 
  Hash, 
  Calendar, 
  ShoppingCart, 
  DollarSign, 
  FileText, 
  Camera, 
  Plus, 
  Trash2, 
  Save, 
  Search,
  MapPin,
  CreditCard,
  Ticket,
  Layers,
  AlertCircle,
  ImageIcon,
  X,
  UploadCloud,
  Zap
} from 'lucide-react';

interface Props {
  products: Product[];
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  agents: Agent[];
  currentStoreId: string;
  onSave: (order: Order) => void;
}

const ServiceOrderForm: React.FC<Props> = ({ products, settings, setSettings, agents, currentStoreId, onSave }) => {
  const [customer, setCustomer] = useState({ name: '', ci: '', phone: '' });
  const [dates, setDates] = useState({
    issue: new Date().toISOString().split('T')[0],
    delivery: ''
  });
  const [orderItems, setOrderItems] = useState<ServiceOrderItem[]>([]);
  const [manualItem, setManualItem] = useState({ name: '', quantity: 1, priceUsd: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [financials, setFinancials] = useState({ 
    abonoUsd: 0, 
    paymentMethod: 'DOLARES $' as Order['paymentMethod'],
    paymentReference: ''
  });
  const [technicalDetails, setTechnicalDetails] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [initialStatus, setInitialStatus] = useState<OrderStatus>('pendiente');
  const [selectedStoreId, setSelectedStoreId] = useState(currentStoreId);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const selectedStore = settings.stores.find(s => s.id === selectedStoreId) || settings.stores[0];

  const filteredProducts = useMemo(() => 
    products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
  [products, searchQuery]);

  const totalUsd = useMemo(() => 
    orderItems.reduce((acc, item) => acc + (Number(item.priceUsd) * Number(item.quantity)), 0),
  [orderItems]);

  const totalBs = totalUsd * settings.bcvRate;
  const restanteUsd = totalUsd - financials.abonoUsd;
  const restanteBs = restanteUsd * settings.bcvRate;

  const addProductToOrder = (product: Product) => {
    const existing = orderItems.find(i => i.productId === product.id);
    if (existing) {
      updateItemQuantity(product.id, existing.quantity + 1);
    } else {
      setOrderItems([...orderItems, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        priceUsd: product.priceRetail
      }]);
    }
  };

  const updateItemQuantity = (id: string, newQty: number) => {
    if (newQty < 1) return;
    setOrderItems(orderItems.map(item => {
      if (item.productId === id) {
        const originalProduct = products.find(p => p.id === id);
        let finalPrice = item.priceUsd;
        if (originalProduct) {
          finalPrice = newQty >= 12 && originalProduct.priceWholesale > 0 
            ? originalProduct.priceWholesale 
            : originalProduct.priceRetail;
        }
        return { ...item, quantity: newQty, priceUsd: finalPrice };
      }
      return item;
    }));
  };

  const updateItemPrice = (id: string, newPrice: number) => {
    setOrderItems(orderItems.map(item => 
      item.productId === id ? { ...item, priceUsd: newPrice } : item
    ));
  };

  const addManualItem = () => {
    if (!manualItem.name) {
      alert("Ingrese nombre para el ítem manual.");
      return;
    }
    if (manualItem.priceUsd <= 0) {
      alert("El precio debe ser mayor a $0.");
      return;
    }
    setOrderItems([...orderItems, {
      productId: `manual_${Date.now()}`,
      name: manualItem.name.toUpperCase(),
      quantity: manualItem.quantity,
      priceUsd: manualItem.priceUsd
    }]);
    setManualItem({ name: '', quantity: 1, priceUsd: 0 });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setReferenceImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const missing = [];
    if (!customer.name) missing.push("Nombre Cliente");
    if (!customer.ci) missing.push("Cédula / RIF");
    if (!customer.phone) missing.push("Teléfono");
    if (!dates.delivery) missing.push("Fecha Estimada de Entrega");
    if (orderItems.length === 0) missing.push("Lista de Productos");
    if (!assignedAgentId) missing.push("Responsable Asignado");

    if (missing.length > 0) {
      setShowErrors(true);
      alert(`⚠️ CAMPOS PENDIENTES:\n\nDebe completar:\n- ${missing.join('\n- ')}`);
      return;
    }

    const orderNum = `${selectedStore.prefix}-${String(selectedStore.nextOrderNumber).padStart(4, '0')}`;
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: orderNum,
      storeId: selectedStoreId,
      customerName: customer.name.toUpperCase(),
      customerCi: customer.ci,
      customerPhone: `+58${customer.phone}`,
      items: orderItems,
      totalUsd,
      totalBs,
      abonoUsd: financials.abonoUsd,
      restanteUsd,
      status: initialStatus,
      taskStatus: 'esperando',
      history: [{
        timestamp: Date.now(),
        agentId: 'admin',
        action: `Orden generada y enviada a ${initialStatus}. Abono inicial: $${financials.abonoUsd}. Ref: ${financials.paymentReference}`,
        status: initialStatus
      }],
      bcvRate: settings.bcvRate,
      issueDate: dates.issue.split('-').reverse().join('/'),
      deliveryDate: dates.delivery.split('-').reverse().join('/'),
      technicalDetails: technicalDetails.toUpperCase(),
      referenceImages: referenceImages,
      assignedAgentId,
      paymentMethod: financials.paymentMethod,
      paymentReference: financials.paymentReference
    };

    const updatedStores = settings.stores.map(s => 
      s.id === selectedStoreId ? { ...s, nextOrderNumber: s.nextOrderNumber + 1 } : s
    );
    setSettings({ ...settings, stores: updatedStores });

    onSave(newOrder);
    alert(`✅ Orden ${orderNum} Registrada.`);
    
    setOrderItems([]);
    setCustomer({ name: '', ci: '', phone: '' });
    setFinancials({ abonoUsd: 0, paymentMethod: 'DOLARES $' as any, paymentReference: '' });
    setTechnicalDetails('');
    setReferenceImages([]);
    setAssignedAgentId('');
    setInitialStatus('pendiente');
    setShowErrors(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg rotate-3">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">Generar Orden</h3>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1 italic">{settings.slogan}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sede: {selectedStore.name}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nro de Orden</span>
              <span className="text-3xl font-black text-rose-600 italic tracking-tighter">
                {selectedStore.prefix}-{String(selectedStore.nextOrderNumber).padStart(4, '0')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between italic">
                <span className="flex items-center gap-2"><Calendar size={12} className="text-rose-500" /> Fecha Emisión</span>
              </label>
              <input 
                type="date" 
                value={dates.issue}
                onChange={(e) => setDates({...dates, issue: e.target.value})}
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-rose-100 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase tracking-widest ml-1 flex items-center justify-between italic transition-colors ${showErrors && !dates.delivery ? 'text-red-500' : 'text-slate-400'}`}>
                <span className="flex items-center gap-2"><Calendar size={12} className={showErrors && !dates.delivery ? 'text-red-500' : 'text-rose-500'} /> Fecha Entrega *</span>
              </label>
              <input 
                type="date" 
                value={dates.delivery}
                onChange={(e) => setDates({...dates, delivery: e.target.value})}
                className={`w-full border-2 rounded-2xl px-5 py-4 text-slate-800 font-bold outline-none shadow-sm transition-all ${showErrors && !dates.delivery ? 'bg-red-50 border-red-200' : 'bg-white border-rose-100'}`}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-6">
          <SectionHeader icon={<User size={20} className="text-rose-600" />} title="Información del Cliente y Sede" />
          
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Seleccionar Sede de Registro</label>
            <div className="grid grid-cols-2 gap-4">
              {settings.stores.map(s => {
                const isCentro = s.name.toUpperCase().includes('CENTRO');
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStoreId(s.id)}
                    className={`flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all font-black uppercase text-[10px] tracking-widest italic ${
                      selectedStoreId === s.id 
                        ? (isCentro ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200' : 'bg-[#004ea1] text-white border-[#004ea1] shadow-lg shadow-blue-200')
                        : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin size={16} />
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <InputGroup 
              label="Nombre y Apellido *" 
              icon={<User size={14}/>} 
              value={customer.name} 
              error={showErrors && !customer.name}
              onChange={(e: any) => setCustomer({...customer, name: e.target.value})}
            />
            <InputGroup 
              label="Cédula / RIF *" 
              icon={<Hash size={14}/>} 
              value={customer.ci} 
              error={showErrors && !customer.ci}
              onChange={(e: any) => setCustomer({...customer, ci: e.target.value})}
            />
            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase tracking-widest ml-1 italic transition-colors ${showErrors && !customer.phone ? 'text-red-500' : 'text-slate-400'}`}>Teléfono Celular *</label>
              <div className="relative">
                <span className={`absolute left-5 top-1/2 -translate-y-1/2 font-black text-sm ${showErrors && !customer.phone ? 'text-red-500' : 'text-rose-600'}`}>+58</span>
                <input 
                  type="text" 
                  className={`w-full border-2 rounded-2xl pl-14 pr-5 py-4 text-slate-800 font-bold outline-none transition-all ${showErrors && !customer.phone ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-transparent focus:bg-white focus:border-rose-100'}`}
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                  placeholder="412 1234567"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-8">
          <SectionHeader icon={<ShoppingCart size={20} className="text-rose-600" />} title="Detalle del Pedido" />
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Buscar en Catálogo</label>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Camisa, Bordado, etc..." 
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-rose-100 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-3xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2">
                  {filteredProducts.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => { addProductToOrder(p); setSearchQuery(''); }}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all"
                    >
                      <span className="font-black text-slate-700 uppercase italic text-xs">{p.name}</span>
                      <span className="font-black text-rose-600">${p.priceRetail}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={`bg-slate-50/50 rounded-[2rem] p-6 border-2 border-dashed transition-all ${showErrors && orderItems.length === 0 ? 'border-red-400 bg-red-50/20' : 'border-slate-200'}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Carga rápida de ítem manual:</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                type="text" placeholder="Descripción Manual" 
                className="md:col-span-2 bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold uppercase"
                value={manualItem.name} onChange={(e) => setManualItem({...manualItem, name: e.target.value})}
              />
              <input 
                type="number" placeholder="Cant." 
                className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold"
                value={manualItem.quantity} onChange={(e) => setManualItem({...manualItem, quantity: parseInt(e.target.value) || 1})}
              />
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="number" placeholder="Precio" 
                  className="w-full bg-white border-2 border-slate-100 rounded-xl pl-8 pr-4 py-3 text-xs font-bold"
                  value={manualItem.priceUsd || ''} onChange={(e) => setManualItem({...manualItem, priceUsd: parseFloat(e.target.value) || 0})}
                />
                <button 
                  onClick={addManualItem}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-rose-600 text-white p-1.5 rounded-lg shadow-md hover:bg-rose-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            {showErrors && orderItems.length === 0 && (
              <p className="text-[10px] text-red-500 font-black mt-3 uppercase italic">⚠️ La lista de productos no puede estar vacía.</p>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl border-2 border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 italic">Cant.</th>
                  <th className="px-6 py-4 italic">Descripción</th>
                  <th className="px-6 py-4 italic">Unit. $</th>
                  <th className="px-6 py-4 italic">Total $</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 italic">
                {orderItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-600 uppercase">
                    <td className="px-6 py-4">
                      <input 
                        type="number" value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                        className="w-14 bg-white border rounded px-1 text-center font-black"
                      />
                    </td>
                    <td className="px-6 py-4">{item.name}</td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" value={item.priceUsd}
                        onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                        className="w-16 bg-white border rounded px-1 font-bold text-rose-600"
                      />
                    </td>
                    <td className="px-6 py-4 font-black text-rose-600">${(item.priceUsd * item.quantity).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CARGA DE IMÁGENES DE REFERENCIA */}
        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-6">
          <SectionHeader icon={<Camera size={20} className="text-rose-600" />} title="Imágenes de Referencia" />
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Adjuntar bocetos, logos o capturas del cliente</p>
            <div 
              onClick={() => imageInputRef.current?.click()}
              className="w-full border-4 border-dashed border-slate-100 rounded-[2.5rem] py-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50 hover:border-rose-100 transition-all group"
            >
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-50 group-hover:text-rose-500 transition-all">
                <UploadCloud size={32} />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cargar archivos de referencia</p>
              <input type="file" ref={imageInputRef} className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
            </div>

            {referenceImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 pt-4">
                {referenceImages.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                      className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-8">
        <div className="bg-[#000814] text-white rounded-[3rem] p-10 shadow-2xl space-y-8 relative overflow-hidden border-4 border-white/5">
          <div className="relative z-10 space-y-6">
            <h4 className="text-xl font-black italic tracking-tighter uppercase border-b border-white/10 pb-4 text-center">Resumen Financiero</h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Total Orden</span>
                <span className="text-4xl font-black italic tracking-tighter text-white">${totalUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-400 font-bold italic text-sm">
                <span>Bs. {totalBs.toLocaleString('es-VE')}</span>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block">Abono Inicial (USD)</label>
                <input 
                  type="number" 
                  className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-black text-2xl outline-none focus:border-rose-500/50"
                  value={financials.abonoUsd}
                  onChange={(e) => setFinancials({...financials, abonoUsd: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block">Método de Pago</label>
                  <select 
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-black text-xs uppercase outline-none"
                    value={financials.paymentMethod}
                    onChange={(e) => setFinancials({...financials, paymentMethod: e.target.value as Order['paymentMethod']})}
                  >
                    <option value="DOLARES $">DOLARES $</option>
                    <option value="PAGO MOVIL">PAGO MOVIL</option>
                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                    <option value="EFECTIVO">EFECTIVO</option>
                    <option value="PUNTO DE VENTA">PUNTO DE VENTA</option>
                    <option value="BIOPAGO">BIOPAGO</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block flex items-center gap-2">
                    <Zap size={12} className="text-blue-400" /> Nro de Referencia Bancaria
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: 00123456"
                    className="w-full bg-white/10 border-2 border-blue-500/30 rounded-2xl px-5 py-4 text-white font-black text-base outline-none focus:border-blue-500 uppercase italic placeholder:text-slate-600 transition-all"
                    value={financials.paymentReference}
                    onChange={(e) => setFinancials({...financials, paymentReference: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-rose-600/20 border border-rose-500/30 rounded-3xl p-6 text-center">
                <span className="text-[10px] font-black uppercase italic tracking-widest opacity-80 block mb-1">Por Cobrar</span>
                <span className="text-2xl font-black italic tracking-tighter text-white">${restanteUsd.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-6">
          <SectionHeader icon={<Plus size={20} className="text-rose-600" />} title="Asignación y Área" />
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Departamento de Inicio</label>
              <select 
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as OrderStatus)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-xs font-black uppercase italic outline-none"
              >
                <option value="pendiente">PENDIENTE</option>
                <option value="diseño">DISEÑO</option>
                <option value="impresión">IMPRESIÓN</option>
                <option value="taller">TALLER</option>
                <option value="bordado">BORDADO</option>
                <option value="sublimación">SUBLIMACIÓN</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase tracking-widest ml-1 italic transition-colors ${showErrors && !assignedAgentId ? 'text-red-500' : 'text-slate-400'}`}>Responsable Asignado (Multi-Sede) *</label>
              <select 
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className={`w-full border-2 rounded-2xl px-5 py-4 text-xs font-black uppercase italic outline-none transition-all ${showErrors && !assignedAgentId ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-rose-100'}`}
              >
                <option value="">SELECCIONAR RESPONSABLE</option>
                {agents.map(a => {
                  const agentStore = settings.stores.find(s => s.id === a.storeId);
                  return (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.role}) - {agentStore?.name || 'GLOBAL'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Observaciones Técnicas</label>
              <textarea 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-6 py-4 text-xs font-bold min-h-[80px] outline-none uppercase"
                placeholder="Detalles de costura, hilos, etc..."
                value={technicalDetails}
                onChange={(e) => setTechnicalDetails(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            className="w-full bg-rose-600 text-white py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-rose-700 transition-all border-b-8 border-rose-800 italic"
          >
            <Save size={20} /> FINALIZAR ORDEN DE SERVICIO
          </button>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ icon, title }: any) => (
  <div className="flex items-center gap-4 mb-2">
    <div className="bg-slate-50 p-3 rounded-xl shadow-inner">{icon}</div>
    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter italic">{title}</h4>
  </div>
);

const InputGroup = ({ label, icon, value, onChange, placeholder, error }: any) => (
  <div className="space-y-2">
    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 italic transition-colors ${error ? 'text-red-500' : 'text-slate-400'}`}>{label}</label>
    <div className="relative">
      <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-slate-300'}`}>
        {icon}
      </div>
      <input 
        type="text" 
        className={`w-full border-2 rounded-2xl pl-12 pr-5 py-4 text-slate-800 font-bold outline-none transition-all ${error ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-transparent focus:bg-white focus:border-rose-100'}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      {error && <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" size={16} />}
    </div>
  </div>
);

export default ServiceOrderForm;
