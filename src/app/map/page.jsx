import { Suspense } from "react";
import MapScreen from "@/components/Map/Map";

// Route mirror: Stack.Screen name="MapScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <MapScreen />
    </Suspense>
  );
}
