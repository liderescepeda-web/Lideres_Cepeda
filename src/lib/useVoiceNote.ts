import { useRef, useState } from 'react';
import { Platform } from 'react-native';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { transcribeVoice } from './ai';

/** Lee un Blob a base64 (sin el prefijo data:). Solo web. */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/**
 * Hook de "nota de voz": graba audio (web + iOS + Android con expo-audio) y lo
 * transcribe con la Edge Function `transcribe` (Gemini). Devuelve el texto vía `onText`.
 */
export function useVoiceNote(onText: (t: string) => void, onError: (m: string) => void) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const busy = useRef(false);

  async function start() {
    if (recording || transcribing || busy.current) return;
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) { onError('Necesito permiso para usar el micrófono.'); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch {
      onError('No pude iniciar la grabación. Revisa los permisos del micrófono.');
    }
  }

  async function stop() {
    if (!recording) return;
    busy.current = true;
    setRecording(false);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) { onError('No se grabó audio.'); return; }
      setTranscribing(true);
      let base64: string;
      let mime: string;
      if (Platform.OS === 'web') {
        const res = await fetch(uri);
        const blob = await res.blob();
        base64 = await blobToBase64(blob);
        mime = blob.type || 'audio/webm';
      } else {
        base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
        mime = 'audio/mp4'; // preset HIGH_QUALITY → .m4a (AAC en contenedor MP4)
      }
      const text = await transcribeVoice(base64, mime);
      if (!text.trim()) onError('No pude entender el audio. Intenta de nuevo, más cerca del micrófono.');
      else onText(text.trim());
    } catch {
      onError('No pude procesar el audio. Intenta de nuevo.');
    } finally {
      setTranscribing(false);
      busy.current = false;
    }
  }

  return { recording, transcribing, start, stop };
}
