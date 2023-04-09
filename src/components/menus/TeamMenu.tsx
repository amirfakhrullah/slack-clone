import { Menu, MenuHandler, MenuList } from "@material-tailwind/react";
import cn from "~/utils/cn";
import { IoMdArrowDropdownCircle } from "react-icons/io";
import { useUser } from "@clerk/nextjs";
import React from "react";
import { type RouterOutputs } from "~/utils/api";
import { useRouter } from "next/router";

const TeamMenu: React.FC<{
  isLoading: boolean;
  teamId?: string;
  teams: RouterOutputs["team"]["getAll"] | undefined;
}> = ({ isLoading, teams, teamId }) => {
  const { user } = useUser();
  const router = useRouter();

  return (
    <Menu placement="bottom">
      <MenuHandler>
        <div className="flex w-auto flex-row flex-wrap items-center justify-between border-b border-gray-700 px-2 py-4">
          <p>
            {isLoading || !user
              ? "Loading..."
              : teamId
              ? teams?.find((t) => t.team.id.toString() === teamId)?.team
                  .name || user.username
              : user.username}
          </p>
          <IoMdArrowDropdownCircle />
        </div>
      </MenuHandler>
      <MenuList
        className={cn(
          "z-20 w-60 rounded-md border-none bg-gray-100 p-2 text-gray-800 shadow-md"
        )}
      >
        <div className="p-2" onClick={() => void router.push("/")}>
          <p>{!user ? "Loading..." : user.username}</p>
        </div>
        {isLoading && (
          <div className="p-2">
            <p>Loading...</p>
          </div>
        )}
        {!isLoading &&
          teams &&
          teams.map((val, idx) => (
            <div
              className="p-2"
              key={`${val.team.id}__${idx}`}
              onClick={() => void router.push(`/teams/${val.team.id}`)}
            >
              <p>{val.team.name}</p>
            </div>
          ))}
        <div className="p-2">
          <p>+ Add New Team</p>
        </div>
      </MenuList>
    </Menu>
  );
};

export default TeamMenu;
