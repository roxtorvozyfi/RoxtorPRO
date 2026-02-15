
import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { GoogleGenAI } from '@google/genai';
import { 
  Plus, 
  Trash2, 
  Camera, 
  Loader2, 
  Search, 
  Edit3, 
  X, 
  Image as ImageIcon, 
  Save, 
  FileText,
  Tag,
  Scissors,
  FileUp,
  Globe,
  MapPin,
  Package,
  FileSearch,
  CheckCircle,
  AlertCircle,
  StickyNote
} from 'lucide-react';

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  currentStoreId: string;
}

const Inventory: React.FC<Props> = ({ products, setProducts, currentStoreId }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResults, setImportResults] = useState<Partial<Product>[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    priceRetail: 0,
    priceWholesale: 0,
    material: '',
    description: '',
    additionalConsiderations: '',
    imageUrl: '',
    stock: 0,
    category: 'producto',
    storeId: currentStoreId
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        priceRetail: 0,
        priceWholesale: 0,
        material: '',
        description: '',
        additionalConsiderations: '',
        imageUrl: '',
        stock: 0,
        category: 'producto',
        storeId: currentStoreId
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...formData, id: p.id } : p));
    } else {
      const newProduct: Product = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
      };
      setProducts([newProduct, ...products]);
    }
    setIsModalOpen(false);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setIsImportModalOpen(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
          Analiza este documento de catálogo/lista de precios textil.
          Extrae todos los productos y servicios identificables.
          Para cada item, identifica: nombre, precio al detal, precio al mayor (si existe), material/tela, descripción y consideraciones adicionales (notas especiales, tiempo de entrega extra, restricciones, etc.).
          Devuelve estrictamente un JSON con este formato:
          {
            "extracted_items": [
              { "name": "Nombre", "priceRetail": 0, "priceWholesale": 0, "material": "Tela", "description": "Info", "additionalConsiderations": "Notas especiales", "stock": 0 }
            ]
          }
          Nota importante: El stock siempre debe ser 0 en la extracción. Si no hay consideraciones adicionales, deja el campo vacío.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: file.type, data: base64Data } }
              ]
            }
          ],
          config: { responseMimeType: 'application/json' }
        });

        const result = JSON.parse(response.text || '{"extracted_items": []}');
        setImportResults(result.extracted_items);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert("Error procesando el documento. Asegúrate de que sea una imagen o PDF legible.");
    } finally {
      setIsScanning(false);
    }
  };

  const confirmImport = () => {
    const newItems: Product[] = importResults.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      name: item.name || 'Producto sin nombre',
      priceRetail: item.priceRetail || 0,
      priceWholesale: item.priceWholesale || 0,
      material: item.material || 'No especificado',
      description: item.description || '',
      additionalConsiderations: item.additionalConsiderations || '',
      imageUrl: '',
      stock: 0, // Stock inicial siempre en 0 para importación IA
      category: 'producto',
      storeId: currentStoreId
    }));

    setProducts([...newItems, ...products]);
    setImportResults([]);
    setIsImportModalOpen(false);
    alert(`${newItems.length} productos importados correctamente con stock inicial en 0.`);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.material.toLowerCase().includes(searchQuery.toLowerCase());
    const isStoreMatch = p.storeId === 'global' || p.storeId === currentStoreId;
    return matchesSearch && isStoreMatch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h3 className="text-3xl font-black text-[#000814] tracking-tighter uppercase leading-none italic">CATÁLOGO MAESTRO</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 italic">
            <Globe size={14} className="text-[#004ea1]" /> GESTIÓN CENTRALIZADA POR SEDE
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <input 
            type="file" 
            ref={importInputRef} 
            className="hidden" 
            accept="image/*,application/pdf" 
            onChange={handleImportFile} 
          />
          <button 
            onClick={() => importInputRef.current?.click()}
            className="bg-rose-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-rose-700 shadow-xl transition-all active:scale-95 border-b-4 border-rose-800"
          >
            <FileSearch size={18} /> IMPORTAR CATÁLOGO (AI)
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#000814] text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 shadow-xl transition-all active:scale-95 border-b-4 border-slate-600"
          >
            <Plus size={18} /> NUEVO REGISTRO
          </button>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-[3rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
          <Search size={22} className="text-[#004ea1]/30" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, tela o ficha técnica..." 
            className="bg-transparent border-none outline-none text-base w-full font-bold placeholder:text-slate-300 italic"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white italic">
              <tr>
                <th className="px-10 py-6">PRODUCTO / SERVICIO</th>
                <th className="px-10 py-6">DISPONIBILIDAD</th>
                <th className="px-10 py-6">DETAL ($)</th>
                <th className="px-10 py-6">MAYOR ($)</th>
                <th className="px-10 py-6">ÁMBITO</th>
                <th className="px-10 py-6 text-right">GESTIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm italic">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center opacity-10">
                      <ImageIcon size={64} className="mb-4" />
                      <p className="font-black uppercase tracking-[0.3em] text-xs">Sin registros para esta sucursal</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                          {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" alt="" /> : <ImageIcon size={20} className="text-slate-200" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 uppercase text-sm tracking-tight group-hover:text-[#004ea1] transition-colors">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[180px] mt-1">{p.material || 'MULTIMATERIAL'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                       <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black ${p.stock < 10 ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                         {p.stock} UNIDADES
                       </span>
                    </td>
                    <td className="px-10 py-7 font-black text-slate-900 text-base">${p.priceRetail}</td>
                    <td className="px-10 py-7">
                       <span className="font-black text-[#004ea1] text-base">${p.priceWholesale}</span>
                    </td>
                    <td className="px-10 py-7">
                       {p.storeId === 'global' ? (
                         <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase">
                           <Globe size={12}/> Global
                         </span>
                       ) : (
                         <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                           <MapPin size={12}/> Local
                         </span>
                       )}
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(p)} className="p-3 bg-white border-2 border-slate-100 text-slate-400 hover:text-[#004ea1] hover:border-[#004ea1]/30 rounded-2xl transition-all shadow-sm">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => setProducts(products.filter(item => item.id !== p.id))} className="p-3 bg-white border-2 border-slate-100 text-slate-200 hover:text-red-500 hover:border-red-100 rounded-2xl transition-all shadow-sm">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Importación AI */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#000814]/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-6xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-8 border-white/20">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-rose-600 text-white rounded-3xl flex items-center justify-center shadow-xl rotate-3"><FileSearch size={28}/></div>
                <div>
                  <h4 className="text-3xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">
                    ESCANEO DE CATÁLOGO
                  </h4>
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] mt-2 italic">IA procesando documento fuente...</p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="w-12 h-12 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-10 overflow-y-auto flex-1 bg-white">
              {isScanning ? (
                <div className="h-64 flex flex-col items-center justify-center gap-6">
                  <Loader2 size={48} className="text-rose-600 animate-spin" />
                  <div className="text-center">
                    <p className="font-black text-slate-800 uppercase tracking-widest italic">Analizando Estructura Textil...</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-2">Gemini Vision está leyendo el archivo</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border-2 border-blue-100 rounded-[2rem] p-6 flex items-start gap-4">
                    <AlertCircle className="text-blue-500 shrink-0" size={20} />
                    <p className="text-xs font-bold text-blue-700 leading-relaxed uppercase italic">
                      Se han detectado {importResults.length} items. Todos se cargarán con stock 0 para su revisión.
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-[2.5rem] border-2 border-slate-100">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">NOMBRE</th>
                          <th className="px-6 py-4">TELA</th>
                          <th className="px-6 py-4">DETAL $</th>
                          <th className="px-6 py-4">MAYOR $</th>
                          <th className="px-6 py-4">CONSIDERACIONES</th>
                          <th className="px-6 py-4">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importResults.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors italic">
                            <td className="px-6 py-4 font-black text-slate-800 text-xs uppercase italic">{item.name}</td>
                            <td className="px-6 py-4 font-bold text-slate-400 text-xs uppercase">{item.material}</td>
                            <td className="px-6 py-4 font-black text-slate-900">${item.priceRetail}</td>
                            <td className="px-6 py-4 font-black text-rose-600">${item.priceWholesale}</td>
                            <td className="px-6 py-4 font-bold text-blue-400 text-[10px] uppercase truncate max-w-[150px]">{item.additionalConsiderations || 'SIN NOTAS'}</td>
                            <td className="px-6 py-4">
                              <button onClick={() => setImportResults(importResults.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-red-500">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-10 border-t border-slate-50 flex justify-end gap-6 bg-slate-50/50">
              <button 
                onClick={confirmImport} 
                disabled={isScanning || importResults.length === 0}
                className="bg-rose-600 text-white px-16 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-rose-700 shadow-2xl transition-all active:scale-95 flex items-center gap-3 border-b-4 border-rose-800 italic disabled:opacity-50"
              >
                <CheckCircle size={20} /> CONFIRMAR CARGA (STOCK 0)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reestilizado para Registro Individual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#000814]/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-8 border-white/20">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-[#000814] text-white rounded-3xl flex items-center justify-center shadow-xl rotate-3"><Package size={28}/></div>
                <div>
                  <h4 className="text-3xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">
                    {editingProduct ? 'ACTUALIZAR FICHA' : 'ALTA DE PRODUCTO'}
                  </h4>
                  <p className="text-[10px] font-bold text-[#004ea1] uppercase tracking-[0.2em] mt-2 italic">Registro en base de datos centralizada</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-100 transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-10 overflow-y-auto space-y-10 flex-1 bg-white">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nombre del Item</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all uppercase"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Ámbito de Inventario</label>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => setFormData({...formData, storeId: 'global'})}
                        className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${formData.storeId === 'global' ? 'bg-[#004ea1] text-white border-[#004ea1]' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                       >
                         <Globe size={14} className="mx-auto mb-1" /> GLOBAL
                       </button>
                       <button 
                        onClick={() => setFormData({...formData, storeId: currentStoreId})}
                        className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${formData.storeId === currentStoreId ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                       >
                         <MapPin size={14} className="mx-auto mb-1" /> ESTA TIENDA
                       </button>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-inner">
                  <PriceInput label="PVP Detal ($)" value={formData.priceRetail} onChange={(v) => setFormData({...formData, priceRetail: v})} />
                  <PriceInput label="Precio Mayor ($)" value={formData.priceWholesale} onChange={(v) => setFormData({...formData, priceWholesale: v})} />
                  <PriceInput label="Stock Actual" value={formData.stock} onChange={(v) => setFormData({...formData, stock: v})} />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                    <FileText size={12}/> Descripción Técnica / Materiales
                  </label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-8 py-6 text-slate-800 font-bold focus:bg-white focus:border-[#004ea1]/20 outline-none h-32 resize-none transition-all uppercase"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                    <StickyNote size={12}/> Consideraciones Adicionales
                  </label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-8 py-6 text-blue-600 font-bold focus:bg-white focus:border-blue-100 outline-none h-32 resize-none transition-all uppercase"
                    placeholder="Ej: Solo por encargo, Requiere 3 días extra, Tela delicada..."
                    value={formData.additionalConsiderations}
                    onChange={(e) => setFormData({...formData, additionalConsiderations: e.target.value})}
                  />
                </div>
               </div>
            </div>

            <div className="p-10 border-t border-slate-50 flex justify-end gap-6 bg-slate-50/50">
              <button onClick={handleSave} className="bg-[#004ea1] text-white px-16 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-[#003d7e] shadow-2xl transition-all active:scale-95 flex items-center gap-3 border-b-4 border-[#002d5e] italic">
                <Save size={20} /> GUARDAR EN TODOS LOS NODOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PriceInput = ({ label, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">{label}</label>
    <input 
      type="number" 
      className="w-full bg-white border-2 border-slate-100 rounded-xl px-5 py-3 text-slate-800 font-black focus:border-[#004ea1]/30 outline-none shadow-sm"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  </div>
);

export default Inventory;
