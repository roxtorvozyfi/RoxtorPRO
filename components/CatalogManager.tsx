
import React, { useState, useRef } from 'react';
import { Product, AppSettings } from '../types';
import { 
  Plus, Trash2, Camera, Download, Share2, X, Loader2, 
  Mic, FileText, UploadCloud, Sparkles, Check, AlertCircle,
  Edit3, Save, Link, Image as ImageIcon
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

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
    cloudImageUrl: ''
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
              { text: "Analiza este documento (PDF o Imagen). Extrae productos textiles y servicios. Genera un JSON array: [{name, price, wholesalePrice, description, fabricType, techniques}]. Si detectas precios, inclúyelos." }
            ]
          },
          config: { responseMimeType: "application/json" }
        });

        const extracted = JSON.parse(response.text || '[]');
        if (extracted.length > 0) {
          onBulkAdd(extracted.map((p: any) => ({
            ...p,
            deliveryTime: '7 a 10 días',
            wholesaleDiscount: '10%',
            imageUrl: '',
            cloudImageUrl: ''
          })));
          alert(`¡Exitoso! Se han importado ${extracted.length} ítems. Puedes modificarlos individualmente.`);
        }
      } catch (err) {
        alert("Error procesando el archivo. Verifica que el formato sea PDF o Imagen clara.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({ ...p });
    setImagePreview(p.imageUrl || null);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdate({ ...formData, id: editingProduct.id });
    } else {
      onAdd(formData);
    }
    setFormData({ name: '', description: '', price: 0, wholesalePrice: 0, fabricType: '', deliveryTime: '7 a 10 días', wholesaleDiscount: '10%', techniques: '', imageUrl: '', cloudImageUrl: '' });
    setImagePreview(null);
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <input type="file" ref={importFileInputRef} onChange={handleImportCatalog} className="hidden" accept="image/*,.pdf" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight italic uppercase">Catálogo & <span className="text-red-600">Servicios</span></h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Inversiones Roxtor C.A.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-900 text-white px-6 py-4 rounded-[22px] font-black text-[9px] uppercase shadow-xl active:scale-95 transition-all">
            <Plus size={16} /> NUEVO ITEM
          </button>
          <button onClick={() => importFileInputRef.current?.click()} disabled={isAnalyzing} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-[22px] font-black text-[9px] uppercase shadow-xl active:scale-95 transition-all">
            {isAnalyzing ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} />} IMPORTAR IA (PDF/IMG)
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-blue-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-blue-900 uppercase italic">{editingProduct ? 'Modificar Item' : 'Registro Técnico'}</h3>
              <button onClick={() => { setIsFormOpen(false); setEditingProduct(null); }} className="p-3 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div onClick={() => fileInputRef.current?.click()} className="aspect-[4/3] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[35px] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group hover:border-blue-900 transition-all">
                  {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : (formData.cloudImageUrl ? <div className="text-center p-6"><ImageIcon size={40} className="mx-auto text-blue-300"/><p className="text-[8px] font-black uppercase mt-2">Usando Link de Nube</p></div> : <Camera size={40} className="text-slate-300" />)}
                  <input type="file" ref={fileInputRef} onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onloadend = () => { setImagePreview(r.result as string); setFormData({...formData, imageUrl: r.result as string}); };
                      r.readAsDataURL(f);
                    }
                  }} className="hidden" accept="image/*" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><Link size={12}/> Link de Referencia (Google Drive/Cloud)</label>
                  <input placeholder="URL de imagen en la nube..." className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs outline-none" value={formData.cloudImageUrl} onChange={e => setFormData({...formData, cloudImageUrl: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <input required placeholder="Nombre del Producto/Servicio" className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs outline-none uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Detal $</label>
                      <input required type="number" step="0.01" className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs outline-none" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Mayor $</label>
                      <input type="number" step="0.01" className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs outline-none" value={formData.wholesalePrice || ''} onChange={e => setFormData({...formData, wholesalePrice: Number(e.target.value)})} />
                   </div>
                </div>
                <input placeholder="Telas / Materiales" className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs outline-none uppercase" value={formData.fabricType} onChange={e => setFormData({...formData, fabricType: e.target.value})} />
                <input placeholder="Técnicas Aplicables (DTF, Bordado...)" className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs outline-none uppercase" value={formData.techniques} onChange={e => setFormData({...formData, techniques: e.target.value})} />
                <textarea placeholder="Descripción detallada..." className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs outline-none min-h-[100px]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <button className="w-full bg-blue-900 text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                  {editingProduct ? 'ACTUALIZAR REGISTRO' : 'GUARDAR EN STOCK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
        {products.map((product) => (
          <div key={product.id} className="bg-white border-2 border-slate-100 rounded-[45px] overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
            <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
              {(product.imageUrl || product.cloudImageUrl) ? (
                <img src={product.imageUrl || product.cloudImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={48}/></div>
              )}
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <span className="bg-blue-900 text-white text-[10px] font-black px-5 py-2.5 rounded-2xl shadow-xl uppercase tracking-tighter">Detal: ${product.price}</span>
                {product.wholesalePrice > 0 && <span className="bg-red-600 text-white text-[10px] font-black px-5 py-2.5 rounded-2xl shadow-xl uppercase tracking-tighter">Mayor: ${product.wholesalePrice}</span>}
              </div>
            </div>
            <div className="p-10 flex-1 flex flex-col">
              <h3 className="font-black text-blue-900 text-2xl leading-tight mb-4 uppercase italic tracking-tighter">{product.name}</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {product.fabricType && <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-4 py-2 rounded-xl uppercase">{product.fabricType}</span>}
                {product.techniques && <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-4 py-2 rounded-xl uppercase">{product.techniques}</span>}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase italic line-clamp-2 mb-8">{product.description}</p>
              <div className="flex gap-3 mt-auto">
                <button onClick={() => handleOpenEdit(product)} className="flex-1 bg-slate-900 text-white py-5 rounded-[22px] text-[10px] font-black uppercase flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
                  <Edit3 size={18}/> MODIFICAR
                </button>
                <button onClick={() => onDelete(product.id)} className="p-5 bg-red-50 text-red-400 rounded-[22px] hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CatalogManager;
