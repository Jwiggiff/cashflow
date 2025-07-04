import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/settings/profile-form";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-8">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Separator />

      <div className="flex-1 p-8">
        <div className="max-w-2xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Profile Information</h2>
            <p className="text-sm text-muted-foreground">
              Update your profile information and preferences.
            </p>
          </div>
          
          <ProfileForm user={session.user} />
        </div>
      </div>
    </div>
  );
} 