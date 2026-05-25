import { GsapProvider } from "@/animations/gsap-provider";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { LandingSections } from "@/components/landing/landing-sections";
import { Navbar } from "@/components/landing/navbar";
import { ParticleField } from "@/components/shared/particle-field";

export default function Home() {
  return (
    <main className="min-h-screen">
      <ParticleField />
      <GsapProvider />
      <Navbar />
      <Hero />
      <LandingSections />
      <Footer />
    </main>
  );
}
