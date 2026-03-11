import { redirect } from "next/navigation";

const SettingsPage = () => {
  redirect("/dashboard/settings/profile");
};

export default SettingsPage;
