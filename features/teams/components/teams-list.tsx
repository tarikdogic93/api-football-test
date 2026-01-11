import { TeamType } from "@/features/teams/types";
import Team from "@/features/teams/components/team";

type TeamsListPropsType = {
  teams: TeamType[];
  offset: number;
};

export default function TeamsList({ teams, offset }: TeamsListPropsType) {
  return (
    <ul className="divide-y rounded-xl border">
      {teams.map((team, localIndex) => {
        const isFirstInBatch = localIndex === 0;
        const isLastInBatch = localIndex === teams.length - 1;

        return (
          <li key={team.id}>
            <Team
              id={team.id}
              name={team.name}
              code={team.code}
              country={team.country}
              founded={team.founded}
              national={team.national}
              logo={team.logo}
              index={localIndex + offset}
              isFirstInBatch={isFirstInBatch}
              isLastInBatch={isLastInBatch}
            />
          </li>
        );
      })}
    </ul>
  );
}
