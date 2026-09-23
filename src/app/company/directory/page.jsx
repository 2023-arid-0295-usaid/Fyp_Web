import { Suspense } from "react";
import WorkerDirectoryScreen from "@/components/Company/WorkerDirectoryScreen";

// Route mirror: Stack.Screen name="WorkerDirectoryScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <WorkerDirectoryScreen />
    </Suspense>
  );
}
