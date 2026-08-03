// CSS-only infinite marquee: the track holds two copies of the list and
// translates -50%; reduced-motion stops the animation (list stays readable).
export default function Marquee({ items }: { items: readonly string[] }) {
  const row = (ariaHidden: boolean) => (
    <ul
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 items-center"
    >
      {items.map((item) => (
        <li
          key={item}
          className="flex shrink-0 items-center gap-6 pr-6 font-mono text-[11px] uppercase tracking-[0.25em] text-muted/80"
        >
          {item}
          <span className="text-accent" aria-hidden="true">
            ✳
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="w-full overflow-hidden border-t border-line py-4">
      <div className="marquee-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
