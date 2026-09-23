import { Suspense } from "react";
import FileCriminalRecordScreen from "@/components/Police/FileCriminalRecordScreen";

// Route mirror: Stack.Screen name="FileCriminalRecordScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <FileCriminalRecordScreen />
    </Suspense>
  );
}
