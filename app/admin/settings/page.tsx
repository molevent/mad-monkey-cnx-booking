import { getEmailSettings } from "@/app/actions/email-settings";
import EmailSettingsForm from "./email-settings-form";

export default async function SettingsPage() {
  const settings = await getEmailSettings();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Email Settings</h1>
        <p className="text-gray-500 dark:text-muted-foreground mt-1">
          Configure email notification content and company details
        </p>
      </div>

      <EmailSettingsForm initialSettings={settings} />
    </div>
  );
}
