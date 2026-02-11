
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Product, ActiveLead, AppSettings, Order, Agent } from '../types';
import { 
  Send, Loader2, Bot, MessageCircle, Zap, 
  Trash2, Globe, AlertCircle, UserPlus, Flame, 
  Calculator, RefreshCcw, ExternalLink, FileText, 
  CheckCircle, ChevronRight, Layers, Sparkles, 
  TrendingUp, PhoneForwarded, Factory, Info, Monitor,
  Radio, Search, Smartphone, Users, X, ClipboardPaste,
  Printer, Instagram, Phone, MapPin, ShieldCheck, Mic, Volume2, Square
} from 'lucide-react';

interface Props {
  products: Product[];
  orders: Order[];
  settings: AppSettings;
  onOrderCreated: (order: Order) => void;
  onUpdateSettings: (s: AppSettings) => void;
}

const VoiceAssistant: React.FC<Props> = ({ products, orders, settings, onOrderCreated, onUpdateSettings }) => {
  const [leads, setLeads] = useState<ActiveLead[]>(() => JSON.parse(localStorage.getItem('roxtor_leads') || '[]'));
  const [selectedLead, setSelectedLead] = useState<ActiveLead | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const [activeAccountId, setActiveAccountId] = useState(settings.stores[0]?.whatsappId || '1');
  const [manualText, setManualText] = useState('');
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    localStorage.setItem('roxtor_leads', JSON.stringify(leads));
  }, [leads]);

  const activeStore = settings.stores.find(s => s.whatsappId === activeAccountId) || settings.stores[0];

  // Función para leer la respuesta (TTS)
  const speakResponse = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Lee esto con tono profesional y servicial para un cliente de Roxtor: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioData = atob(base64Audio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioData.length; i++) {
          view[i] = audioData.charCodeAt(i);
        }
        
        // Decodificar PCM manual
        const dataInt16 = new Int16Array(arrayBuffer);
        const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error(e);
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Tu navegador no soporta dictado de voz.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'es-VE';
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setManualText(prev => prev + " " + transcript);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const fetchBcvRate = async () => {
    setIsUpdatingRate(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: "Busca la tasa oficial BCV en bcv.org.ve para hoy. Responde solo con el número decimal.",
        config: { tools: [{ googleSearch: {} }] }
      });
      const rateStr = response.text?.match(/\d+[,.]\d+/)?.[0].replace(',', '.');
      const rate = parseFloat(rateStr || "0");
      if (rate > 0) {
        onUpdateSettings({ 
          ...settings, 
          currentBcvRate: rate,
          lastRateUpdate: new Date().toLocaleString()
        });
      }
    } catch (e) { console.error(e); } finally { setIsUpdatingRate(false); }
  };

  const processChatText = async (text: string) => {
    if (!text || text.length < 5) return alert("Copia el chat de WhatsApp o dicta el mensaje.");
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [{
            text: `Eres el Asistente Elite de Roxtor. Analiza el chat de WhatsApp y genera un presupuesto. Tasa BCV: ${settings.currentBcvRate}.
            Extrae: Nombre cliente, productos detectados y genera una respuesta de cierre profesional con el tono de Soluciones Creativas.
            SALIDA JSON: { "clientName": string, "status": "hot"|"warm", "summary": string, "suggestedAction": string, "totalQuoteUSD": number, "detectedProducts": [] }`
          }, { text }]
        },
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text || '{}');
      const newLead: ActiveLead = {
        id: Date.now().toString(),
        ...data,
        lastMessage: text.slice(-100),
        lastUpdate: new Date().toLocaleTimeString(),
        accountSource: activeAccountId
      };
      setLeads(prev => [newLead, ...prev]);
      setSelectedLead(newLead);
      setIsPasteModalOpen(false);
      setManualText('');
    } catch (e) { alert("Error de Radar."); } finally { setIsAnalyzing(false); }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-24">
      
      <div className="relative overflow-hidden bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5"><Radio size={320} className={isAnalyzing || isRecording ? "animate-pulse" : ""} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Radar de <span className="text-blue-400">Voz</span></h2>
            <p className="text-slate-400 text-sm font-medium max-w-md mx-auto md:mx-0">Captura mensajes de voz o chats para automatizar tus ventas en Roxtor.</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
               <button onClick={() => window.open('https://web.whatsapp.com', '_blank')} className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase border border-white/10 flex items-center gap-2">
                 <ExternalLink size={14}/> WhatsApp Web
               </button>
            </div>
          </div>
          <div className="relative group">
            <div className={`absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 ${isRecording || isAnalyzing ? 'animate-pulse' : ''}`}></div>
            <button onClick={() => setIsPasteModalOpen(true)} className="w-48 h-48 rounded-full bg-blue-900 shadow-[0_0_50px_rgba(30,58,138,0.5)] flex flex-col items-center justify-center border-8 border-slate-900 relative z-10 active:scale-95 transition-all">
              {isAnalyzing ? <Loader2 className="animate-spin text-blue-400" size={48}/> : (isRecording ? <Mic className="animate-bounce text-red-500" size={48} /> : <Zap size={48} className="text-blue-400" />)}
              <span className="text-[10px] font-black uppercase mt-3 tracking-widest">{isRecording ? 'Escuchando...' : 'Iniciar Radar'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white border-2 border-slate-100 rounded-[45px] p-10 flex items-center justify-between group shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-8">
            <div className="bg-blue-900 w-20 h-20 rounded-[30px] flex items-center justify-center text-white shadow-xl"><Globe size={36}/></div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tasa BCV Oficial</p>
              <h4 className="text-5xl font-black text-blue-900 italic mt-1">{settings.currentBcvRate} <span className="text-2xl not-italic">VES</span></h4>
            </div>
          </div>
          <button onClick={fetchBcvRate} className={`w-16 h-16 rounded-[22px] bg-slate-50 flex items-center justify-center text-blue-900 hover:bg-blue-900 hover:text-white transition-all shadow-sm ${isUpdatingRate ? 'animate-spin' : ''}`}><RefreshCcw size={24}/></button>
        </div>
        <div className="bg-white border-2 border-slate-100 rounded-[45px] p-10 flex flex-col justify-center shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-3 text-center tracking-[0.2em]">Sede Activa</p>
          <select value={activeAccountId} onChange={e => setActiveAccountId(e.target.value)} className="bg-slate-50 p-5 rounded-2xl font-black text-sm text-blue-900 text-center border-none outline-none appearance-none cursor-pointer">
            {settings.stores.map(s => <option key={s.id} value={s.whatsappId}>{s.name.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[50px] w-full max-w-xl p-12 space-y-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
               <h4 className="font-black text-2xl text-blue-900 uppercase italic">Entrada de Datos</h4>
               <button onClick={() => setIsPasteModalOpen(false)} className="p-3 bg-slate-100 rounded-full"><X size={24}/></button>
            </div>
            <div className="relative">
              <textarea 
                className="w-full bg-slate-50 p-8 rounded-[35px] h-72 font-bold text-slate-700 outline-none border-2 border-transparent focus:border-blue-900 transition-all resize-none" 
                value={manualText} 
                onChange={e => setManualText(e.target.value)} 
                placeholder="Pega el chat o usa el dictado..."
              />
              <button 
                onClick={startListening} 
                className={`absolute bottom-6 right-6 p-6 rounded-full shadow-2xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-900 text-white'}`}
              >
                {isRecording ? <Square size={24}/> : <Mic size={24}/>}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setManualText('')} className="bg-slate-100 py-6 rounded-[25px] font-black text-[10px] uppercase tracking-widest text-slate-400">Limpiar</button>
               <button 
                 onClick={() => processChatText(manualText)} 
                 disabled={isAnalyzing || !manualText}
                 className="bg-blue-900 text-white py-6 rounded-[25px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
               >
                 {isAnalyzing ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>} PROCESAR SEÑAL
               </button>
            </div>
          </div>
        </div>
      )}

      {selectedLead && (
        <div className="bg-white border-2 border-slate-100 rounded-[55px] p-12 space-y-10 animate-in slide-in-from-bottom duration-500 shadow-xl">
           <div className="flex justify-between items-start">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-blue-900 rounded-[22px] flex items-center justify-center text-white"><UserPlus size={28}/></div>
                 <div>
                    <h2 className="text-4xl font-black text-blue-900 uppercase italic tracking-tighter">{selectedLead.clientName}</h2>
                    <div className="flex gap-2 mt-2">
                       <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${selectedLead.status === 'hot' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{selectedLead.status}</span>
                       <span className="bg-slate-100 text-slate-400 px-4 py-1.5 rounded-full text-[8px] font-black uppercase">Ref. ${selectedLead.totalQuoteUSD.toFixed(2)}</span>
                    </div>
                 </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-4 bg-slate-50 text-slate-300 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={24}/></button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                 <div className="bg-blue-50/50 p-10 rounded-[45px] border-2 border-blue-100 relative group">
                    <div className="absolute top-8 right-8 flex gap-2">
                       <button 
                         onClick={() => speakResponse(selectedLead.suggestedAction)} 
                         className={`p-4 rounded-2xl transition-all shadow-lg ${isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-blue-900 hover:bg-blue-900 hover:text-white'}`}
                       >
                         {isSpeaking ? <Volume2 className="animate-bounce" size={20}/> : <Volume2 size={20}/>}
                       </button>
                    </div>
                    <h5 className="font-black text-blue-900 text-[10px] uppercase mb-6 italic tracking-widest flex items-center gap-2"><Sparkles size={14}/> Respuesta Sugerida Roxtor</h5>
                    <div className="bg-white p-8 rounded-[30px] border border-blue-100 text-sm font-bold text-blue-900 leading-relaxed shadow-sm min-h-[150px]">
                      {selectedLead.suggestedAction}
                    </div>
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(selectedLead.suggestedAction)}`, '_blank')} className="bg-blue-900 text-white py-6 rounded-[25px] font-black text-[10px] uppercase flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all">
                         <Send size={18}/> ENVIAR A WHATSAPP
                       </button>
                       <button onClick={() => navigator.clipboard.writeText(selectedLead.suggestedAction)} className="bg-white border-2 border-blue-100 text-blue-900 py-6 rounded-[25px] font-black text-[10px] uppercase flex items-center justify-center gap-4 hover:bg-blue-50 transition-all">
                         <ClipboardPaste size={18}/> COPIAR TEXTO
                       </button>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-slate-900 text-white p-10 rounded-[45px] shadow-2xl">
                    <h5 className="font-black text-blue-400 text-[10px] uppercase mb-6 tracking-widest">Resumen de Cotización</h5>
                    <div className="space-y-4">
                       {selectedLead.detectedProducts.map((p, i) => (
                          <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">{p.quantity}x {p.name}</span>
                             <span className="text-xs font-black text-white italic">${(p.quantity * p.price).toFixed(2)}</span>
                          </div>
                       ))}
                       <div className="pt-4 flex justify-between items-end">
                          <p className="text-[9px] font-black text-blue-400 uppercase">Total Estimado</p>
                          <p className="text-3xl font-black italic text-white">${selectedLead.totalQuoteUSD.toFixed(2)}</p>
                       </div>
                    </div>
                 </div>
                 <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[40px] text-center">
                    <p className="text-[9px] font-black text-emerald-600 uppercase mb-3">Sugerencia de Cierre</p>
                    <p className="text-xs font-black text-slate-700 italic">"{selectedLead.summary}"</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {leads.length > 0 && !selectedLead && (
        <div className="space-y-6">
           <h3 className="text-2xl font-black text-blue-900 uppercase italic px-4">Historial de Radar</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leads.map(lead => (
                <div key={lead.id} onClick={() => setSelectedLead(lead)} className="bg-white p-8 rounded-[40px] border-2 border-slate-100 hover:border-blue-900 transition-all cursor-pointer group shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <h4 className="font-black text-blue-900 uppercase italic text-lg leading-none">{lead.clientName}</h4>
                      <span className={`px-3 py-1 rounded-lg text-[7px] font-black uppercase ${lead.status === 'hot' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{lead.status}</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase line-clamp-2 mb-6 italic">"{lead.summary}"</p>
                   <div className="flex justify-between items-center border-t pt-4">
                      <span className="text-[9px] font-black text-blue-900 italic">${lead.totalQuoteUSD.toFixed(2)}</span>
                      <span className="text-[8px] font-bold text-slate-300 uppercase">{lead.lastUpdate}</span>
                   </div>
                </div>
              ))}
           </div>
           <button onClick={() => {if(confirm('¿Borrar historial?')){setLeads([]); localStorage.removeItem('roxtor_leads');}}} className="w-full py-4 text-slate-300 font-black text-[9px] uppercase hover:text-red-500 transition-all flex items-center justify-center gap-2">
              <Trash2 size={14}/> LIMPIAR HISTORIAL DE RADAR
           </button>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
