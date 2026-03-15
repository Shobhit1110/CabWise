import { Linking, Platform } from 'react-native';
import type { Quote, LatLng } from '../types';

const STORE_FALLBACKS: Record<string, { ios: string; android: string }> = {
  uber: {
    ios: 'https://apps.apple.com/app/uber/id368677368',
    android: 'market://details?id=com.ubercab',
  },
  bolt: {
    ios: 'https://apps.apple.com/app/bolt/id675033630',
    android: 'market://details?id=ee.mtakso.client',
  },
  freenow: {
    ios: 'https://apps.apple.com/app/free-now/id357852748',
    android: 'market://details?id=taxi.android.client',
  },
  wheely: {
    ios: 'https://apps.apple.com/app/wheely/id558339908',
    android: 'market://details?id=com.wheely',
  },
};

export async function launchProviderApp(
  quote: Quote,
  origin: LatLng,
  dest: LatLng
) {
  const canOpen = await Linking.canOpenURL(quote.deepLinkUri);
  if (canOpen) {
    await Linking.openURL(quote.deepLinkUri);
  } else {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const fallbackUrl = STORE_FALLBACKS[quote.provider]?.[platform];
    if (fallbackUrl) {
      await Linking.openURL(fallbackUrl);
    }
  }
}
