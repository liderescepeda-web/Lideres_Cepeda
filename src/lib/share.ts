import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { env } from './env';
import { supabase } from './supabase';

export type Channel = 'whatsapp' | 'tiktok' | 'instagram' | 'x' | 'facebook' | 'general';

/** Construye el enlace de referido rastreable con UTMs. */
export function referralUrl(code: string, channel: Channel = 'general', path = ''): string {
  const base = env.siteUrl.replace(/\/$/, '');
  const params = new URLSearchParams({
    utm_source: channel,
    utm_medium: 'referral',
    utm_campaign: 'liderescepeda',
  });
  return `${base}/r/${code}${path}?${params.toString()}`;
}

/**
 * Comparte un mensaje + enlace por el canal nativo, registra la acción de
 * gamificación ('share') y devuelve si se compartió.
 */
export async function shareReferral(
  code: string,
  channel: Channel,
  message: string,
): Promise<{ shared: boolean }> {
  const url = referralUrl(code, channel);
  const fullMessage = `${message}\n\n${url}`;
  let shared = false;

  try {
    if (Platform.OS === 'web') {
      const nav = globalThis.navigator as Navigator & {
        share?: (data: { text?: string; url?: string }) => Promise<void>;
      };
      if (nav?.share) {
        await nav.share({ text: message, url });
        shared = true;
      } else {
        await Clipboard.setStringAsync(fullMessage);
        shared = true; // copiado al portapapeles
      }
    } else {
      const result = await Share.share({ message: fullMessage });
      shared = result.action === Share.sharedAction;
    }
  } catch {
    shared = false;
  }

  if (shared) {
    await supabase.rpc('record_action', { _action: 'share', _meta: { channel } as any });
  }
  return { shared };
}

export async function copyReferral(code: string): Promise<void> {
  await Clipboard.setStringAsync(referralUrl(code));
}

/** Mensajes sugeridos por canal (narrativa de esperanza + contraste). */
export const SHARE_MESSAGES: Record<Channel, string> = {
  whatsapp:
    '🇨🇴 El 21 de junio decidimos entre el miedo y la esperanza. Yo ya me uní a Líderes Cepeda. Únete tú también:',
  tiktok: '✊ La vida que ya cambió no se devuelve. Súmate al cambio 👇',
  instagram: '✊ Por una Colombia con esperanza, no con miedo. Súmate 👇',
  x: 'El cambio se defiende votando. Me uní a #LíderesCepeda 🇨🇴 Únete:',
  facebook:
    'El 21 de junio defendemos lo que ya cambió. Únete a Líderes Cepeda y movilicemos juntos:',
  general: '🇨🇴 Súmate a Líderes Cepeda. El cambio lo defendemos entre todos:',
};
