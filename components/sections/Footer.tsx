// PAGE PART — FOOTER: nav, contact, social links. Texts: data/siteContent.ts → footer
import { siteContent } from "@/data/siteContent";

export default function Footer() {
  const { footer, brand } = siteContent;
  return (
    <footer className="border-t border-line px-6 py-16 md:px-12" id="contact">
      <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight">
            MODD<span className="text-accent">-</span>AI
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted">
            {siteContent.hero.subline}
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
            Menu
          </h3>
          <ul className="mt-5 space-y-3">
            {footer.nav.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-sm text-fg/85 transition-colors hover:text-accent"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
            Contact
          </h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <a
                href={footer.instagram.href}
                target="_blank"
                rel="noreferrer"
                className="text-fg/85 transition-colors hover:text-accent"
              >
                {footer.instagram.label}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${footer.email}`}
                className="text-fg/85 transition-colors hover:text-accent"
              >
                {footer.email}
              </a>
            </li>
            <li>
              <a
                href={footer.website.href}
                target="_blank"
                rel="noreferrer"
                className="text-fg/85 transition-colors hover:text-accent"
              >
                {footer.website.label}
              </a>
            </li>
            <li className="text-muted">{footer.location}</li>
          </ul>
        </div>
      </div>
      <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <p className="font-mono text-[11px] text-muted">{footer.copyright}</p>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted/60">
          {brand} · human_control = true
        </p>
      </div>
    </footer>
  );
}
