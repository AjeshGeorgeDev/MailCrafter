import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-12 text-center text-white shadow-2xl">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-xl text-blue-100">
            Join thousands of businesses creating beautiful email campaigns with MailCrafter
          </p>
          <Link href="/register">
            <Button
              size="lg"
              variant="secondary"
              className="group text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

