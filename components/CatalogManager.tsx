
import React, { useState, useRef } from 'react';
import { Product, AppSettings } from '../types';
import { Plus, Trash2, Package, Tag, Clock, Scissors, Ruler, FileUp, Loader2, Image as ImageIcon, X, TrendingDown, DollarSign, Download, Share2, AlignLeft, Camera, Instagram, Phone } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);
  const itemImageInputRef = useRef<HTMLInputElement>(null);
  const [currentUpdatingId, setCurrentUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    wholesalePrice: 0,
    fabricType: '',
    deliveryTime: '',
    wholesaleDiscount: '',
    sizePriceAdjustment: '',
    imageUrl: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData({ ...formData, imageUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleItemImageUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUpdatingId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const product = products.find(p => p.id === currentUpdatingId);
        if (product) {
          onUpdate({ ...product, imageUrl: base64 });
        }
        setCurrentUpdatingId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerItemImageUpdate = (id: string) => {
    setCurrentUpdatingId(id);
    itemImageInputRef.current?.click();
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      // Corrected initialization of GoogleGenAI using named parameter and process.env.API_KEY directly.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const reader = new FileReader();
      
      const fileData = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      const prompt = `Extrae productos de este catálogo textil. Campos: name, description, price (detal), wholesalePrice (mayor), fabricType (telas), sizePriceAdjustment (tallas extras). Devuelve JSON Array.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: fileData, mimeType: file.type } }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                price: { type: Type.NUMBER },
                wholesalePrice: { type: Type.NUMBER },
                fabricType: { type: Type.STRING },
                sizePriceAdjustment: { type: Type.STRING },
              },
              required: ["name", "price"]
            }
          }
        }
      });

      // Correctly accessing the .text property of GenerateContentResponse.
      const extracted = JSON.parse(response.text || "[]");
      onBulkAdd(extracted);
      alert(`${extracted.length} productos añadidos.`);
    } catch (error) {
      alert("Error al procesar el catálogo.");
    } finally {
      setIsAnalyzing(false);
      if (bulkFileRef.current) bulkFileRef.current.value = '';
    }
  };

  const exportAsImage = (product: Product) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1920; 

    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawHeader = (logoImg?: HTMLImageElement) => {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, 240);
      if (logoImg) {
        ctx.drawImage(logoImg, 60, 30, 180, 180);
      }
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.font = '900 48px Inter';
      ctx.fillText(settings.companyName, logoImg ? 260 : 60, 90);
      ctx.fillStyle = '#10b981'; ctx.font = 'bold 24px Inter';
      ctx.fillText(`RIF: ${settings.companyRif}`, logoImg ? 260 : 60, 130);
      ctx.textAlign = 'right'; ctx.fillStyle = '#94a3b8'; ctx.font = '600 20px Inter';
      ctx.fillText(settings.companyPhone, canvas.width - 60, 85);
    };

    const drawProduct = (img?: HTMLImageElement, logoImg?: HTMLImageElement) => {
      drawHeader(logoImg);
      if (img) {
        const ratio = Math.max(canvas.width / img.width, 1000 / img.height);
        const nw = img.width * ratio; const nh = img.height * ratio;
        ctx.drawImage(img, (canvas.width - nw) / 2, 240, nw, nh);
      }
      ctx.textAlign = 'left'; ctx.fillStyle = '#0f172a'; ctx.font = '900 75px Inter';
      ctx.fillText(product.name.toUpperCase(), 60, 1380);
      ctx.fillStyle = '#10b981'; ctx.font = '900 70px Inter';
      ctx.fillText(`$${product.price}`, 60, 1550);
      const link = document.createElement('a');
      link.download = `Roxtor_${product.name}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    };

    const prodImg = product.imageUrl ? new Image() : null;
    const logoImg = settings.companyLogo ? new Image() : null;
    if (prodImg) prodImg.crossOrigin = "anonymous";
    if (logoImg) logoImg.crossOrigin = "anonymous";

    let loaded = 0;
    const total = (prodImg ? 1 : 0) + (logoImg ? 1 : 0);
    const check = () => { loaded++; if(loaded >= total) drawProduct(prodImg || undefined, logoImg || undefined); };
    if (total === 0) drawProduct();
    else {
      if (prodImg) { prodImg.onload = check; prodImg.src = product.imageUrl!; }
      if (logoImg) { logoImg.onload = check; logoImg.src = settings.companyLogo!; }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ name: '', description: '', price: 0, wholesalePrice: 0, fabricType: '', deliveryTime: '', wholesaleDiscount: '', sizePriceAdjustment: '', imageUrl: '' });
    setImagePreview(null);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <input type="file" ref={itemImageInputRef} onChange={handleItemImageUpdate} className="hidden" accept="image/*" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Catálogo {settings.companyName.split(',')[0]}</h2>
          <p className="text-gray-500 font-medium">{settings.companyRif} | Soluciones Creativas</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input type="file" ref={bulkFileRef} onChange={handleBulkImport} className="hidden" accept=".pdf,image/*" />
          <button onClick={() => bulkFileRef.current?.click()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border-2 border-slate-900 text-slate-900 px-4 py-3 rounded-2xl font-black text-xs uppercase">
            <FileUp size={16} /> Escanear
          </button>
          <button onClick={() => setIsFormOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase">
            <Plus size={18} /> Nuevo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {products.map((product) => (
          <div key={product.id} className="bg-white border rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all group flex flex-col border-slate-100">
            <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
              {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <button onClick={() => triggerItemImageUpdate(product.id)} className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300"><Camera size={56}/></button>}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <span className="bg-white/95 text-slate-900 text-[10px] font-black px-4 py-2 rounded-2xl shadow-lg border border-emerald-50">${product.price}</span>
                <button onClick={() => exportAsImage(product)} className="bg-white p-3 rounded-2xl text-emerald-600 shadow-xl"><Download size={20}/></button>
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <h3 className="font-black text-slate-900 text-xl leading-tight mb-2 uppercase tracking-tight">{product.name}</h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 line-clamp-2">{product.fabricType}</p>
              <button onClick={() => exportAsImage(product)} className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2">
                <Share2 size={16}/> Compartir Ficha
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CatalogManager;
