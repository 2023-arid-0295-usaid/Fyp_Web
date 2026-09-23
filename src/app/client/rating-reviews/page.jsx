import { Suspense } from "react";
import RatingAndReviewsScreen from "@/components/Client/RatingAndReviewsScreen";

// Route mirror: Stack.Screen name="RatingAndReviewsScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <RatingAndReviewsScreen />
    </Suspense>
  );
}
