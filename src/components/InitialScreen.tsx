import { AiFillWechat } from "react-icons/ai";

const InitialScreen = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <AiFillWechat size={70} />
      <p>
        Start your conversation by selecting a team channel or a user that you
        want to converse with!
      </p>
    </div>
  );
};

export default InitialScreen;
