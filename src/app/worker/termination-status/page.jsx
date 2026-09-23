import { Suspense } from "react";
import WorkerTerminationScreen from "@/components/Worker/WorkerTerminationScreen";

// Route mirror: Stack.Screen name="WorkerTerminationScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <WorkerTerminationScreen />
    </Suspense>
  );
}
