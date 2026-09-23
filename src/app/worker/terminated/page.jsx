import { Suspense } from "react";
import WorkerTerminatedScreen from "@/components/Worker/WorkerTerminatedScreen";

// Route mirror: Stack.Screen name="WorkerTerminatedScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <WorkerTerminatedScreen />
    </Suspense>
  );
}
