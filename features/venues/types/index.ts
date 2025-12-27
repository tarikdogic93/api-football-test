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

export type VenuesAPIResponse = {
  venues: VenueType[];
  total: number;
  offset: number;
};
