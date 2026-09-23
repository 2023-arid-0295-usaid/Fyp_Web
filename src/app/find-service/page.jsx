import { Suspense } from "react";
import FindServiceScreen from "@/components/Client/FindServiceScreen";

// Route mirror: Stack.Screen name="FindServiceScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <FindServiceScreen />
    </Suspense>
  );
}
