import { Layout } from "../components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { ClubsPreview } from "@/components/home/ClubsPreview";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <ClubsPreview />
      <CTASection />
    </Layout>
  );
};

export default Index;
