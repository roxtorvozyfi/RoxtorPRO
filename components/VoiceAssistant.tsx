
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Product, Order, WorkshopGroup, PaymentMethod, AssistantTone, AppSettings } from '../types';
import { Mic, Send, Loader2, Bot, MessageCircle, Zap, Square, Play, ShieldCheck, ShoppingCart, CreditCard, FileDown, ExternalLink, Download, CheckCircle2, Camera } from 'lucide-react';

// Manually implementing encode and decode according to GenAI guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface Props {
  products: Product[];
  orders: Order[];
  groups: WorkshopGroup[];
  paymentMethods: PaymentMethod[];
  settings: AppSettings;
  onOrderCreated: (order: Order) => void;
}

const VoiceAssistant: React.FC<Props> = ({ products, orders, groups, paymentMethods, settings, onOrderCreated }) => {
  const [isPilotoActive, setIsPilotoActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveOutContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const initAudio = () => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    if (!liveOutContextRef.current) liveOutContextRef.current = new AudioContext({ sampleRate: 24000 });
  };

  const stopPiloto = useCallback(() => {
    if (sessionRef.current) sessionRef.current.close();
    sessionRef.current = null;
    setIsPilotoActive(false);
  }, []);

  const generateOrderReceipt = (order: Order) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 1100;
    
    const renderCanvas = (logoImg?: HTMLImageElement) => {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1e3a8a'; ctx.fillRect(0, 0, canvas.width, 240);
      
      if (logoImg) {
        ctx.drawImage(logoImg, 40, 40, 160, 160);
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Inter';
      ctx.fillText(settings.companyName, logoImg ? 220 : 50, 90);
      ctx.font = '20px Inter';
      ctx.fillText(`RIF: ${settings.companyRif}`, logoImg ? 220 : 50, 130);
      ctx.fillText(settings.companyPhone, logoImg ? 220 : 50, 165);
      
      ctx.fillStyle = '#facc15'; ctx.font = 'black 24px Inter'; ctx.textAlign = 'right';
      ctx.fillText('COMPROBANTE DE VENTA', 760, 200); ctx.textAlign = 'left';

      ctx.fillStyle = '#0f172a'; ctx.font = '900 32px Inter'; ctx.fillText(`${order.clientName.toUpperCase()}`, 50, 320);
      ctx.font = 'bold 20px Inter'; ctx.fillStyle = '#64748b';
      ctx.fillText(`ORDEN: #${order.orderNumber} | FECHA: ${new Date().toLocaleDateString()}`, 50, 360);
      
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(50, 400); ctx.lineTo(750, 400); ctx.stroke();
      
      let y = 490;
      order.items.forEach(item => {
        ctx.fillStyle = '#1e293b'; ctx.font = 'bold 22px Inter';
        ctx.fillText(`${item.quantity}x ${item.name}`, 50, y);
        ctx.textAlign = 'right'; ctx.fillText(`$${(item.price * item.quantity).toFixed(2)}`, 750, y);
        ctx.textAlign = 'left'; y += 60;
      });
      
      ctx.fillStyle = '#1e3a8a'; ctx.font = '900 50px Inter'; ctx.textAlign = 'right';
      ctx.fillText(`TOTAL: $${order.total.toFixed(2)}`, 750, 950);
      
      ctx.fillStyle = '#64748b'; ctx.font = 'bold 16px Inter'; ctx.textAlign = 'center';
      ctx.fillText('GRACIAS POR SU COMPRA - INVERSIONES ROXTOR C.A', canvas.width/2, 1050);

      const link = document.createElement('a');
      link.download = `Recibo_Roxtor_${order.orderNumber}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    };

    if (settings.companyLogo) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => renderCanvas(img);
      img.src = settings.companyLogo;
    } else renderCanvas();
  };

  const startPiloto = async () => {
    initAudio();
    setIsPilotoActive(true);
    setIsProcessing(true);

    try {
      // Corrected GoogleGenAI initialization
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Using sessionPromise pattern to ensure clean data streaming and no stale closures
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsProcessing(false);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const input = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(input.length);
              for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
              
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000'
              };

              // Solely relying on sessionPromise to send data
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Processing audio output
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              const ctx = liveOutContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
            }

            // Handling interruptions correctly
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of audioSourcesRef.current.values()) {
                source.stop();
                audioSourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live API Error:', e);
            setIsPilotoActive(false);
          },
          onclose: () => {
            console.log('Live API connection closed');
            setIsPilotoActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: `
            ERES EL PILOTO AUTOMÁTICO DE ${settings.companyName}.
            TU OBJETIVO ES CERRAR VENTAS POR WHATSAPP.
            
            SIEMPRE INICIA PREGUNTANDO: "Jefe, acaba de llegar un mensaje de WhatsApp, ¿quieres que me encargue de este cliente?".
            
            SI EL JEFE DICE QUE SÍ:
            1. Saluda cordialmente como vendedor de Roxtor.
            2. Ofrece productos del catálogo: ${products.map(p => `${p.name} ($${p.price})`).join(', ')}.
            3. Si el cliente quiere pagar, usa estos métodos: ${paymentMethods.map(pm => `${pm.name}: ${pm.details}`).join(', ')}.
            4. Al finalizar di: "Venta cerrada jefe, ya puede descargar el recibo con su logo".
          `
        }
      });
      
      sessionPromise.then(session => {
        sessionRef.current = session;
      });
    } catch (e) {
      console.error(e);
      setIsPilotoActive(false);
      setIsProcessing(false);
    }
  };

  const handleTestOrder = () => {
    const dummyOrder: Order = {
      id: Date.now().toString(),
      orderNumber: (orders.length + 101).toString(),
      clientName: "Comprador WhatsApp",
      items: [{ productId: '1', quantity: 2, price: 25, name: products[0]?.name || 'Producto Roxtor' }],
      total: 50,
      paidAmount: 50,
      paymentMethod: 'Pago Móvil',
      status: 'pendiente',
      workshopGroupId: '1',
      createdAt: new Date().toISOString(),
      deliveryDate: new Date().toISOString()
    };
    onOrderCreated(dummyOrder);
    setLastCreatedOrder(dummyOrder);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto h-full overflow-hidden">
      <div className={`relative overflow-hidden rounded-[40px] p-8 transition-all duration-700 ${isPilotoActive ? 'bg-blue-900 border-2 border-yellow-400 shadow-[0_0_50px_rgba(30,58,138,0.5)]' : 'bg-white border-2 border-slate-100'}`}>
        {isPilotoActive && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent,rgba(250,204,21,0.1),transparent)] animate-[spin_4s_linear_infinite]"></div>
          </div>
        )}
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center transition-all duration-500 ${isPilotoActive ? 'bg-yellow-400 text-blue-900 scale-110 shadow-2xl rotate-12' : 'bg-slate-100 text-slate-400'}`}>
              <Zap size={48} className={isPilotoActive ? 'fill-current animate-pulse' : ''} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className={`font-black text-3xl italic tracking-tighter mb-2 ${isPilotoActive ? 'text-white' : 'text-slate-900'}`}>
              PILOTO <span className={isPilotoActive ? 'text-yellow-400' : 'text-blue-900'}>ROXTOR</span>
            </h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isPilotoActive ? 'text-blue-200' : 'text-slate-400'}`}>
              {isPilotoActive ? 'RADAR DE VENTAS ACTIVO' : 'IA ASISTENTE EN REPOSO'}
            </p>
          </div>

          <button onClick={isPilotoActive ? stopPiloto : startPiloto} className={`w-full md:w-auto px-12 py-6 rounded-[28px] font-black text-xs uppercase tracking-widest transition-all active:scale-90 shadow-2xl ${isPilotoActive ? 'bg-red-600 text-white' : 'bg-blue-900 text-white'}`}>
            {isPilotoActive ? 'DETENER' : 'ACTIVAR'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => window.open('https://web.whatsapp.com', '_blank')} className="flex items-center justify-center gap-3 bg-emerald-600 text-white p-6 rounded-[32px] font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">
          <MessageCircle size={20}/> WhatsApp
        </button>
        <button onClick={handleTestOrder} className="flex items-center justify-center gap-3 bg-white border border-slate-100 p-6 rounded-[32px] font-black text-[10px] text-blue-900 uppercase shadow-sm active:scale-95 transition-all">
          <Zap size={20} className="text-yellow-400"/> Venta Test
        </button>
        <button disabled={!lastCreatedOrder} onClick={() => lastCreatedOrder && generateOrderReceipt(lastCreatedOrder)} className={`flex items-center justify-center gap-3 p-6 rounded-[32px] font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all ${lastCreatedOrder ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-300'}`}>
          <Download size={20}/> Bajar Recibo
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[40px] border border-slate-100 p-8 shadow-inner overflow-y-auto min-h-[200px]">
        {lastCreatedOrder ? (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[32px] flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white"><CheckCircle2 size={24}/></div>
              <div>
                <h4 className="font-black text-emerald-900 text-xs uppercase">Venta Registrada</h4>
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Orden #{lastCreatedOrder.orderNumber} para {lastCreatedOrder.clientName}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
            <Bot size={48} className="text-slate-300" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Esperando señal de WhatsApp...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
