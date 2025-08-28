"use client";

export const Logo = () => {
  return (
    <div className="flex items-center gap-1">
      {/*  <img
        src="/logo.png"
        alt="better-gradient"
        className="size-5"
        width={24}
        height={24}
      /> */}
      <div className="flex gap-1 items-center">
        <div className="flex flex-col h-7">
          <p className="text-xl text-nowrap font-bold font-nohemi tracking-[10%] text-fg/90">
            Better Gradient
          </p>
        </div>
        <span className="text-sm text-fg/50">(beta)</span>
      </div>
    </div>
  );
};
