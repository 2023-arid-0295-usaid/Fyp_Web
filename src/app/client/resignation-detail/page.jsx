import { Suspense } from "react";
import ResignationScreen from "@/components/Client/ResignationScreen";

// Route mirror: Stack.Screen name="ResignationScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <ResignationScreen />
    </Suspense>
  );
}
