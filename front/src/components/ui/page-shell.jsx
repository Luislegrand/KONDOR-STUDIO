import React from "react";
import { cn } from "@/utils/classnames.js";

export function PageShell({ className = "", children }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mx-auto w-full max-w-[1280px] px-6 py-8">
        {children}
      </div>
    </div>
  );
}

export default PageShell;
