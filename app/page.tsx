import SmoothScroll from "@/animations/SmoothScroll";
import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import Showreel from "@/components/sections/Showreel";
import Manifesto from "@/components/sections/Manifesto";
import BeforeAfter from "@/components/sections/BeforeAfter";
import Pipeline from "@/components/sections/Pipeline";
import Services from "@/components/sections/Services";
import SelectedWork from "@/components/sections/SelectedWork";
import Process from "@/components/sections/Process";
import Philosophy from "@/components/sections/Philosophy";
import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <SmoothScroll>
      <Header />
      <main>
        {/* Page order — reorder/remove sections here. Map: CODE_MAP.md */}
        <Hero />          {/* 01 — full-screen intro */}
        <Showreel />      {/* 02 — video frame */}
        <Manifesto />     {/* 03 — statement text */}
        <Services />      {/* 04 — service accordion */}
        <BeforeAfter />   {/* 05 — transformation slider */}
        <Pipeline />      {/* 06 — studio pipeline */}
        <SelectedWork />  {/* 07 — project grid */}
        <Process />       {/* 08 — method steps */}
        <Philosophy />    {/* 09 — human × machine */}
        <CTASection />    {/* 10 — closing CTA */}
      </main>
      <Footer />
    </SmoothScroll>
  );
}
