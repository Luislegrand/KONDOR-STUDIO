// ARQUIVO: front/src/components/ui/select.jsx

import React from "react";

/**
 * Implementação BEM SIMPLES do Select só pra resolver imports
 * e não quebrar o layout.
 *
 * Ela NÃO é um dropdown sofisticado igual o shadcn/ui,
 * mas já deixa o app rodando e os formulários funcionam “ok”.
 */

export function Select({ children, className = "", ...props }) {
  return (
    <div className={`inline-flex flex-col gap-1 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SelectTrigger({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={
        "flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }) {
  // Apenas mostra o placeholder (a lógica de valor selecionado está nos forms)
  return (
    <span className="text-gray-500">
      {placeholder || "Selecione..."}
    </span>
  );
}

export function SelectContent({ children, className = "", ...props }) {
  return (
    <div
      className={
        "mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg " +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectItem({ children, value, className = "", onClick, ...props }) {
  const handleClick = (e) => {
    if (onClick) onClick(e);
  };

  return (
    <div
      data-value={value}
      onClick={handleClick}
      className={
        "cursor-pointer rounded-sm px-2 py-1.5 text-sm text-gray-800 hover:bg-purple-50 " +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
}
