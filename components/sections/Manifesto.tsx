import TextReveal from "@/animations/TextReveal";
import { siteContent } from "@/data/siteContent";

export default function Manifesto() {
  const { manifesto } = siteContent;
  return (
    <section className="border-t border-line px-6 py-28 md:px-12 md:py-40" id="manifesto">
      <p className="mb-10 font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
        <span className="text-accent">/</span> Manifesto
      </p>
      <h2 className="font-display max-w-5xl text-[length:var(--step-4)] font-medium leading-[1.04] tracking-tight">
        {manifesto.heading.map((line) => (
          <TextReveal key={line} as="span" className="block">
            {line}
          </TextReveal>
        ))}
      </h2>
      <TextReveal
        as="p"
        mode="line"
        className="mt-10 max-w-xl text-[length:var(--step-1)] leading-relaxed text-muted"
      >
        {manifesto.body}
      </TextReveal>
    </section>
  );
}
