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

export type VenuesSkeletonProps = {
  pageSize: number;
};

export type VenuesListProps = {
  venues: VenueType[];
};

export type VenueProps = VenueType;

export type GetVenuesParams = {
  pageSize: number;
  offset: number;
  idQuery?: string;
  nameQuery?: string;
  cityQuery?: string;
  countryQuery?: string;
  searchQuery?: string;
};

export type VenuesAPIResponse = {
  venues: VenueType[];
  total: number;
  offset: number;
};
