// src/components/ui/card.jsx
import React from "react";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={
        "rounded-2xl border border-gray-200 bg-white shadow-sm " + className
      }
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return (
    <div
      className={
        "flex flex-col gap-1.5 border-b border-gray-100 px-6 py-4 " + className
      }
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }) {
  return (
    <h3
      className={
        "text-lg font-semibold leading-none tracking-tight text-gray-900 " +
        className
      }
      {...props}
    />
  );
}

export function CardDescription({ className = "", ...props }) {
  return (
    <p
      className={
        "text-sm text-gray-500 leading-relaxed " +
        className
      }
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }) {
  return (
    <div className={"px-6 py-4 " + className} {...props} />
  );
}

export function CardFooter({ className = "", ...props }) {
  return (
    <div
      className={
        "flex items-center justify-between gap-2 border-t border-gray-100 px-6 py-4 " +
        className
      }
      {...props}
    />
  );
}

export default Card;
