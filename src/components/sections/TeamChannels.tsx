import { useRouter } from "next/router";
import React from "react";
import { useSessionContext } from "~/providers/SessionProvider";
import { api } from "~/utils/api";

const TeamChannels: React.FC<{
  teamId: string;
}> = ({ teamId }) => {
  const router = useRouter();
  const { isLoading: isTokenFetching, sessionId, token } = useSessionContext();
  const { isLoading, data: channels } = api.channel.getAll.useQuery(
    {
      sessionId,
      token,
      teamId: parseInt(teamId),
    },
    {
      enabled: !isTokenFetching && !!token,
    }
  );

  return (
    <div className="m-2 mt-4 rounded-md border border-gray-700 p-2">
      <div className="pb-2">
        <p>Team Channels:</p>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          {(!channels || channels.length === 0) && (
            <div className="py-4">
              <p className="text-sm text-gray-500">No channel created.</p>
            </div>
          )}
          {channels &&
            channels.map((channel) => (
              <div
                key={`teamChannel__${channel.id}`}
                className="cursor-pointer rounded-sm px-1 py-2 text-sm duration-100 ease-in hover:bg-blue-900"
                onClick={() => void router.push(`/${teamId}/${channel.id}`)}
              >
                <p># {channel.name}</p>
              </div>
            ))}
        </>
      )}
    </div>
  );
};

export default TeamChannels;
