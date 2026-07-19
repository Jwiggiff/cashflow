import { AppPageHeader } from "@/components/app-page-header";
import { NotificationForm } from "@/components/settings/notification-form";
import { PasskeysForm } from "@/components/settings/passkeys-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { ThemeForm } from "@/components/settings/theme-form";
import { VersionInfoCard } from "@/components/settings/version-info";
import { requireUser } from "@/lib/require-auth";
import { getVersionInfo } from "@/lib/version";

export default async function SettingsPage() {
  const user = await requireUser();

  const versionInfo = await getVersionInfo();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppPageHeader title="Settings" />

      <div className="flex-1 py-2 @3xl:p-8">
        <div className="max-w-2xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Profile Information</h2>
            <p className="text-sm text-muted-foreground">
              Update your profile information and preferences.
            </p>
          </div>

          <ProfileForm user={user} />

          <div>
            <h2 className="text-lg font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">
              Choose light, dark, or follow your system setting.
            </p>
          </div>

          <ThemeForm />

          <div>
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
            <p className="text-sm text-muted-foreground">
              Manage your push notification settings and preferences.
            </p>
          </div>

          <NotificationForm />

          <div>
            <h2 className="text-lg font-semibold">Security</h2>
            <p className="text-sm text-muted-foreground">
              Manage your authentication methods and security settings.
            </p>
          </div>

          <PasskeysForm />

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
