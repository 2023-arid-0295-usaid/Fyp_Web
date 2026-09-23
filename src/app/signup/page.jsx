import { Suspense } from "react";
import SignupScreen from "@/components/Auth/SignupScreen";

// Route mirror: Stack.Screen name="Signup" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <SignupScreen />
    </Suspense>
  );
}
