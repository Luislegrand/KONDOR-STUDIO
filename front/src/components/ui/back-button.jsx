import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/utils/classnames.js";

export default function BackButton({
  fallback = "/",
  label = "Voltar",
  className = "",
  labelClassName = "hidden sm:inline",
  size = "sm",
  variant = "outline",
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      leftIcon={ArrowLeft}
      onClick={handleBack}
      aria-label={label}
      className={cn("gap-2", className)}
    >
      <span className={labelClassName}>{label}</span>
    </Button>
  );
}
