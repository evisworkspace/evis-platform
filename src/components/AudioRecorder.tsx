import React, { useState, useRef } from 'react';
import { Mic } from 'lucide-react';
import { geminiCall } from '../lib/api';
import { useAppContext } from '../AppContext';

interface AudioRecorderProps {
  onTranscricaoCompleta: (texto: string) => void;
  disabled?: boolean;
}

export default function AudioRecorder({ onTranscricaoCompleta, disabled }: AudioRecorderProps) {
  const { config, toast } = useAppContext();
  const [isRecording, setIsRecording] = useState(false);
  const [micLabel, setMicLabel] = useState('Toque para gravar');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const transcribeBlob = async (blob: Blob) => {
    if (!config.gemini) {
      setMicLabel('Configure a API Key');
      toast('Configure a API Key do Gemini nas configurações.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const b64 = (reader.result as string).split(',')[1];
      try {
        setMicLabel('Transcrevendo...');
        const res = await geminiCall([
          { text: 'Transcreva o áudio de registro de obra a seguir. Retorne apenas a transcrição limpa:' },
          { inline_data: { mime_type: 'audio/webm', data: b64 } }
        ], 0.1, 2048, config);
        
        onTranscricaoCompleta(res);
        setMicLabel('Toque para gravar');
      } catch (e) {
        setMicLabel('Erro na transcrição');
        toast('Erro na transcrição de áudio.', 'error');
      }
    };
    reader.readAsDataURL(blob);
  };

  const toggleRec = () => {
    if (disabled) return;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const mediaRec = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRec;
      chunksRef.current = [];
      
      mediaRec.ondataavailable = e => chunksRef.current.push(e.data);
      mediaRec.onstop = () => {
        setIsRecording(false);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        transcribeBlob(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };
      
      mediaRec.start();
      setIsRecording(true);
      setMicLabel('Gravando — toque para parar');
    }).catch(() => toast('Microfone indisponível.', 'error'));
  };

  return (
    <div className="flex flex-col items-center gap-2.5 mb-5">
      <button 
        onClick={toggleRec}
        disabled={disabled}
        aria-label={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
        className={`w-[68px] h-[68px] rounded-full flex items-center justify-center cursor-pointer transition-all border-2 ${
          isRecording 
            ? 'bg-brand-red/10 border-brand-red animate-pulse shadow-[0_0_0_8px_rgba(248,113,113,0.1)]' 
            : 'bg-s3 border-b2 hover:bg-s4 hover:border-b3 disabled:opacity-30'
        }`}
      >
        <Mic className={`w-[26px] h-[26px] ${isRecording ? 'text-brand-red' : 'text-t2'}`} strokeWidth={1.5} />
      </button>
      <span className={`font-mono text-[10px] tracking-[0.1em] transition-colors ${isRecording ? 'text-brand-red font-bold' : 'text-t3'}`}>
        {micLabel}
      </span>
    </div>
  );
}
