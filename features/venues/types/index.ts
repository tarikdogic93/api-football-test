export type VenueType = {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  capacity: number | null;
  surface: string | null;
  image: string | null;
};

export type ExtendedVenueType = VenueType & {
  updatedAt: number;
  nameLower: string;
  queriedCity?: string;
  queriedCountry?: string;
  queriedSearch?: string[];
};

export type VenuesAPIResponse = {
  venues: VenueType[];
  total: number;
  offset: number;
};
