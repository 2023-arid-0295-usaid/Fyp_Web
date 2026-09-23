import { Suspense } from "react";
import RatingAndReviewsScreen from "@/components/Worker/RatingAndReviewsScreen";

// Route mirror: Stack.Screen name="WorkerRatingAndReviewsScreen" from App.tsx.
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <RatingAndReviewsScreen />
    </Suspense>
  );
}
