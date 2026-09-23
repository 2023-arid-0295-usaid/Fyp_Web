import { redirect } from "next/navigation";

// Root path mirrors the React Native initialRouteName="Login".
export default function Home() {
  redirect("/login");
}
