import SmoothScroll from "@/animations/SmoothScroll";
import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
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
        <Hero />
        <Manifesto />
        <Services />
        <SelectedWork />
        <Process />
        <Philosophy />
        <CTASection />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
