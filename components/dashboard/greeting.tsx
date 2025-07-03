import { auth } from "@/lib/auth";

export async function Greeting() {
  const session = await auth();

  return (
    <h1 className="text-3xl font-bold">
      Hello
      {session?.user
        ? `, ${session?.user?.name || session?.user?.username}`
        : ""}
    </h1>
  );
}
