// SECTION — TOOLBOX: the tools we work with, drifting in two counter-
// scrolling rows that emerge from black on both sides. Items: data/tools.ts
import { tools } from "@/data/tools";

function Row({ items, reverse, duration }: { items: string[]; reverse?: boolean; duration: string }) {
  const track = [...items, ...items]; // doubled → seamless -50% loop
  return (
    <div
      className="relative overflow-hidden py-3"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 18%, black 82%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 18%, black 82%, transparent)",
      }}
    >
      <div
        className="marquee-track flex w-max items-center gap-4 md:gap-6"
        style={{ animationDuration: duration, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {track.map((t, i) => (
          <span
            key={`${t}-${i}`}
            aria-hidden={i >= items.length}
            className="glass shrink-0 rounded-full px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent md:px-8"
          >
            <span className="text-accent/70">/</span> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Tools() {
  const half = Math.ceil(tools.length / 2);
  return (
    <section className="overflow-hidden border-t border-line py-24 md:py-32" id="tools">
      <p className="mb-12 px-6 font-mono text-[11px] uppercase tracking-[0.3em] text-muted md:px-12">
        <span className="text-accent">/</span> Toolbox
      </p>
      <div className="space-y-4">
        <Row items={tools.slice(0, half)} duration="38s" />
        <Row items={tools.slice(half)} reverse duration="46s" />
      </div>
    </section>
  );
}
