import type { Metadata } from "next";

import { LandingView } from "./_components/landing-view";

export const metadata: Metadata = {
  title: "DoodleBlue Arena — Indoor Gaming HQ",
  description:
    "Book game stations across 10 zones — chess, pool, darts, PS5 pods and more. Join the arena.",
};

export default function LandingPage() {
  return <LandingView />;
}
