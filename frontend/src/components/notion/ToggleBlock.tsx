"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export default function ToggleBlock({
  summary,
  children,
}: {
  summary: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-0.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-2 rounded py-0.5 text-left transition hover:bg-zinc-900/60"
        data-expanded={open ? "true" : "false"}
      >
        <span
          className={[
            "mt-0.5 flex-none text-zinc-500 transition-transform duration-150",
            open ? "rotate-90" : "rotate-0",
          ].join(" ")}
          aria-hidden="true"
        >
          ▶
        </span>
        <span className="flex-1">{summary}</span>
      </button>
      {open ? <div className="ml-5 mt-1">{children}</div> : null}
    </div>
  );
}
