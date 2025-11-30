import React, { createContext, useContext, useState } from "react";

const TabsContext = createContext(null);

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
  className = "",
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || "");

  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (next) => {
    if (onValueChange) {
      onValueChange(next);
    } else {
      setInternalValue(next);
    }
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = "" }) {
  return (
    <div
      className={
        "inline-flex items-center rounded-lg bg-gray-100 p-1 text-gray-500 " +
        className
      }
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = "" }) {
  const ctx = useContext(TabsContext);

  if (!ctx) {
    console.warn("TabsTrigger must be used inside <Tabs />");
    return null;
  }

  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      className={
        "px-3 py-1.5 text-sm font-medium rounded-md transition-colors " +
        (isActive
          ? "bg-white text-purple-600 shadow-sm"
          : "text-gray-500 hover:text-gray-800 hover:bg-gray-200") +
        " " +
        className
      }
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = "" }) {
  const ctx = useContext(TabsContext);

  if (!ctx) {
    console.warn("TabsContent must be used inside <Tabs />");
    return null;
  }

  if (ctx.value !== value) return null;

  return <div className={className}>{children}</div>;
}

export default Tabs;
