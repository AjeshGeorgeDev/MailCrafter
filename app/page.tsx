import { redirect } from "next/navigation";
import { isSetupNeeded } from "@/app/actions/setup";
import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { Stats } from "@/components/home/Stats";
import { Features } from "@/components/home/Features";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Check if setup is needed
  const { needsSetup } = await isSetupNeeded();

  // If setup is needed, redirect to setup page
  if (needsSetup) {
    redirect("/setup");
  }

  // Otherwise, show the home page
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
