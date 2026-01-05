export type TeamType = {
  id: number;
  name: string;
  code: string | null;
  country: string | null;
  founded: number | null;
  national: boolean;
  logo: string | null;
};

export type TeamsAPIResponse = {
  teams: TeamType[];
  total: number;
  offset: number;
};
