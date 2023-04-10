import { AiFillWechat } from "react-icons/ai";

const InitialScreen: React.FC<{
  children?: string | string[];
}> = ({ children }) => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <AiFillWechat size={70} />
      <p>
        {children ||
          "Start your conversation by selecting a team channel or a user that you want to converse with!"}
      </p>
    </div>
  );
};

export default InitialScreen;
