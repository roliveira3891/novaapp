import { redirect } from "next/navigation";
import ResponsiveApp from "@/components/ResponsiveApp";
import { getCurrentUser } from "@/lib/currentUser";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return <ResponsiveApp user={user} />;
}
