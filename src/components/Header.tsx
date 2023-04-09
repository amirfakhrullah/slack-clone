import { UserButton } from "@clerk/nextjs";
import React from "react";

const Header: React.FC<{
  chatterName?: string;
}> = ({ chatterName }) => {
  return (
    <div className="fixed right-0 top-0 z-10 h-[57px] w-full border-b border-gray-600">
      <div className="h-full w-full pl-64">
        <div className="pl-4 flex h-full w-full flex-row items-center justify-between">
          <p>{chatterName}</p>
          <div className="mr-4">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
