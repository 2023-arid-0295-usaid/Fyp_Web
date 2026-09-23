import { Suspense } from "react";
import AddSkillScreen from "@/components/Worker/AddSkillScreen";

// Route mirror: Stack.Screen name="AddSkills" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <AddSkillScreen />
    </Suspense>
  );
}
