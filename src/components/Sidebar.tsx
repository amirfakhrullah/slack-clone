import useGetMyTeams from "~/hooks/useGetMyTeams";
import TeamMenu from "./menus/TeamMenu";
import TeamChannels from "./sections/TeamChannels";

const Sidebar: React.FC<{
  teamId?: string;
  channelId?: string;
}> = ({ teamId, channelId }) => {
  const { isLoading, myTeams } = useGetMyTeams(teamId, channelId);
  return (
    <div className="h-screen w-80">
      <div className="fixed left-0 top-0 z-20 h-screen w-64 bg-blue-950">
        <TeamMenu isLoading={isLoading} teams={myTeams} teamId={teamId} />
        {teamId && <TeamChannels teamId={teamId} channelId={channelId} />}
      </div>
    </div>
  );
};

export default Sidebar;
