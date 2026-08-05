import SmoothScroll from "@/animations/SmoothScroll";
import ExperienceRoot from "@/components/experience/ExperienceRoot";
import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import Showreel from "@/components/sections/Showreel";
import WorkReel from "@/components/sections/WorkReel";
import Manifesto from "@/components/sections/Manifesto";
import Tools from "@/components/sections/Tools";
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
      {/* Global particle experience: code sea → glyph building → galaxy */}
      <ExperienceRoot />
      <div className="relative z-10">
        <main>
          {/* Page order — reorder/remove sections here. Map: CODE_MAP.md */}
          <Hero />          {/* 01 — full-screen intro */}
          <Showreel />      {/* 02 — video frame */}
          <WorkReel />      {/* 03 — auto-scrolling 9:16 work reels */}
          <Manifesto />     {/* 04 — statement text */}
          <Services />      {/* 05 — service accordion */}
          <Tools />         {/* 06 — toolbox marquee */}
          <BeforeAfter />   {/* 07 — transformation slider */}
          <Pipeline />      {/* 08 — studio pipeline */}
          <SelectedWork />  {/* 09 — project grid */}
          <Process />       {/* 10 — method steps */}
          <Philosophy />    {/* 11 — human × machine */}
          <CTASection />    {/* 12 — closing CTA */}
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}
