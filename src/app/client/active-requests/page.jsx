import { Suspense } from "react";
import ActiveRequestScreen from "@/components/Client/ActiveRequestScreen";

// Route mirror: Stack.Screen name="ActiveRequestScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <ActiveRequestScreen />
    </Suspense>
  );
}
