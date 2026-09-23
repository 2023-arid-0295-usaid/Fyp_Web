import { Suspense } from "react";
import PoliceVerificationPortal from "@/components/Police/PoliceVerificationPortal";

// Route mirror: Stack.Screen name="PoliceVerificationPortal" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <PoliceVerificationPortal />
    </Suspense>
  );
}
