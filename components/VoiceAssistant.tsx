
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Product, VoiceName, AppSettings } from '../types';
import { Mic, MicOff, Settings, Volume2, AlertCircle, Info, Sparkles } from 'lucide-react';

interface Props {
  products: Product[];
  settings: AppSettings;
}

const VoiceAssistant: React.FC<Props> = ({ products, settings }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.ZEPHYR);
  const [transcriptions, setTranscriptions] = useState<{ user: string; ai: string }[]>([]);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
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
  };

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encodeBase64 = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const startSession = async () => {
    if (isActive) return;
    setIsConnecting(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = { input: inputCtx, output: outputCtx };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const catalogInfo = products.map(p => 
        `- ${p.name}: Detal: $${p.priceRetail}, Mayor: $${p.priceWholesale}, Material: ${p.material}`
      ).join('\n');

      const systemInstruction = `
        Eres Vozify, el asistente de voz de ${settings.businessName}.
        Tu misión es simular notas de voz de WhatsApp para responder a clientes con eficiencia.
        TONO: ${settings.preferredTone.toUpperCase()}.
        
        REGLAS DE ORO QUE DEBES RECORDAR AL CLIENTE:
        1. TODO TRABAJO REQUIERE DEL 50% MINIMO DEL PAGO PARA PODER SER PROCESADO.
        2. DESPUES QUE EL DISEÑO ESTE APROBADO POR EL CLIENTE, NO SE REALIZAN CAMBIOS.
        3. REVISE SU PEDIDO ANTES DE RETIRAR.
        4. NO SE HACEN DEVOLUCIONES DE DINERO, SIN EXCEPCION.

        Catálogo:
        ${catalogInfo}
        
        Sé breve, natural y eficiente. Si das un presupuesto, recuerda siempre amablemente la regla del 50% de abono.
      `;

      let currentInput = '';
      let currentOutput = '';

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encodeBase64(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) currentInput += message.serverContent.inputTranscription.text;
            if (message.serverContent?.outputTranscription) currentOutput += message.serverContent.outputTranscription.text;
            if (message.serverContent?.turnComplete) {
              setTranscriptions(prev => [...prev.slice(-4), { user: currentInput, ai: currentOutput }]);
              currentInput = ''; currentOutput = '';
            }
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const { output: outCtx } = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              const buffer = await decodeAudioData(decodeBase64(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => { setError("Error de conexión AI."); stopSession(); },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
          systemInstruction,
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setError(err.message || "Error al iniciar.");
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
    nextStartTimeRef.current = 0;
  };

  const toggleSession = () => isActive ? stopSession() : startSession();

  return (
    <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto py-10">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black text-[#000814] uppercase italic tracking-tighter">Vozify Assistant</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-blue-500" /> Tono de voz configurado: <span className="text-[#004ea1]">{settings.preferredTone}</span>
        </p>
      </div>

      <div className="relative w-72 h-72 flex items-center justify-center">
        {isActive && <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-10"></div>}
        <button
          onClick={toggleSession}
          disabled={isConnecting}
          className={`relative z-10 w-56 h-56 rounded-[4rem] flex flex-col items-center justify-center gap-4 transition-all shadow-2xl border-8 ${
            isActive ? 'bg-[#000814] border-blue-500 text-white' : 'bg-white border-slate-50 text-[#000814] hover:border-blue-100'
          } ${isConnecting ? 'opacity-50' : ''}`}
        >
          {isActive ? <MicOff size={60} className="text-blue-400" /> : <Mic size={60} className="text-slate-200" />}
          <span className="font-black text-xs uppercase tracking-[0.2em] italic">
            {isConnecting ? 'Enlazando...' : isActive ? 'Finalizar' : 'Hablar'}
          </span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="w-full space-y-4">
        {transcriptions.map((t, i) => (
          <div key={i} className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-end italic">
              <p className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-tr-none text-xs font-bold shadow-lg">"{t.user}"</p>
            </div>
            <div className="flex justify-start">
              <div className="bg-white border-2 border-slate-50 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                <Volume2 size={16} className="text-blue-500" />
                <p className="text-xs font-black text-slate-800 uppercase italic">"{t.ai}"</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceAssistant;
