import { HeroSection } from "@/components/shared/hero-section";
import { SimplePowerfulSection } from "@/components/shared/simple-powerful-section";
import { PricingSection } from "@/components/shared/pricing-section";
import { FinalCTASection } from "@/components/shared/final-cta-section";

const LandingPage = () => {
  return (
    <>
      <HeroSection />
      <SimplePowerfulSection />
      <PricingSection />
      <FinalCTASection />
    </>
  );
};

export default LandingPage;
