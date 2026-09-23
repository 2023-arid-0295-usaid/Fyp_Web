import { Suspense } from "react";
import FilterationScreen from "@/components/Client/FilterationScreen";

// Route mirror: Stack.Screen name="FilterationScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <FilterationScreen />
    </Suspense>
  );
}
