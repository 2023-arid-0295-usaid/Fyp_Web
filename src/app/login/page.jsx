import { Suspense } from "react";
import LoginScreen from "@/components/Auth/LoginScreen";

// Route mirror: Stack.Screen name="Login" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <LoginScreen />
    </Suspense>
  );
}
