"use client";

import { MotionConfig, motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const pillars = [
  {
    title: "AI video prodüksiyon",
    body: "Kamera yok. Set yok. Fikirden videoya tamamen yapay zekâ prodüksiyon.",
  },
  {
    title: "AI görsel prodüksiyon",
    body: "Statik görselleri sinematik deneyimlere taşıyoruz. Kötü renderları güçlü görsellere dönüştürüyoruz.",
  },
  {
    title: "AI destekli pazarlama",
    body: "Yapay zekânın pazarlamayı nasıl dönüştürdüğünü işimizin merkezine koyuyoruz. Araçları izlemiyoruz, üretiyoruz.",
  },
];

const transforms = [
  ["statik görseller", "sinematik deneyimler"],
  ["kötü renderlar", "güçlü görseller"],
  ["fikir", "video"],
];

const stats = [
  ["15", "yıllık ajans deneyimi"],
  ["59", "kişilik ekip"],
  ["300+", "marka referansı"],
  ["3", "ofis — Türkiye, UK, USA"],
];

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="text-sm font-semibold tracking-tight">
          MODD<span className="text-accent">/</span>ai
        </span>
        <a
          href="https://www.moddworks.com"
          className="text-sm text-neutral-400 transition-colors hover:text-accent"
        >
          moddworks.com
        </a>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 pb-24 pt-20 md:px-12 md:pb-36 md:pt-32">
          <motion.p
            {...fadeUp}
            className="mb-6 text-sm uppercase tracking-[0.2em] text-neutral-500"
          >
            MODD/group&apos;un yapay zekâ ajansı
          </motion.p>
          <motion.h1
            {...fadeUp}
            className="max-w-4xl text-4xl font-semibold lowercase leading-[1.05] tracking-tight md:text-7xl"
          >
            kamera yok. set yok.
            <br />
            <span className="text-accent">fikirden videoya.</span>
          </motion.h1>
          <motion.p
            {...fadeUp}
            className="mt-8 max-w-xl text-lg text-neutral-400"
          >
            Tamamen yapay zekâ prodüksiyon. Markalar için üretiyoruz,
            dönüştürüyoruz, iyileştiriyoruz.
          </motion.p>
          <motion.div {...fadeUp} className="mt-10">
            <a
              href="https://www.moddworks.com"
              className="inline-block bg-accent px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-80"
            >
              İşlerimiz ve referanslarımız
            </a>
          </motion.div>
        </section>

        {/* Ne yapıyoruz */}
        <section className="border-t border-neutral-900 px-6 py-24 md:px-12">
          <motion.h2
            {...fadeUp}
            className="mb-12 text-sm uppercase tracking-[0.2em] text-neutral-500"
          >
            Ne yapıyoruz
          </motion.h2>
          <div className="grid gap-10 md:grid-cols-3">
            {pillars.map((p) => (
              <motion.div key={p.title} {...fadeUp}>
                <h3 className="mb-3 text-xl font-semibold tracking-tight">
                  {p.title}
                </h3>
                <p className="text-neutral-400">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Dönüşüm */}
        <section className="border-t border-neutral-900 px-6 py-24 md:px-12">
          <div className="space-y-6">
            {transforms.map(([from, to]) => (
              <motion.p
                key={from}
                {...fadeUp}
                className="text-2xl font-semibold lowercase tracking-tight md:text-4xl"
              >
                <span className="text-neutral-500">{from}</span>
                <span className="mx-4 text-accent">→</span>
                {to}
              </motion.p>
            ))}
          </div>
        </section>

        {/* MODD/group güven bandı */}
        <section className="border-t border-neutral-900 px-6 py-24 md:px-12">
          <div className="grid gap-10 md:grid-cols-4">
            {stats.map(([n, label]) => (
              <motion.div key={label} {...fadeUp}>
                <p className="text-4xl font-semibold text-accent">{n}</p>
                <p className="mt-2 text-sm text-neutral-400">{label}</p>
              </motion.div>
            ))}
          </div>
          <motion.p {...fadeUp} className="mt-12 text-sm text-neutral-500">
            Google Partner · Meta Marketing Partner · Semrush sertifikalı
          </motion.p>
        </section>
      </main>

      <footer className="border-t border-neutral-900 px-6 py-16 md:px-12">
        <motion.p
          {...fadeUp}
          className="text-2xl font-semibold tracking-tight md:text-3xl"
        >
          Üstünlük Taslanmaz, <span className="text-accent">Tasarlanır.</span>
        </motion.p>
        <div className="mt-8 flex flex-wrap gap-6 text-sm text-neutral-400">
          <a
            href="https://www.moddworks.com"
            className="transition-colors hover:text-accent"
          >
            www.moddworks.com
          </a>
          <a
            href="https://www.instagram.com/modd_ai"
            className="transition-colors hover:text-accent"
          >
            Instagram — @modd_ai
          </a>
        </div>
      </footer>
    </MotionConfig>
  );
}
