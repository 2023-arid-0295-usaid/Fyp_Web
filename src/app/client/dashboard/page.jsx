import { Suspense } from "react";
import UserDashboardScreen from "@/components/Client/UserDashboardScreen";

// Route mirror: Stack.Screen name="UserDashboardScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <UserDashboardScreen />
    </Suspense>
  );
}
