import { Share, Platform } from 'react-native';
import type { Quote } from '../types';

export async function shareComparison(
  quotes: Quote[],
  originLabel: string,
  destLabel: string,
) {
  if (quotes.length === 0) return;

  const lines = [
    `🚕 CabWise — ${originLabel} → ${destLabel}`,
    '',
    ...quotes.slice(0, 6).map((q, i) => {
      const eta = Math.round(q.etaSeconds / 60);
      const surge = q.surgeMultiplier > 1 ? ` ⚡${q.surgeMultiplier}x` : '';
      const best = i === 0 ? ' ← Best' : '';
      return `${q.name} (${q.vehicleClass}): ${q.priceDisplay} · ${eta}min${surge}${best}`;
    }),
    '',
    `Compared ${quotes.length} rides with CabWise`,
  ];

  const message = lines.join('\n');

  await Share.share(
    Platform.OS === 'ios'
      ? { message }
      : { message, title: 'CabWise Ride Comparison' },
  );
}
