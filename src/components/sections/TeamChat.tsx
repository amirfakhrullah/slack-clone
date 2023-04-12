import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { type RouterOutputs, api } from "~/utils/api";
import ChatBody from "../ChatBody";
import InitialScreen from "../InitialScreen";
import { useHandshakeContext } from "~/providers/HandshakeProvider";

const TeamChat: React.FC<{
  teamId: string;
  channelId: string;
}> = ({ teamId, channelId }) => {
  const [recentChats, setRecentChats] = useState<
    RouterOutputs["chat"]["getForChannel"]
  >([]);
  const [chatInput, setChatInput] = useState("");

  const { isLoading: isHandshaking, key } = useHandshakeContext();

  const { isLoading } = api.chat.getForChannel.useQuery(
    {
      key,
      teamId: parseInt(teamId),
      channelId: parseInt(channelId),
    },
    {
      enabled: !isHandshaking && !!key,
      onSuccess: (data) => setRecentChats(data),
    }
  );

  api.chat.onAddToChannel.useSubscription(
    {
      key,
      teamId: parseInt(teamId),
      channelId: parseInt(channelId),
    },
    {
      enabled: !isHandshaking && !!key,
      onData: (data) => setRecentChats((chats) => [...chats, data]),
    }
  );

  const { mutate } = api.chat.sendToChannel.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    mutate({
      key,
      teamId: parseInt(teamId),
      channelId: parseInt(channelId),
      message: chatInput,
    });
    setChatInput("");
  };

  return (
    <div className="flex h-screen w-full flex-col pt-[57px]">
      {isLoading || isHandshaking ? (
        <InitialScreen>Loading...</InitialScreen>
      ) : (
        <ChatBody recentChats={recentChats} />
      )}
      <div className="fixed bottom-0 right-0 z-10 h-[57px] w-full border-t border-gray-600">
        <div className="flex h-full w-full  items-center justify-center pl-64">
          <input
            onChange={(e) => setChatInput(e.target.value)}
            value={chatInput}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="p2 m-2 w-[98%] border border-gray-600 bg-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default TeamChat;
