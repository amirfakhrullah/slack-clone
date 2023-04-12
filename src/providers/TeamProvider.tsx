import React, { createContext, useContext, useState } from "react";
import { api, type RouterOutputs } from "~/utils/api";
import { useHandshakeContext } from "./HandshakeProvider";
import { toast } from "react-hot-toast";

interface TeamContextValues {
  isLoadingTeam: boolean;
  currentTeamId: string;
  setCurrentTeamId: React.Dispatch<React.SetStateAction<string>>;
  team?: RouterOutputs["team"]["getById"]["team"];
  members: RouterOutputs["team"]["getById"]["members"];

  isLoadingChannel: boolean;
  currentChannelId: string;
  setCurrentChannelId: React.Dispatch<React.SetStateAction<string>>;
  channel?: RouterOutputs["channel"]["getById"];
}

export const TeamContext = createContext<TeamContextValues>({
  isLoadingTeam: false,
  currentTeamId: "",
  setCurrentTeamId: () => null,
  team: undefined,
  members: [],

  isLoadingChannel: false,
  currentChannelId: "",
  setCurrentChannelId: () => null,
  channel: undefined,
});

export const useTeamContext = () => useContext(TeamContext);

const TeamProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoading: isHandshaking, key } = useHandshakeContext();

  const [currentTeamId, setCurrentTeamId] = useState("");
  const [currentChannelId, setCurrentChannelId] = useState("");

  const { isLoading: isFetchingTeamData, data: teamData } =
    api.team.getById.useQuery(
      {
        key,
        teamId: parseInt(currentTeamId),
      },
      {
        enabled: !isHandshaking && !!key && !!currentTeamId,
        onError: (err) => toast.error(err.message),
      }
    );

  const { isLoading: isFetchingChannel, data: channel } =
    api.channel.getById.useQuery(
      {
        key,
        teamId: parseInt(currentTeamId),
        channelId: parseInt(currentChannelId),
      },
      {
        enabled: !isHandshaking && !!key && !!currentTeamId && !!currentChannelId,
        onError: (err) => toast.error(err.message),
      }
    );

  return (
    <TeamContext.Provider
      value={{
        // teams
        isLoadingTeam: isHandshaking || isFetchingTeamData,
        currentTeamId,
        setCurrentTeamId,
        team: teamData?.team,
        members: teamData?.members ?? [],

        // channels
        isLoadingChannel: isHandshaking || isFetchingChannel,
        currentChannelId,
        setCurrentChannelId,
        channel,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export default TeamProvider;
