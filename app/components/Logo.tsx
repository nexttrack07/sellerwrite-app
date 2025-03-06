import clsx from "clsx";

type Props = {
  size?: "sm" | "md" | "lg";
};

export const Logo: React.FC<Props> = ({ size = "sm" }) => {
  return (
    <div
      className={clsx(
        "flex tracking-wider group cursor-inherit rounded-sm border border-gray-800",
        {
          "p-1 text-sm font-semibold": size === "sm",
          "p-2 text-lg font-bold": size === "md",
          "p-4 text-2xl font-extrabold": size === "lg",
        }
      )}
    >
      <div
        className={clsx(
          "transition-all ease-in delay-75 duration-500 rounded-xs bg-gray-800 text-gray-50 group-hover:text-gray-800 group-hover:bg-gray-50",
          {
            "p-1": size === "sm",
            "p-2": size === "md",
            "p-4": size === "lg",
          }
        )}
      >
        SELLER
      </div>
      <div
        className={clsx(
          "transition-all ease-in delay-75 duration-500 rounded-xs group-hover:bg-gray-800 group-hover:text-gray-50",
          {
            "p-1": size === "sm",
            "p-2": size === "md",
            "p-4": size === "lg",
          }
        )}
      >
        WRITE
      </div>
    </div>
  );
};
