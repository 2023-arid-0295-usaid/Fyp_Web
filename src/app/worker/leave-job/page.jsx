import { Suspense } from "react";
import LeaveJobScreen from "@/components/Worker/LeaveJobScreen";

// Route mirror: Stack.Screen name="LeaveJobScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <LeaveJobScreen />
    </Suspense>
  );
}
