import { Suspense } from "react";
import WorkerDashboardScreen from "@/components/Worker/WorkerDashboardScreen";

// Route mirror: Stack.Screen name="WorkerDashboardScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <WorkerDashboardScreen />
    </Suspense>
  );
}
