import type { RideAdapter, LatLng, Quote } from '../types';

export class UberAdapter implements RideAdapter {
  provider = 'uber' as const;
  private baseUrl = 'https://api.uber.com/v1.2';

  async fetchQuotes(origin: LatLng, dest: LatLng): Promise<Quote[]> {
    const url =
      `${this.baseUrl}/estimates/price?` +
      `start_latitude=${origin.lat}&start_longitude=${origin.lng}` +
      `&end_latitude=${dest.lat}&end_longitude=${dest.lng}`;

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.UBER_CLIENT_ID}`,
        },
      });
      if (!res.ok) throw new Error(`Uber API ${res.status}`);

      const data = await res.json();
      const prices = data.prices || [];

      return prices.map((p: any) => this.normalise(p, origin, dest));
    } catch (e) {
      console.error('Uber fetch error:', e);
      return [];
    }
  }

  private normalise(p: any, origin: LatLng, dest: LatLng): Quote {
    return {
      provider: 'uber',
      productId: p.product_id,
      name: p.display_name,
      vehicleClass: this.mapClass(p.display_name),
      priceMin: p.low_estimate ?? p.estimate,
      priceMax: p.high_estimate ?? p.estimate,
      priceDisplay: `£${p.estimate}`,
      surgeMultiplier: p.surge_multiplier ?? 1.0,
      etaSeconds: p.duration,
      currency: 'GBP',
      deepLinkUri: this.buildDeepLink(p.product_id, origin, dest),
      fetchedAt: Date.now(),
    };
  }

  buildDeepLink(productId: string, o: LatLng, d: LatLng) {
    return (
      `uber://?action=setPickup` +
      `&pickup[latitude]=${o.lat}&pickup[longitude]=${o.lng}` +
      `&dropoff[latitude]=${d.lat}&dropoff[longitude]=${d.lng}` +
      `&product_id=${productId}`
    );
  }

  private mapClass(name: string): Quote['vehicleClass'] {
    if (/exec|black/i.test(name)) return 'exec';
    if (/green|electric/i.test(name)) return 'electric';
    if (/pool|share/i.test(name)) return 'shared';
    if (/xl|comfort/i.test(name)) return 'premium';
    return 'standard';
  }

  async refreshToken(userId: string): Promise<void> {
    // OAuth2 refresh flow
  }
}
