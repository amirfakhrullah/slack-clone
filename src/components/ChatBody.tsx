import { useUser } from "@clerk/nextjs";
import React from "react";
import { type RouterOutputs } from "~/utils/api";
import InitialScreen from "./InitialScreen";
import Image from "next/image";
import { useTeamContext } from "~/providers/TeamProvider";

const ChatBody: React.FC<{
  recentChats: RouterOutputs["chat"]["getForChannel"];
}> = ({ recentChats }) => {
  const { user } = useUser();
  const { isLoadingTeam, members } = useTeamContext();

  const isMyMessage = (chat: RouterOutputs["chat"]["getForChannel"][number]) =>
    user ? chat.authorId === user.id : false;

  const whosMessage = (chat: RouterOutputs["chat"]["getForChannel"][number]) =>
    members.find((member) => member.userId === chat.authorId);

  if (isLoadingTeam) return null;

  if (recentChats.length === 0)
    return <InitialScreen>Start Chatting!</InitialScreen>;

  return (
    <div className="mb-[57px] h-full overflow-y-auto">
      <div className="flex flex-col items-stretch justify-end p-2">
        {recentChats.map((chat) =>
          user && isMyMessage(chat) ? (
            <div
              key={chat.id}
              className="flex flex-row items-center justify-end"
            >
              <div className="flex flex-row items-center">
                <div className="m-2 rounded-md bg-blue-950 px-3 py-2">
                  {chat.message}
                </div>
                <Image
                  src={user.profileImageUrl}
                  alt={user.username || user.id}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              </div>
            </div>
          ) : (
            <div
              key={chat.id}
              className="flex flex-row items-center justify-start"
            >
              <div className="flex flex-row items-center">
                <Image
                  src={whosMessage(chat)?.clerkInfo.profileImageUrl || ""}
                  alt={
                    whosMessage(chat)?.clerkInfo.username ||
                    whosMessage(chat)?.clerkInfo.id ||
                    ""
                  }
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <div className="m-2 rounded-md bg-gray-600 px-3 py-2">
                  {chat.message}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ChatBody;
