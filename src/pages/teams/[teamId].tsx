import React from "react";
import MetaHead from "~/components/MetaHead";
import Screen from "~/components/Screen";
import Sidebar from "~/components/Sidebar";

const TeamIdPage = () => {
  return (
    <>
      <MetaHead>Dashboard | Slack Clone</MetaHead>
      <Screen className="flex flex-row">
        <Sidebar />
      </Screen>
    </>
  );
};

export default TeamIdPage;
