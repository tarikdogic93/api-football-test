import { TeamType } from "@/features/teams/types";
import Team from "@/features/teams/components/team";

type TeamsListProps = { teams: TeamType[] };

export default function TeamsList({ teams }: TeamsListProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {teams.map((team) => (
        <Team
          key={team.id}
          id={team.id}
          name={team.name}
          code={team.code}
          country={team.country}
          founded={team.founded}
          national={team.national}
          logo={team.logo}
        />
      ))}
    </div>
  );
}
