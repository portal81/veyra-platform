type SectionTitleProps = {
  eyebrow: string;
  title: string;
  description: string;
  center?: boolean;
};

export function SectionTitle({
  eyebrow,
  title,
  description,
  center = false,
}: SectionTitleProps) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="mb-3 text-xs font-semibold tracking-[0.28em] text-[#f2c16b] uppercase">
        {eyebrow}
      </p>
      <h2 className="font-serif text-4xl leading-tight text-white md:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-8 text-white/70 md:text-lg">{description}</p>
    </div>
  );
}
