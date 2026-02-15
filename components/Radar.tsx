
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Product, AppSettings, Order } from '../types';
import { 
  Copy, 
  Volume2, 
  Sparkles, 
  ReceiptText, 
  Globe, 
  Radar as RadarIcon, 
  MessageCircle,
  Zap,
  CheckCircle,
  Power,
  Activity,
  History,
  RefreshCw,
  Edit2,
  Save,
  Loader2,
  DollarSign
} from 'lucide-react';

interface Props {
  products: Product[];
  settings: AppSettings;
  currentStoreId: string;
  onNewOrder: (order: Order) => void;
  onUpdateSettings: (settings: AppSettings) => void;
}

const Radar: React.FC<Props> = ({ products, settings, currentStoreId, onNewOrder, onUpdateSettings }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncingBcv, setIsSyncingBcv] = useState(false);
  const [isEditingBcv, setIsEditingBcv] = useState(false);
  const [tempBcv, setTempBcv] = useState(settings.bcvRate.toString());
  const [analysis, setAnalysis] = useState<any>(null);
  const [voiceResponse, setVoiceResponse] = useState<string | null>(null);
  const [currentTone, setCurrentTone] = useState<'profesional' | 'casual' | 'entusiasta' | 'cercano'>(settings.preferredTone);

  const getTodayFormatted = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getFutureDateFormatted = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const syncBcvFromOfficialSource = async () => {
    setIsSyncingBcv(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Busca en la página oficial del Banco Central de Venezuela (bcv.org.ve) el valor actual del dólar oficial para hoy.
        Responde estrictamente con el número (ej: 36.52). 
        Si no puedes encontrarlo, responde "ERROR".
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });
      const rateText = response.text?.trim() || "";
      const rate = parseFloat(rateText.replace(',', '.'));
      if (!isNaN(rate) && rate > 0) {
        onUpdateSettings({ ...settings, bcvRate: rate });
        setTempBcv(rate.toString());
      } else {
        alert("No se pudo obtener la tasa automáticamente.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión con la fuente oficial.");
    } finally {
      setIsSyncingBcv(false);
    }
  };

  const handleBcvSave = () => {
    const val = parseFloat(tempBcv.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      onUpdateSettings({ ...settings, bcvRate: val });
      setIsEditingBcv(false);
    }
  };

  const processInput = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setAnalysis(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const pm = settings.pagoMovil;
      const pmInfo = pm 
        ? `DATOS DE PAGO MÓVIL: Banco: ${pm.bank}, Cédula/RIF: ${pm.idNumber}, Teléfono: ${pm.phone}`
        : "DATOS DE PAGO MÓVIL: No registrados.";
      const companyContact = settings.companyPhone ? `TELÉFONO DE CONTACTO: ${settings.companyPhone}` : "";

      const prompt = `
        Analiza el siguiente texto de un cliente de una industria textil: "${input}"
        EMPRESA: ${settings.businessName}
        ${companyContact}
        CATÁLOGO DISPONIBLE:
        ${JSON.stringify(products)}
        ${pmInfo}
        REGLAS DE NEGOCIO OBLIGATORIAS:
        1. TODO TRABAJO REQUIERE DEL 50% MINIMO DEL PAGO PARA PODER SER PROCESADO.
        2. NO SE HACEN DEVOLUCIONES DE DINERO.
        REGLAS DE PRECIO:
        1. Identifica los productos solicitados y las cantidades.
        2. Si la cantidad es 12 o más, usa el campo 'priceWholesale'.
        3. Si la cantidad es menor a 12, usa el campo 'priceRetail'.
        4. TASA BCV: ${settings.bcvRate}.
        5. Genera una respuesta de cierre de venta en tono ${currentTone}. SIEMPRE incluye los datos de Pago Móvil y RECUERDA amablemente el abono del 50%.
        Responde estrictamente en este formato JSON:
        {
          "bcv_rate": ${settings.bcvRate > 0 ? settings.bcvRate : 0},
          "items_detected": [{ "name": "", "qty": 0, "subtotal_usd": 0 }],
          "total_usd": 0,
          "total_bs": 0,
          "suggested_reply": "",
          "customer_name": "Cliente"
        }
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: settings.bcvRate === 0 ? [{ googleSearch: {} }] : [],
          responseMimeType: 'application/json'
        }
      });
      const result = JSON.parse(response.text || '{}');
      if (settings.bcvRate === 0 && result.bcv_rate > 0) {
        onUpdateSettings({ ...settings, bcvRate: result.bcv_rate });
        setTempBcv(result.bcv_rate.toString());
      }
      setAnalysis(result);
      generateTTS(result.suggested_reply);
    } catch (e) {
      console.error(e);
      alert("Error procesando con Gemini AI.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateTTS = async (text: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: `Dilo con tono ${currentTone}: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) setVoiceResponse(base64Audio);
    } catch (e) {
      console.error("TTS Error", e);
    }
  };

  const playVoice = () => {
    if (!voiceResponse) return;
    const audio = new Audio(`data:audio/wav;base64,${voiceResponse}`);
    audio.play();
  };

  const createOrder = () => {
    if (!analysis) return;
    const store = settings.stores.find(s => s.id === currentStoreId) || settings.stores[0];
    const orderNum = `${store.prefix}-${String(store.nextOrderNumber).padStart(4, '0')}`;
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: orderNum,
      storeId: currentStoreId,
      customerName: (analysis.customer_name || 'Cliente Radar').toUpperCase(),
      customerCi: '',
      customerPhone: '',
      items: analysis.items_detected.map((i: any) => ({ 
        productId: i.name, 
        name: i.name.toUpperCase(),
        quantity: i.qty, 
        priceUsd: (i.qty > 0) ? (i.subtotal_usd / i.qty) : 0 
      })),
      totalUsd: analysis.total_usd,
      totalBs: analysis.total_bs,
      abonoUsd: 0,
      restanteUsd: analysis.total_usd,
      status: 'pendiente',
      taskStatus: 'esperando',
      bcvRate: settings.bcvRate,
      history: [{
        timestamp: Date.now(),
        agentId: 'admin',
        action: 'Creación vía Radar AI',
        status: 'pendiente'
      }],
      issueDate: getTodayFormatted(),
      deliveryDate: getFutureDateFormatted(7),
      technicalDetails: 'Importado vía Radar AI',
      referenceImages: [],
      paymentMethod: 'DOLARES $'
    };
    const updatedStores = settings.stores.map(s => 
      s.id === currentStoreId ? { ...s, nextOrderNumber: s.nextOrderNumber + 1 } : s
    );
    onUpdateSettings({ ...settings, stores: updatedStores });
    onNewOrder(newOrder);
    setAnalysis(null);
    setInput('');
    setVoiceResponse(null);
    alert("Operación cargada exitosamente.");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative overflow-hidden bg-[#000814] text-white rounded-[3rem] p-6 md:p-10 shadow-[0_35px_80px_-15px_rgba(0,0,0,0.8)] border-4 border-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none">
          <RadarIcon size={350} />
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/10">
                <Activity className="text-slate-300 animate-pulse" size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none text-white">RADAR <span className="text-slate-500">ROXTOR</span></h2>
                <p className="text-slate-600 font-black text-[9px] uppercase tracking-[0.3em] italic mt-1">Inteligencia Operativa Textil</p>
              </div>
            </div>
            <div className="bg-[#1a1a1a] p-3 rounded-[1.5rem] border border-slate-700/50 flex flex-wrap items-center gap-4 shadow-xl">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic ml-2">
                <Sparkles size={12} /> TONO CORPORATIVO:
              </span>
              <div className="flex gap-2">
                {(['profesional', 'casual', 'entusiasta', 'cercano'] as const).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setCurrentTone(tone)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      currentTone === tone 
                        ? 'bg-slate-200 text-[#000814] shadow-lg scale-105' 
                        : 'bg-slate-800/40 text-slate-500 hover:text-white border border-slate-700/30'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative group">
              <textarea
                placeholder="Pegue aquí el mensaje del pedido..."
                className="w-full h-32 p-6 bg-[#0a0a0a]/80 border-2 border-slate-800 rounded-[2rem] resize-none focus:ring-4 focus:ring-slate-700/20 focus:border-slate-600 outline-none text-white font-medium text-base leading-relaxed transition-all placeholder:text-slate-800 shadow-inner"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="absolute bottom-4 right-6 text-white/5 group-focus-within:text-slate-700/20 pointer-events-none transition-colors">
                <MessageCircle size={40} />
              </div>
            </div>
            <button
              onClick={processInput}
              disabled={isProcessing || !input}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-3 ${
                isProcessing 
                  ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                  : 'bg-slate-100 text-[#000814] hover:bg-white shadow-2xl border-b-4 border-slate-400 active:translate-y-1 active:border-b-0 italic'
              }`}
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              {isProcessing ? 'PROCESANDO DATOS...' : 'EJECUTAR ESCANEO'}
            </button>
          </div>
          <div className="lg:col-span-4">
            {analysis ? (
              <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-[#1a1a1a] border border-slate-700/50 rounded-[2rem] p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">
                      <ReceiptText size={14} /> COTIZACIÓN
                    </h4>
                    <span className="bg-slate-300 text-[#000814] px-2 py-0.5 rounded-full text-[8px] font-black">REF: {analysis.customer_name}</span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {analysis.items_detected.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/50">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-400 text-xs">{item.qty}x</span>
                          <p className="font-bold text-slate-200 uppercase text-[9px] truncate max-w-[90px]">{item.name}</p>
                        </div>
                        <p className="font-black text-slate-100 italic text-[10px]">${item.subtotal_usd}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#050505] rounded-[1.5rem] p-4 border border-slate-800 flex justify-between items-center shadow-inner">
                    <div className="text-center flex-1 border-r border-slate-900">
                      <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Total USD</p>
                      <span className="text-xl font-black text-slate-100 italic">${analysis.total_usd}</span>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Total Bs.</p>
                      <span className="text-sm font-black text-slate-300">Bs. {analysis.total_bs}</span>
                    </div>
                  </div>
                  <button onClick={createOrder} className="w-full bg-slate-100 text-[#000814] py-3.5 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg">
                    <CheckCircle size={14} className="text-emerald-600" /> CARGAR ORDEN
                  </button>
                </div>
                <div className="bg-[#121212] border border-slate-800 rounded-[2rem] p-6 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 italic">
                      <Volume2 size={14} /> TEXTO DE VOZ
                    </h4>
                    <button onClick={() => navigator.clipboard.writeText(analysis.suggested_reply)} className="p-1.5 bg-slate-800/50 rounded-lg text-slate-500 hover:text-white transition-colors border border-slate-700/30">
                      <Copy size={12} />
                    </button>
                  </div>
                  <div className="bg-[#050505]/60 rounded-xl p-4 italic text-slate-400 text-[11px] leading-relaxed border border-slate-900 max-h-20 overflow-y-auto custom-scrollbar">
                    "{analysis.suggested_reply}"
                  </div>
                  {voiceResponse && (
                    <button onClick={playVoice} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all font-black text-[9px] uppercase tracking-widest italic shadow-lg border border-slate-700">
                      <Volume2 size={14} /> REPRODUCIR AUDIO
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#050505]/40 border-2 border-dashed border-slate-800/50 rounded-[2.5rem] opacity-30">
                <RadarIcon size={40} className="text-slate-600 mb-4 animate-pulse" />
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] italic">Sistema de Escaneo <br/> en Reposo</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-center w-full">
        <div className="w-full bg-white border-4 border-slate-200 rounded-[3rem] px-10 py-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:border-slate-300">
          <div className="flex items-center gap-6">
            <div className={`w-6 h-6 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] ${settings.bcvRate > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic leading-none">Referencia Oficial</span>
              <span className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">DÓLAR BCV</span>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            {isEditingBcv ? (
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border-2 border-slate-200">
                <span className="text-xl font-black text-slate-400 ml-4">Bs.</span>
                <input type="text" value={tempBcv} onChange={(e) => setTempBcv(e.target.value)} className="w-40 bg-transparent border-none text-4xl font-black text-slate-800 outline-none tabular-nums" autoFocus />
                <button onClick={handleBcvSave} className="bg-[#000814] text-white px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-slate-800 transition-all flex items-center gap-2">
                  <Save size={18}/> GUARDAR
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-6 group cursor-pointer" onClick={() => setIsEditingBcv(true)}>
                <div className="flex flex-col items-center">
                  <span className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter tabular-nums drop-shadow-sm italic">
                    {settings.bcvRate > 0 ? `Bs. ${settings.bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : '---'}
                  </span>
                  <div className="flex items-center gap-2 text-slate-300 group-hover:text-slate-500 transition-colors">
                    <Edit2 size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Presione para ajustar manualmente</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 border-l-0 md:border-l-2 border-slate-100 pl-0 md:pl-8">
            <button onClick={syncBcvFromOfficialSource} disabled={isSyncingBcv} className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg bg-[#000814] text-white hover:bg-slate-800 hover:-translate-y-1 active:translate-y-0">
              {isSyncingBcv ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
              {isSyncingBcv ? 'SINCRONIZANDO...' : 'ACTUALIZAR TASA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Radar;
