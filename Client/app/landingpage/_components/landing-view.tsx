import { ArenaSection } from "./arena-section";
import { CtaSection } from "./cta-section";
import { FeaturesSection } from "./features-section";
import { GamesSection } from "./games-section";
import { HeroSection } from "./hero-section";
import { HowItWorks } from "./how-it-works";
import { LandingFooter } from "./landing-footer";
import { LandingHeader } from "./landing-header";
import { PricingSection } from "./pricing-section";
import { TestimonialsSection } from "./testimonials-section";

/** Landing page — lime esports HUD theme, section-by-section scroll. */
export function LandingView() {
  return (
    <div className="min-h-screen bg-black text-white">
      <LandingHeader />
      <HeroSection />
      <GamesSection />
      <HowItWorks />
      <FeaturesSection />
      <ArenaSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
