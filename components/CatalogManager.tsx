
import React, { useState, useRef } from 'react';
import { Product, AppSettings } from '../types';
import { 
  Plus, Trash2, X, Loader2, Sparkles, Check, Edit3, Save, Image as ImageIcon, Box, Lock, ShieldCheck, DollarSign, Layers, Clock, Tag, FileUp
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Props {
  products: Product[];
  onAdd: (product: Omit<Product, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (product: Product) => void;
  onBulkAdd: (products: Omit<Product, 'id'>[]) => void;
  settings: AppSettings;
}

const CatalogManager: React.FC<Props> = ({ products, onAdd, onDelete, onUpdate, onBulkAdd, settings }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isInventoryUnlocked, setIsInventoryUnlocked] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    price: 0,
    wholesalePrice: 0,
    fabricType: '',
    deliveryTime: '7 a 10 días',
    wholesaleDiscount: '10%',
    techniques: '',
    imageUrl: '',
    cloudImageUrl: '',
    inventory: 0
  });

  const handleImportCatalog = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { mimeType: file.type, data: base64Data } },
              { text: "Eres un experto en inventario textil de Inversiones Roxtor. Analiza este documento (imagen o PDF). Extrae todos los productos y servicios. Para cada uno identifica: nombre, precio detal ($), precio mayor ($), descripción, material/tela y stock inicial. Responde ÚNICAMENTE con un array JSON con este formato: [{\"name\": string, \"price\": number, \"wholesalePrice\": number, \"description\": string, \"fabricType\": string, \"inventory\": number}]. No incluyas explicaciones, solo el JSON." }
            ]
          },
          config: { responseMimeType: "application/json" }
        });

        const extractedProducts = JSON.parse(response.text || '[]');
        if (extractedProducts.length > 0) {
          const formatted = extractedProducts.map((p: any) => ({
            ...p,
            deliveryTime: '7 a 10 días',
            wholesaleDiscount: '10%',
            techniques: '',
            imageUrl: '',
            cloudImageUrl: ''
          }));
          onBulkAdd(formatted);
          alert(`✅ Éxito: Se han importado ${formatted.length} productos mediante IA.`);
        } else {
          alert("⚠️ No se detectaron productos legibles en el documento.");
        }
      } catch (err) {
        console.error(err);
        alert("❌ Error analizando el catálogo. Asegúrate de que el archivo sea legible.");
      } finally {
        setIsAnalyzing(false);
        if (importInputRef.current) importInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const unlockInventory = () => {
    const pin = prompt("SEGURIDAD: INGRESE PIN DE GERENCIA PARA EDITAR STOCK:");
    if (pin === settings.masterPin) {
      setIsInventoryUnlocked(true);
    } else {
      alert("PIN DENEGADO.");
    }
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({ ...p });
    setImagePreview(p.imageUrl || null);
    setIsInventoryUnlocked(false);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdate({ ...formData, id: editingProduct.id });
    } else {
      onAdd(formData);
    }
    setFormData({ name: '', description: '', price: 0, wholesalePrice: 0, fabricType: '', deliveryTime: '7 a 10 días', wholesaleDiscount: '10%', techniques: '', imageUrl: '', cloudImageUrl: '', inventory: 0 });
    setImagePreview(null);
    setEditingProduct(null);
    setIsInventoryUnlocked(false);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        ref={importInputRef} 
        onChange={handleImportCatalog} 
        className="hidden" 
        accept="image/*,application/pdf"
      />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight italic uppercase">Catálogo <span className="text-red-600">Premium</span></h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Gestión de Productos e Insumos Textiles</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => importInputRef.current?.click()} 
            disabled={isAnalyzing}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-5 rounded-[22px] font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isAnalyzing ? 'ANALIZANDO...' : 'IMPORTAR CON IA'}
          </button>
          <button 
            onClick={() => { setEditingProduct(null); setIsFormOpen(true); setIsInventoryUnlocked(false); }} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-900 text-white px-6 py-5 rounded-[22px] font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all"
          >
            <Plus size={18} /> AGREGAR
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-blue-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[45px] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-12 shadow-2xl space-y-10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center border-b pb-6">
              <h3 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter">
                {editingProduct ? 'Editar Ficha Técnica' : 'Nuevo Ingreso a Catálogo'}
              </h3>
              <button onClick={() => { setIsFormOpen(false); setEditingProduct(null); }} className="p-4 bg-slate-100 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-md"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group hover:border-blue-900 transition-all shadow-inner">
                  {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <div className="text-center p-6"><ImageIcon size={64} className="mx-auto text-blue-200 mb-4"/><p className="text-[11px] font-black uppercase text-slate-400">Seleccionar Imagen de Alta Calidad</p></div>}
                  <input type="file" ref={fileInputRef} onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onloadend = () => { setImagePreview(r.result as string); setFormData({...formData, imageUrl: r.result as string}); };
                      r.readAsDataURL(f);
                    }
                  }} className="hidden" accept="image/*" />
                </div>
                
                <div className={`p-8 rounded-[35px] border-2 transition-all shadow-sm ${isInventoryUnlocked ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                   <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-3 mb-4 tracking-widest">
                     {isInventoryUnlocked ? <Check size={16} className="text-emerald-500"/> : <Lock size={16}/>} 
                     Control de Stock Disponible
                   </label>
                   {isInventoryUnlocked ? (
                     <div className="relative">
                        <Box className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500" size={24}/>
                        <input type="number" className="w-full bg-white p-6 pl-14 rounded-2xl font-black text-2xl text-emerald-900 outline-none border border-emerald-100 shadow-inner" placeholder="0" value={formData.inventory} onChange={e => setFormData({...formData, inventory: Number(e.target.value)})} />
                     </div>
                   ) : (
                     <button type="button" onClick={unlockInventory} className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
                       <ShieldCheck size={18}/> DESBLOQUEAR PARA EDICIÓN
                     </button>
                   )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Nombre del Producto</label>
                  <input required placeholder="Ej: Camiseta Roxtor Elite V2" className="w-full bg-slate-50 p-6 rounded-2xl font-black text-sm outline-none border-2 border-transparent focus:border-blue-900 transition-all uppercase shadow-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">PVP Detal ($)</label>
                      <div className="relative">
                        <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-900"/>
                        <input required type="number" step="0.01" className="w-full bg-slate-50 p-6 pl-12 rounded-2xl font-black text-xl outline-none border-2 border-transparent focus:border-blue-900 transition-all shadow-sm" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Precio Mayor ($)</label>
                      <div className="relative">
                        <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600"/>
                        <input type="number" step="0.01" className="w-full bg-slate-50 p-6 pl-12 rounded-2xl font-black text-xl outline-none border-2 border-transparent focus:border-red-600 transition-all shadow-sm" value={formData.wholesalePrice || ''} onChange={e => setFormData({...formData, wholesalePrice: Number(e.target.value)})} />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Material / Tela</label>
                    <div className="relative">
                       <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"/>
                       <input placeholder="Ej: Algodón" className="w-full bg-slate-50 p-5 pl-12 rounded-2xl font-black text-xs outline-none uppercase shadow-sm" value={formData.fabricType} onChange={e => setFormData({...formData, fabricType: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Tiempo Entrega</label>
                    <div className="relative">
                       <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"/>
                       <input placeholder="Ej: 3-5 días" className="w-full bg-slate-50 p-5 pl-12 rounded-2xl font-black text-xs outline-none uppercase shadow-sm" value={formData.deliveryTime} onChange={e => setFormData({...formData, deliveryTime: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Descripción y Detalles</label>
                  <textarea placeholder="Especificaciones técnicas..." className="w-full bg-slate-50 p-6 rounded-3xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-900 transition-all min-h-[150px] resize-none uppercase shadow-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                <button className="w-full bg-blue-900 text-white py-8 rounded-[35px] font-black text-sm uppercase shadow-2xl flex items-center justify-center gap-4 hover:bg-blue-800 transition-all active:scale-95">
                  <Save size={24}/> {editingProduct ? 'ACTUALIZAR DATOS' : 'PUBLICAR EN CATÁLOGO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {products.map((product) => (
          <div key={product.id} className="bg-white border-2 border-slate-100 rounded-[50px] overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
            <div className="aspect-square bg-slate-100 relative overflow-hidden">
              {(product.imageUrl || product.cloudImageUrl) ? (
                <img src={product.imageUrl || product.cloudImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon size={64}/></div>
              )}
              <div className="absolute top-8 left-8 flex flex-col gap-3">
                <span className="bg-blue-900 text-white text-[11px] font-black px-6 py-3 rounded-2xl shadow-2xl uppercase italic tracking-tighter">Detal: ${product.price}</span>
                <span className={`text-[11px] font-black px-6 py-3 rounded-2xl shadow-2xl uppercase italic tracking-tighter ${product.inventory > 10 ? 'bg-emerald-500 text-white' : (product.inventory > 0 ? 'bg-orange-500 text-white' : 'bg-red-500 text-white')}`}>Stock: {product.inventory}</span>
              </div>
            </div>
            <div className="p-10 flex-1 flex flex-col">
              <h3 className="font-black text-blue-900 text-2xl uppercase italic tracking-tighter leading-tight mb-2">{product.name}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase italic line-clamp-2 mb-8">{product.description || 'Sin descripción técnica'}</p>
              <div className="flex gap-3 mt-auto">
                <button onClick={() => handleOpenEdit(product)} className="flex-1 bg-slate-900 text-white py-5 rounded-[22px] text-[11px] font-black uppercase flex items-center justify-center gap-3 shadow-lg">
                  <Edit3 size={18}/> MODIFICAR
                </button>
                <button onClick={() => { if(confirm('¿ELIMINAR PRODUCTO DE CATÁLOGO?')) onDelete(product.id); }} className="p-5 bg-red-50 text-red-400 rounded-[22px] hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={22}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CatalogManager;
