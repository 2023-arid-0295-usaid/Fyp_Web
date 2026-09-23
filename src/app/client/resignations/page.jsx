import { Suspense } from "react";
import ResignationsScreen from "@/components/Client/ResignationsScreen";

// Route mirror: Stack.Screen name="ResignationsScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <ResignationsScreen />
    </Suspense>
  );
}
