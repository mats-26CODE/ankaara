import { HeroSection } from "@/components/shared/hero-section";
import { SimplePowerfulSection } from "@/components/shared/simple-powerful-section";
import { FeaturesSection } from "@/components/shared/features-section";
import { PricingSection } from "@/components/shared/pricing-section";
import { FinalCTASection } from "@/components/shared/final-cta-section";

const LandingPage = () => {
  return (
    <>
      <HeroSection />
      <SimplePowerfulSection />
      <FeaturesSection />
      <PricingSection />
      <FinalCTASection />
    </>
  );
};

export default LandingPage;
