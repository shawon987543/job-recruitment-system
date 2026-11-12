import type { CSSProperties } from "react";
interface SkeletonProps {
  variant?: "text" | "number" | "circle" | "rectangle";
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}

export default function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
  rounded = false,
}: SkeletonProps) {
  const defaultHeights = {
    text: 12,
    number: 32,
    circle: 40,
    rectangle: 100,
  };

  const style: CSSProperties = {
    width: width ?? (variant === "text" ? "100%" : undefined),
    height: height ?? defaultHeights[variant],
  };

  return (
    <div
      className={`skeleton skeleton-${variant} ${
        rounded ? "skeleton-rounded" : ""
      } ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
