import { type NextPage } from "next";
import Header from "~/components/Header";
import InitialScreen from "~/components/InitialScreen";
import MetaHead from "~/components/MetaHead";
import Screen from "~/components/Screen";
import Sidebar from "~/components/Sidebar";

const Home: NextPage = () => {
  return (
    <>
      <MetaHead>Dashboard | Slack Clone</MetaHead>
      <Screen className="flex flex-row">
        <Header />
        <Sidebar />
        <InitialScreen />
      </Screen>
    </>
  );
};

export default Home;
