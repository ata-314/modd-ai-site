// SECTION 10 — CTA: closing call-to-action line + button. Texts: data/siteContent.ts → cta
import TextReveal from "@/animations/TextReveal";
import { siteContent } from "@/data/siteContent";

const AMBIENT = [
  { text: "render_frame :: idle", pos: "left-[8%] top-[20%]" },
  { text: "creative_direction — human", pos: "right-[10%] top-[30%]" },
  { text: "01001101", pos: "left-[16%] bottom-[26%]" },
  { text: "generative_system :: standby", pos: "right-[18%] bottom-[18%]" },
];

export default function CTASection() {
  const { cta } = siteContent;
  return (
    <section className="relative overflow-hidden border-t border-line px-6 py-36 md:px-12 md:py-52">
      {/* Calm echo of the hero's code field */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {AMBIENT.map((a, i) => (
          <span
            key={a.text}
            className={`drift absolute font-mono text-[11px] tracking-wide text-muted/40 ${a.pos}`}
            style={{ animationDelay: `${i * 1.7}s` }}
          >
            {a.text}
          </span>
        ))}
      </div>
      <div className="glass relative rounded-[32px] p-10 md:p-16">
        <TextReveal
          as="h2"
          className="font-display max-w-4xl text-[length:var(--step-4)] font-medium leading-[1.05] tracking-tight"
        >
          {cta.line}
        </TextReveal>
        <a
          href={cta.button.href}
          className="mt-12 inline-block rounded-full border border-accent bg-accent px-8 py-4 font-mono text-sm uppercase tracking-widest text-black transition-colors hover:bg-transparent hover:text-accent focus-visible:bg-transparent focus-visible:text-accent active:translate-y-px"
        >
          {cta.button.label}
        </a>
      </div>
    </section>
  );
}
