import { cn } from "@/lib/primitive";

type Props = {} & React.HTMLAttributes<HTMLSpanElement>;

export const SharedBetterGradientTypo = ({ className, ...props }: Props) => {
  return (
    <span
      className={cn(
        "text-nowrap font-semibold font-nohemi tracking-[10%] text-fg/90",
        className
      )}
      {...props}
    >
      Better Gradient
    </span>
  );
};
