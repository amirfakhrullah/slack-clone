import React, { useState } from "react";
import { toast } from "react-hot-toast";
import useGetMySessionToken from "~/hooks/useGetMySessionToken";
import { type RouterOutputs, api } from "~/utils/api";

const TeamChat: React.FC<{
  teamId: string;
  channelId: string;
}> = ({ teamId, channelId }) => {
  const [recentChats, setRecentChats] = useState<
    RouterOutputs["chat"]["getForChannel"]
  >([]);
  const [chatInput, setChatInput] = useState("");

  const {
    isLoading: isFetchingToken,
    sessionId,
    token,
  } = useGetMySessionToken();

  const { isLoading } = api.chat.getForChannel.useQuery(
    {
      sessionId,
      token,
      teamId: parseInt(teamId),
      channelId: parseInt(channelId),
    },
    {
      enabled: !isFetchingToken && !!token,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      onSuccess: (data) => setRecentChats(data),
    }
  );

  api.chat.onAddToChannel.useSubscription(
    {
      sessionId,
      token,
      teamId: parseInt(teamId),
      channelId: parseInt(channelId),
    },
    {
      enabled: !isFetchingToken && !!token,
      onData: (data) => setRecentChats((chats) => [...chats, data]),
    }
  );

  const { mutate } = api.chat.sendToChannel.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    mutate({
      token,
      sessionId,
      teamId: parseInt(teamId),
      channelId: parseInt(channelId),
      message: chatInput,
    });
    setChatInput("");
  };

  return (
    <div className="flex h-screen w-full flex-col pt-[57px]">
      {isLoading || isFetchingToken ? (
        <div>Loading...</div>
      ) : (
        <p>{JSON.stringify(recentChats)}</p>
      )}
      <div className="fixed bottom-0 right-0 z-10 h-[57px] w-full border-t border-gray-600">
        <div className="h-full w-full pl-64">
          <input
            onChange={(e) => setChatInput(e.target.value)}
            value={chatInput}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
      </div>
    </div>
  );
};

export default TeamChat;
