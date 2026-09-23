import { Suspense } from "react";
import JobConfirmationScreen from "@/components/Worker/JobConfirmationScreen";

// Route mirror: Stack.Screen name="JobConfirmationScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <JobConfirmationScreen />
    </Suspense>
  );
}
