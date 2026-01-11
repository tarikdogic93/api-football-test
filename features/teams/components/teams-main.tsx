import { TeamType } from "@/features/teams/types";
import TeamsSkeleton from "@/features/teams/components/teams-skeleton";
import TeamsList from "@/features/teams/components/teams-list";

type TeamsMainPropsType = {
  teams: TeamType[];
  loading: boolean;
  error: string;
  currentPage: number;
  pageSize: number;
  areQueriesEmpty?: boolean;
};

export default function TeamsMain({
  teams,
  loading,
  error,
  currentPage,
  pageSize,
  areQueriesEmpty = false,
}: TeamsMainPropsType) {
  const offset = (currentPage - 1) * pageSize;

  if (loading) {
    return <TeamsSkeleton pageSize={pageSize} />;
  }

  if (areQueriesEmpty) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">
          Please use the input fields above to search for teams
        </p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <p className="text-muted-foreground">
            No teams were found matching your search
          </p>
        )}
      </div>
    );
  }

  return <TeamsList teams={teams} offset={offset} />;
}
