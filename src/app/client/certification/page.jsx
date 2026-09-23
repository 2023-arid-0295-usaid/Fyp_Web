import { Suspense } from "react";
import WorkerCertificationDetail from "@/components/Client/WorkerCertificationDetail";

// Route mirror: Stack.Screen name="WorkerCertificationDetail" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <WorkerCertificationDetail />
    </Suspense>
  );
}
