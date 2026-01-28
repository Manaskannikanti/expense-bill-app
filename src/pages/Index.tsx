import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-16">
        <HeroSection />

        {/* Scroll targets */}
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <AboutSection />

        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
