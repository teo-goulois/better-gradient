"use client";

type Props = {};

export const Logo = ({}: Props) => {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/logo.png"
        alt="better-gradient"
        className="size-6"
        width={24}
        height={24}
      />
      <div className="flex flex-col h-7">
        <p className="text-2xl font-bold font-nohemi tracking-[10%] text-fg/90">
          Better Gradient
        </p>
      </div>
    </div>
  );
};
