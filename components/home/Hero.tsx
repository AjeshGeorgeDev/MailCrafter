import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Mail, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-purple-50 py-20 md:py-32">
      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm shadow-sm">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-gray-700">
              Professional Email Template Builder
            </span>
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
            Craft Beautiful Emails
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              That Convert
            </span>
          </h1>
          <p className="mb-8 text-xl text-gray-600 md:text-2xl">
            Build, manage, and send stunning email campaigns with our
            drag-and-drop editor. No coding required.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="group text-lg px-8 py-6">
                Start Building Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Sign In
              </Button>
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <span>Free Forever Plan</span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-0">
        <div className="absolute left-[10%] top-20 h-72 w-72 rounded-full bg-blue-200 opacity-20 blur-3xl"></div>
        <div className="absolute right-[10%] bottom-20 h-72 w-72 rounded-full bg-purple-200 opacity-20 blur-3xl"></div>
      </div>
    </section>
  );
}

