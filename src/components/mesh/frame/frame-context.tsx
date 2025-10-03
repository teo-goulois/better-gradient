"use client";

import { useContextWrapper } from "@/hooks/use-context-wrapper";
import { useMeshStore } from "@/store/store-mesh";
import type { FrameRect } from "@/types/types.mesh";
import {
  type PropsWithChildren,
  createContext,
  useMemo,
  useState,
} from "react";

type FrameContextProps = {
  frame: FrameRect | null;
  setFrame: React.Dispatch<React.SetStateAction<FrameRect | null>>;
  saveFrame: (frame: Partial<FrameRect>) => void;
};

const FrameContext = createContext<FrameContextProps | null>(null);

const FrameProvider = ({ children }: PropsWithChildren) => {
  const localFrame = useMeshStore((s) => s.frame);
  const setUiFrame = useMeshStore((s) => s.setUiFrame);

  const [frame, setFrame] = useState<FrameContextProps["frame"]>(
    localFrame ?? null
  );

  const value = useMemo(() => {
    const saveFrame = (frame: Partial<FrameRect>) => {
      setFrame((prev) => {
        if (
          !prev &&
          frame.width &&
          frame.height &&
          Number.isInteger(frame.x) &&
          Number.isInteger(frame.y)
        )
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            x: frame.x!,
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            y: frame.y!,
            width: frame.width,
            height: frame.height,
            aspectRatio: frame.aspectRatio,
          };
        if (!prev) return null;
        return { ...prev, ...frame };
      });
      setUiFrame(frame);
    };
    return { frame, setFrame, saveFrame };
  }, [frame]);

  return (
    <FrameContext.Provider value={value}>{children}</FrameContext.Provider>
  );
};

const useFrameContext = () => {
  const context = useContextWrapper(FrameContext, {
    contextName: useFrameContext.name,
    providerName: FrameProvider.name,
  });

  return context;
};

export { FrameContext, FrameProvider, useFrameContext };
