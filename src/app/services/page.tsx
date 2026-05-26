import { Suspense } from "react";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { OurServicesPage } from "@/components/landing/our-services-page";
import { ParticleField } from "@/components/shared/particle-field";

export default function ServicesPage() {
  return (
    <main className="min-h-screen">
      <ParticleField lite />
      <Navbar />
      <div className="container pb-20 pt-28">
        <Suspense fallback={<p className="text-center text-sm text-white/50">Loading services…</p>}>
          <OurServicesPage />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
