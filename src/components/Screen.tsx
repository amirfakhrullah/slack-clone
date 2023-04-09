import React from "react";
import cn from "~/utils/cn";

const Screen: React.FC<{
  children: React.ReactNode;
  className: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn("min-h-screen min-w-full bg-neutral-900", className)}
    >
      {children}
    </div>
  );
};

export default Screen;
