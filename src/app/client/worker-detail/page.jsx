import { Suspense } from "react";
import WorkerDetailScreen from "@/components/Client/WorkerDetailScreen";

// Route mirror: Stack.Screen name="WorkerDetailScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <WorkerDetailScreen />
    </Suspense>
  );
}
