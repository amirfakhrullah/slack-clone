import useCurrentTabs from "~/hooks/useCurrentTabs";
import TeamMenu from "./menus/TeamMenu";
import TeamChannels from "./sections/TeamChannels";

const Sidebar = () => {
  const { isLoading, myTeams, teamId } = useCurrentTabs();
  return (
    <div className="fixed left-0 top-0 z-20 h-screen w-64 bg-blue-950">
      <TeamMenu isLoading={isLoading} teams={myTeams} teamId={teamId} />
      {teamId && <TeamChannels teamId={teamId} />}
    </div>
  );
};

export default Sidebar;
