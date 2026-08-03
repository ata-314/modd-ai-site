import TextReveal from "@/animations/TextReveal";
import { siteContent } from "@/data/siteContent";

function Column({
  title,
  items,
  align,
}: {
  title: string;
  items: readonly string[];
  align: "left" | "right";
}) {
  const alignCls = align === "right" ? "md:text-right" : "";
  return (
    <div className={alignCls}>
      <h3 className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted">
        {title}
      </h3>
      <ul className="mt-8 space-y-4">
        {items.map((item) => (
          <li
            key={item}
            className="font-display text-[length:var(--step-3)] font-medium tracking-tight"
          >
            <TextReveal as="span" className="block">
              {item}
            </TextReveal>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Philosophy() {
  const { philosophy } = siteContent;
  return (
    <section className="border-t border-line px-6 py-28 md:px-12 md:py-40" id="about">
      <p className="mb-16 font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
        <span className="text-accent">/</span> Human + Machine
      </p>
      <div className="grid items-center gap-14 md:grid-cols-[1fr_auto_1fr] md:gap-10">
        <Column title={philosophy.human.title} items={philosophy.human.items} align="left" />
        <div className="flex flex-col items-center gap-6" aria-hidden="true">
          <span className="hidden h-24 w-px bg-line md:block" />
          <p className="brackets font-display px-6 py-4 text-xl font-bold tracking-tight text-accent">
            {philosophy.center}
          </p>
          <span className="hidden h-24 w-px bg-line md:block" />
        </div>
        <Column title={philosophy.machine.title} items={philosophy.machine.items} align="right" />
      </div>
      <p className="mt-16 max-w-md text-muted md:mx-auto md:text-center">
        {philosophy.caption}
      </p>
    </section>
  );
}
