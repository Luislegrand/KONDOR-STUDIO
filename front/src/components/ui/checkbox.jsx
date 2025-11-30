// ARQUIVO: front/src/components/ui/checkbox.jsx

import React from "react";

export function Checkbox({
  className = "",
  checked,
  onCheckedChange,
  ...props
}) {
  const handleChange = (event) => {
    if (onCheckedChange) {
      onCheckedChange(event.target.checked);
    }

    if (props.onChange) {
      props.onChange(event);
    }
  };

  return (
    <input
      type="checkbox"
      className={
        "h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 " +
        className
      }
      checked={checked}
      onChange={handleChange}
      {...props}
    />
  );
}

export default Checkbox;
