"use client";

import React from "react";

type SkeletonProps = {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  lines?: number;
};

export function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-[rgba(212,164,79,0.08)]";

  const variantClasses = {
    text: "rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-2xl",
  };

  const style: React.CSSProperties = {
    width: width ?? "100%",
    height: height ?? (variant === "text" ? "1rem" : variant === "circular" ? "2.5rem" : "10rem"),
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={`grid gap-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses[variant]}`}
            style={{
              ...style,
              width: i === lines - 1 ? "70%" : "100%",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-[28px] border border-[rgba(36,27,19,0.08)] bg-white/70 overflow-hidden">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Skeleton variant="rounded" className="min-h-56 !rounded-none" />
        <div className="grid gap-5 p-6 md:p-7">
          <Skeleton variant="text" width="30%" height="0.75rem" />
          <Skeleton variant="text" width="60%" height="2rem" />
          <Skeleton variant="text" lines={2} />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton variant="rounded" height="3rem" />
            <Skeleton variant="rounded" height="3rem" />
            <Skeleton variant="rounded" height="3rem" />
          </div>
          <div className="flex gap-2">
            <Skeleton variant="rounded" width="5rem" height="2rem" />
            <Skeleton variant="rounded" width="5rem" height="2rem" />
            <Skeleton variant="rounded" width="5rem" height="2rem" />
          </div>
          <Skeleton variant="rounded" width="10rem" height="2.5rem" />
        </div>
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="public-hero-search">
      <div className="public-hero-search-content">
        <div className="mx-auto max-w-2xl grid gap-4">
          <Skeleton variant="text" height="3rem" className="mx-auto w-3/4" />
          <Skeleton variant="text" lines={2} className="mx-auto max-w-lg" />
          <Skeleton variant="rounded" height="3.5rem" className="mx-auto w-full max-w-xl" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[rgba(36,27,19,0.08)] bg-white/60 p-4">
      <Skeleton variant="text" width="40%" height="0.65rem" />
      <Skeleton variant="text" width="30%" height="2rem" className="mt-2" />
      <Skeleton variant="text" width="50%" height="0.75rem" className="mt-1" />
    </div>
  );
}

export function ModuleCardSkeleton() {
  return (
    <div className="rounded-[28px] border border-[rgba(36,27,19,0.08)] bg-white/60 p-6">
      <Skeleton variant="text" width="50%" height="1.5rem" />
      <Skeleton variant="text" lines={2} className="mt-3" />
      <div className="mt-4 flex gap-2">
        <Skeleton variant="rounded" width="4rem" height="1.5rem" />
        <Skeleton variant="rounded" width="4rem" height="1.5rem" />
        <Skeleton variant="rounded" width="4rem" height="1.5rem" />
      </div>
    </div>
  );
}
