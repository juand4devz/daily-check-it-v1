// /page.tsx
import Navbar from "@/components/landing-page/Navbar";
import Hero from "@/components/landing-page/Hero";
import Features from "@/components/landing-page/Features";
import Benefits from "@/components/landing-page/Benefits";
import Testimonials from "@/components/landing-page/Testimonials";
import CTA from "@/components/landing-page/CTA";
import Footer from "@/components/landing-page/Footer";

export default function LandingPage() {
    return (
        <div className="relative w-full">
            <Navbar />
            {/* Ambient background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
            </div>

            {/* Content di depan */}
            <div className="relative z-30 w-full px-4 md:px-auto container mx-auto">
                <Hero />
                <Features />
                <Benefits />
                <Testimonials />
                <CTA />
            </div>
            <Footer />
        </div>
    );
}