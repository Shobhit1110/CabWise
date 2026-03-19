export type Provider = 'uber' | 'bolt' | 'freenow' | 'wheely' | 'mock';
export type VehicleClass = 'standard' | 'premium' | 'shared' | 'electric' | 'exec';
export type TrafficLevel = 'light' | 'moderate' | 'heavy';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  surgePremium: number;
  tolls: number;
  bookingFee: number;
  total: number;
}

export interface Quote {
  provider: Provider;
  productId: string;
  name: string;
  vehicleClass: VehicleClass;
  priceMin: number;
  priceMax: number;
  priceDisplay: string;
  surgeMultiplier: number;
  etaSeconds: number;
  currency: 'GBP';
  deepLinkUri: string;
  fetchedAt: number;
  fareBreakdown?: FareBreakdown;
  trafficLevel?: TrafficLevel;
  trafficDelayMins?: number;
}

export interface PickupPoint {
  id: string;
  name: string;
  location: LatLng;
  avgSavingGBP: number;
  avgWalkSecs: number;
  walkMinutes: number;
  distanceMetres: number;
  weeklyRides: number;
  rating: number;
  score: number;
}

export interface RideAdapter {
  provider: Provider;
  fetchQuotes(origin: LatLng, dest: LatLng): Promise<Quote[]>;
  buildDeepLink(productId: string, origin: LatLng, dest: LatLng): string;
  refreshToken?(userId: string): Promise<void>;
}
