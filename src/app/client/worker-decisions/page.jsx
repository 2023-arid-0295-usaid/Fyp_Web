import { Suspense } from "react";
import WorkerDecisionScreen from "@/components/Client/WorkerDecisionScreen";

// Route mirror: Stack.Screen name="WorkerDecisionScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <WorkerDecisionScreen />
    </Suspense>
  );
}
