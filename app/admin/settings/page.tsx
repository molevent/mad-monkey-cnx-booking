import { getEmailSettings } from "@/app/actions/email-settings";
import EmailSettingsForm from "./email-settings-form";
import SettingsHeader from "./settings-header";

export default async function SettingsPage() {
  const settings = await getEmailSettings();

  return (
    <div>
      <SettingsHeader />
      <EmailSettingsForm initialSettings={settings} />
    </div>
  );
}
