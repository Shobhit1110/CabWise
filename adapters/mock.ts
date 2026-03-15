import type { RideAdapter, LatLng, Quote, FareBreakdown, TrafficLevel } from '../types';

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickTraffic(): { level: TrafficLevel; delayMins: number } {
  const hour = new Date().getHours();
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return Math.random() < 0.6
      ? { level: 'heavy', delayMins: Math.round(rand(8, 20)) }
      : { level: 'moderate', delayMins: Math.round(rand(3, 8)) };
  }
  if (hour >= 10 && hour <= 16) {
    return Math.random() < 0.4
      ? { level: 'moderate', delayMins: Math.round(rand(2, 6)) }
      : { level: 'light', delayMins: Math.round(rand(0, 2)) };
  }
  return { level: 'light', delayMins: 0 };
}

interface VehicleTpl {
  provider: Quote['provider'];
  productId: string;
  name: string;
  vehicleClass: Quote['vehicleClass'];
  baseFare: number;
  perKm: number;
  perMin: number;
  fee: number;
  surgeRange: [number, number];
  etaRange: [number, number];
}

const VEHICLES: VehicleTpl[] = [
  // Uber
  { provider: 'uber', productId: 'uber-x', name: 'UberX', vehicleClass: 'standard', baseFare: 2.5, perKm: 1.25, perMin: 0.15, fee: 2.0, surgeRange: [1.0, 1.8], etaRange: [3, 8] },
  { provider: 'uber', productId: 'uber-comfort', name: 'Uber Comfort', vehicleClass: 'premium', baseFare: 3.5, perKm: 1.75, perMin: 0.2, fee: 2.5, surgeRange: [1.0, 1.5], etaRange: [5, 12] },
  { provider: 'uber', productId: 'uber-xl', name: 'UberXL', vehicleClass: 'premium', baseFare: 4.0, perKm: 2.0, perMin: 0.25, fee: 2.5, surgeRange: [1.0, 1.6], etaRange: [6, 15] },
  { provider: 'uber', productId: 'uber-green', name: 'Uber Green', vehicleClass: 'electric', baseFare: 3.0, perKm: 1.5, perMin: 0.18, fee: 2.0, surgeRange: [1.0, 1.4], etaRange: [5, 12] },
  { provider: 'uber', productId: 'uber-share', name: 'UberX Share', vehicleClass: 'shared', baseFare: 1.5, perKm: 0.9, perMin: 0.1, fee: 1.5, surgeRange: [1.0, 2.0], etaRange: [5, 15] },
  // Bolt
  { provider: 'bolt', productId: 'bolt-std', name: 'Bolt', vehicleClass: 'standard', baseFare: 2.0, perKm: 1.1, perMin: 0.12, fee: 1.5, surgeRange: [1.0, 1.6], etaRange: [3, 10] },
  { provider: 'bolt', productId: 'bolt-comfort', name: 'Bolt Comfort', vehicleClass: 'premium', baseFare: 3.0, perKm: 1.6, perMin: 0.18, fee: 2.0, surgeRange: [1.0, 1.4], etaRange: [5, 12] },
  { provider: 'bolt', productId: 'bolt-green', name: 'Bolt Green', vehicleClass: 'electric', baseFare: 2.5, perKm: 1.3, perMin: 0.15, fee: 1.5, surgeRange: [1.0, 1.3], etaRange: [6, 14] },
  { provider: 'bolt', productId: 'bolt-share', name: 'Bolt Share', vehicleClass: 'shared', baseFare: 1.2, perKm: 0.8, perMin: 0.08, fee: 1.0, surgeRange: [1.0, 1.8], etaRange: [5, 18] },
  // Free Now
  { provider: 'freenow', productId: 'fn-std', name: 'Free Now', vehicleClass: 'standard', baseFare: 2.8, perKm: 1.3, perMin: 0.14, fee: 1.8, surgeRange: [1.0, 2.0], etaRange: [4, 10] },
  { provider: 'freenow', productId: 'fn-premium', name: 'Free Now Premium', vehicleClass: 'premium', baseFare: 4.0, perKm: 1.9, perMin: 0.22, fee: 2.5, surgeRange: [1.0, 1.5], etaRange: [6, 14] },
  { provider: 'freenow', productId: 'fn-exec', name: 'Free Now Exec', vehicleClass: 'exec', baseFare: 6.0, perKm: 2.5, perMin: 0.3, fee: 3.0, surgeRange: [1.0, 1.3], etaRange: [8, 20] },
  // Wheely
  { provider: 'wheely', productId: 'wheely-biz', name: 'Wheely Business', vehicleClass: 'exec', baseFare: 8.0, perKm: 3.0, perMin: 0.35, fee: 5.0, surgeRange: [1.0, 1.2], etaRange: [8, 20] },
  { provider: 'wheely', productId: 'wheely-prem', name: 'Wheely Premium', vehicleClass: 'exec', baseFare: 12.0, perKm: 4.5, perMin: 0.5, fee: 8.0, surgeRange: [1.0, 1.1], etaRange: [10, 25] },
];

