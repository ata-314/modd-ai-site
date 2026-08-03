import TextReveal from "@/animations/TextReveal";
import { pipelineStages } from "@/data/transformations";

function StageMedia({ media, title }: { media: string; title: string }) {
  if (media) {
    const isVideo = /\.(mp4|webm|mov)$/i.test(media);
    if (isVideo) {
      return (
        <video
          className="h-full w-full object-cover"
          src={media}
          muted
          loop
          playsInline
          autoPlay
          aria-label={title}
        />
      );
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={media} alt={title} className="h-full w-full object-cover" />;
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="scanline absolute inset-x-0 top-0 block h-8 bg-accent/5" aria-hidden="true" />
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
        media pending
      </span>
    </div>
  );
}

// Sketch → Render → Film: the production arc, one column per stage.
export default function Pipeline() {
  return (
    <section className="border-t border-line px-6 py-28 md:px-12 md:py-36" id="pipeline">
      <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
        <span className="text-accent">/</span> From sketch to film
      </p>
      <TextReveal
        as="h2"
        className="font-display mb-16 max-w-3xl text-[length:var(--step-3)] font-medium leading-[1.05] tracking-tight"
      >
        The same project, carried from a line drawing to a living film.
      </TextReveal>
      <div className="grid gap-10 md:grid-cols-3 md:gap-6">
        {pipelineStages.map((stage, i) => (
          <article key={stage.num} className="group relative">
            <div className="brackets relative aspect-[4/3] overflow-hidden bg-panel">
              <StageMedia media={stage.media} title={stage.title} />
            </div>
            <div className="mt-5 flex items-baseline gap-4">
              <span className="font-mono text-sm text-accent">{stage.num}</span>
              <h3 className="font-display text-[length:var(--step-2)] font-medium tracking-tight">
                {stage.title}
              </h3>
              {i < pipelineStages.length - 1 && (
                <span
                  aria-hidden="true"
                  className="ml-auto hidden font-mono text-accent/60 md:block"
                >
                  →
                </span>
              )}
            </div>
            <p className="mt-2 max-w-sm text-sm text-muted">{stage.description}</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-accent/60">
              {stage.tag}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
