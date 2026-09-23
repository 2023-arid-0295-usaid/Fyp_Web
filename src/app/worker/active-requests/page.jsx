import { Suspense } from "react";
import ActiveRequestsScreen from "@/components/Worker/ActiveRequestsScreen";

// Route mirror: Stack.Screen name="ActiveRequestsScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <ActiveRequestsScreen />
    </Suspense>
  );
}
