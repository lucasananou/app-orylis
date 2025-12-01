import Script from "next/script";
import { PublicOnboardingWizard } from "@/components/onboarding/public-onboarding-wizard";

export default function StartPage() {
    return (
        <div className="min-h-screen bg-white">
            <PublicOnboardingWizard />
            {/* Facebook Pixel - ViewContent */}
            <Script id="fb-viewcontent" strategy="afterInteractive">
                {`if (typeof fbq === 'function') { try { fbq('track', 'ViewContent'); } catch(e) {} }`}
            </Script>
        </div>
    );
}
