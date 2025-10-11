import { cn } from "@/lib/primitive";
import type { HTMLAttributes } from "react";

type ProseProps = HTMLAttributes<HTMLElement> & {
  as?: "article";
  html: string;
};

export function Prose({ children, html, className }: ProseProps) {
  return (
    <article
      className={cn(
        "prose prose-h1:font-bold prose-h1:text-xl prose-a:text-blue-600 prose-p:text-justify prose-img:rounded-xl prose-headings:font-serif prose-headings:font-normal mx-auto",
        className
      )}
    >
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
      {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : children}
    </article>
  );
}
