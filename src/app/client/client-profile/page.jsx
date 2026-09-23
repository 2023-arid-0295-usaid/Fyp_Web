import { Suspense } from "react";
import ClientProfileScreen from "@/components/Client/ClientProfileScreen";

// Route mirror: Stack.Screen name="ClientProfileScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <ClientProfileScreen />
    </Suspense>
  );
}
