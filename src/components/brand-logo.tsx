import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  showDescriptor?: boolean;
};

const markSizes = {
  sm: "h-10 w-8",
  md: "h-12 w-10",
  lg: "h-16 w-12",
};

const wordmarkSizes = {
  sm: "text-lg tracking-[0.26em]",
  md: "text-xl tracking-[0.3em]",
  lg: "text-[1.9rem] tracking-[0.34em] md:text-[2.2rem]",
};

const descriptorSizes = {
  sm: "text-[0.58rem] tracking-[0.42em]",
  md: "text-[0.64rem] tracking-[0.46em]",
  lg: "text-[0.7rem] tracking-[0.5em]",
};

export function BrandLogo({
  className,
  size = "md",
  showDescriptor = true,
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 70 86"
        aria-hidden="true"
        className={cn("shrink-0 drop-shadow-[0_10px_26px_rgba(242,193,107,0.22)]", markSizes[size])}
      >
        <defs>
          <linearGradient id="veyra-gold-primary" x1="7" x2="60" y1="10" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f7dda3" />
            <stop offset="0.46" stopColor="#e0ac58" />
            <stop offset="1" stopColor="#8f5b1f" />
          </linearGradient>
          <linearGradient id="veyra-gold-secondary" x1="24" x2="46" y1="10" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff2cb" stopOpacity="0.95" />
            <stop offset="1" stopColor="#c88d3b" stopOpacity="0.84" />
          </linearGradient>
        </defs>

        <path
          d="M8 9h15.5L35 48.5 46.7 9H62L39.3 77H29.6L8 9Z"
          fill="url(#veyra-gold-primary)"
        />
        <path
          d="M25.3 9h9L45 41.8l3.6-12.4h8.7L44.9 68.8h-7.3L25.3 9Z"
          fill="url(#veyra-gold-secondary)"
          opacity="0.94"
        />
        <path
          d="M14.5 77.5c5.5-4.4 11.9-6.7 19.1-6.7 7.8 0 14.9 2.6 21.3 7.8"
          fill="none"
          opacity="0.72"
          stroke="#bb7d31"
          strokeLinecap="round"
          strokeWidth="3"
        />
      </svg>

      <div className="flex flex-col">
        <span
          className={cn(
            "font-semibold uppercase leading-none text-[#f2d19a]",
            wordmarkSizes[size],
          )}
        >
          VEYRA
        </span>
        {showDescriptor ? (
          <span
            className={cn(
              "mt-1 uppercase leading-none text-[#e9dcc6]/72",
              descriptorSizes[size],
            )}
          >
            Developments
          </span>
        ) : null}
      </div>
    </div>
  );
}
