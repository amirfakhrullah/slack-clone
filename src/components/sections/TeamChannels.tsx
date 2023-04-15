import { useRouter } from "next/router";
import React from "react";
import useGetTeamChannels from "~/hooks/useGetTeamChannels";
import cn from "~/utils/cn";

const TeamChannels: React.FC<{
  teamId: string;
  channelId?: string;
}> = ({ teamId, channelId }) => {
  const router = useRouter();
  const { isLoading, channels } = useGetTeamChannels(teamId);

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
          {channels.map((channel) => (
              <div
                key={`teamChannel__${channel.id}`}
                className={cn(
                  "cursor-pointer rounded-sm px-1 py-2 text-sm duration-100 ease-in hover:bg-blue-900",
                  channel.id.toString() === channelId &&
                    "cursor-not-allowed bg-blue-900"
                )}
                onClick={() =>
                  channel.id.toString() !== channelId &&
                  void router.push(`/teams/${teamId}/channels/${channel.id}`)
                }
              >
                <p># {channel.name}</p>
              </div>
            ))}

          <div className="cursor-pointer rounded-sm px-1 py-2 text-sm">
            <p className="text-sm text-gray-500">+ Add New Channel</p>
          </div>
        </>
      )}
    </div>
  );
};

export default TeamChannels;
