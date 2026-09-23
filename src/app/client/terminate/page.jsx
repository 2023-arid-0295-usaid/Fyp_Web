import { Suspense } from "react";
import TerminateContractScreen from "@/components/Client/TerminateContractScreen";

// Route mirror: Stack.Screen name="TerminateContractScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <TerminateContractScreen />
    </Suspense>
  );
}
