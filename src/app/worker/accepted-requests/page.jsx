import { Suspense } from "react";
import AcceptedRequestScreen from "@/components/Worker/AcceptedRequestScreen";

// Route mirror: Stack.Screen name="AcceptedRequestScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <AcceptedRequestScreen />
    </Suspense>
  );
}
