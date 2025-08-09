import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/lib/require-auth";
import { ProfileForm } from "@/components/settings/profile-form";
import { NotificationForm } from "@/components/settings/notification-form";
import { VersionInfoCard } from "@/components/settings/version-info";
import { getVersionInfo } from "@/lib/version";

export default async function SettingsPage() {
  const user = await requireUser();

  const versionInfo = await getVersionInfo();

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
          
          <ProfileForm user={user} />

          <div>
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
            <p className="text-sm text-muted-foreground">
              Manage your push notification settings and preferences.
            </p>
          </div>
          
          <NotificationForm />

          <div>
            <h2 className="text-lg font-semibold">Application Information</h2>
            <p className="text-sm text-muted-foreground">
              Current version and build information.
            </p>
          </div>
          
          <VersionInfoCard versionInfo={versionInfo} />
        </div>
      </div>
    </div>
  );
} 