const DEEP_LINKS: Record<string, (pid: string, o: LatLng, d: LatLng) => string> = {
  uber: (pid, o, d) =>
    `uber://?action=setPickup&pickup[latitude]=${o.lat}&pickup[longitude]=${o.lng}&dropoff[latitude]=${d.lat}&dropoff[longitude]=${d.lng}&product_id=${pid}`,
  bolt: (pid, o, d) =>
    `bolt://order?pickup_lat=${o.lat}&pickup_lng=${o.lng}&dest_lat=${d.lat}&dest_lng=${d.lng}&category=${pid}`,
  freenow: (_pid, o, d) =>
    `freenow://ride?pickup_lat=${o.lat}&pickup_lng=${o.lng}&dest_lat=${d.lat}&dest_lng=${d.lng}`,
  wheely: (pid, o, d) =>
    `wheely://book?lat=${o.lat}&lng=${o.lng}&dest_lat=${d.lat}&dest_lng=${d.lng}&class=${pid}`,
};

export class MockAdapter implements RideAdapter {
  provider = 'mock' as const;

  async fetchQuotes(origin: LatLng, dest: LatLng): Promise<Quote[]> {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

    const distKm = Math.max(haversineKm(origin, dest), 1);
    const estMins = (distKm / 30) * 60;
    const traffic = pickTraffic();
    const hasTolls = distKm > 10;

    return VEHICLES.map((v) => {
      const surge = Math.round(rand(v.surgeRange[0], v.surgeRange[1]) * 10) / 10;
      const distCharge = v.perKm * distKm;
      const timeCharge = v.perMin * estMins;
      const surgePremium = (distCharge + timeCharge) * Math.max(0, surge - 1);
      const tolls = hasTolls ? Math.round(rand(1.5, 5) * 100) / 100 : 0;
      const total = v.baseFare + distCharge + timeCharge + surgePremium + tolls + v.fee;

      const priceMin = Math.round(total * 0.9 * 100) / 100;
      const priceMax = Math.round(total * 1.15 * 100) / 100;
      const etaMins = Math.round(rand(v.etaRange[0], v.etaRange[1]));

      const fareBreakdown: FareBreakdown = {
        baseFare: Math.round(v.baseFare * 100) / 100,
        distanceCharge: Math.round(distCharge * 100) / 100,
        timeCharge: Math.round(timeCharge * 100) / 100,
        surgePremium: Math.round(surgePremium * 100) / 100,
        tolls,
        bookingFee: v.fee,
        total: Math.round(total * 100) / 100,
      };

      const deepLinkFn = DEEP_LINKS[v.provider] ?? DEEP_LINKS.uber;

      return {
        provider: v.provider,
        productId: v.productId,
        name: v.name,
        vehicleClass: v.vehicleClass,
        priceMin,
        priceMax,
        priceDisplay: `£${priceMin.toFixed(0)}–${priceMax.toFixed(0)}`,
        surgeMultiplier: surge,
        etaSeconds: (etaMins + traffic.delayMins) * 60,
        currency: 'GBP' as const,
        deepLinkUri: deepLinkFn(v.productId, origin, dest),
        fetchedAt: Date.now(),
        fareBreakdown,
        trafficLevel: traffic.level,
        trafficDelayMins: traffic.delayMins,
      };
    });
  }

  buildDeepLink(productId: string, origin: LatLng, dest: LatLng): string {
    const provider = VEHICLES.find((v) => v.productId === productId)?.provider ?? 'uber';
    return (DEEP_LINKS[provider] ?? DEEP_LINKS.uber)(productId, origin, dest);
  }

  async refreshToken(): Promise<void> {}
}
