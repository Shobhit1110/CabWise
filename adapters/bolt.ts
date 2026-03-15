import type { RideAdapter, LatLng, Quote } from '../types';

export class BoltAdapter implements RideAdapter {
  provider = 'bolt' as const;
  private baseUrl = 'https://node.bolt.eu/booking/v1';

  async fetchQuotes(origin: LatLng, dest: LatLng): Promise<Quote[]> {
    try {
      const res = await fetch(`${this.baseUrl}/price-estimates`, {
        method: 'POST',
        headers: {
          'Api-key': process.env.BOLT_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup: { lat: origin.lat, lng: origin.lng },
          destination: { lat: dest.lat, lng: dest.lng },
          currency: 'GBP',
        }),
      });

      if (!res.ok) throw new Error(`Bolt API ${res.status}`);
      const data = await res.json();
      const categories = data.categories || [];

      return categories.map((c: any) => this.normalise(c, origin, dest));
    } catch (e) {
      console.error('Bolt fetch error:', e);
      return [];
    }
  }

  private normalise(c: any, origin: LatLng, dest: LatLng): Quote {
    return {
      provider: 'bolt',
      productId: c.id,
      name: c.name,
      vehicleClass: this.mapClass(c.id),
      priceMin: (c.price?.min_amount || 0) / 100,
      priceMax: (c.price?.max_amount || 0) / 100,
      priceDisplay: `£${((c.price?.min_amount || 0) / 100).toFixed(0)}–${((c.price?.max_amount || 0) / 100).toFixed(0)}`,
      surgeMultiplier: c.surge?.multiplier ?? 1.0,
      etaSeconds: (c.eta || 0) * 60,
      currency: 'GBP',
      deepLinkUri: this.buildDeepLink(c.id, origin, dest),
      fetchedAt: Date.now(),
    };
  }

  buildDeepLink(productId: string, o: LatLng, d: LatLng) {
    return (
      `bolt://order?` +
      `pickup_lat=${o.lat}&pickup_lng=${o.lng}` +
      `&dest_lat=${d.lat}&dest_lng=${d.lng}&category=${productId}`
    );
  }

  private mapClass(id: string): Quote['vehicleClass'] {
    if (/exec|black/i.test(id)) return 'exec';
    if (/electric/i.test(id)) return 'electric';
    if (/pet|xl/i.test(id)) return 'premium';
    return 'standard';
  }

  async refreshToken(userId: string): Promise<void> {
    // OAuth2 refresh flow
  }
}
