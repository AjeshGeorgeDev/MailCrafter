import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { Stats } from "@/components/home/Stats";
import { Features } from "@/components/home/Features";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
