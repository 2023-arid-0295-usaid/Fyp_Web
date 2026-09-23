import { Suspense } from "react";
import WorkerDetailsVerificationScreen from "@/components/Company/WorkerDetailsVerificationScreen";

// Route mirror: Stack.Screen name="WorkerDetailsVerificationScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <WorkerDetailsVerificationScreen />
    </Suspense>
  );
}
