import { Suspense } from "react";
import InterviewSelectionScreen from "@/components/Client/InterviewSelectionScreen";

// Route mirror: Stack.Screen name="InterviewSelectionScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <InterviewSelectionScreen />
    </Suspense>
  );
}
