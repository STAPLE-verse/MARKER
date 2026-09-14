import { requirePageAuth } from "@/utils/auth";
import { getUserProfile } from "@/features/users/queries/getUserProfile";
import { PROFILE_LANGUAGE_OPTIONS, PROFILE_THEME_OPTIONS } from "@/features/users/schemas";
import EditProfileForm from "./EditProfileForm";

const KNOWN_LANGUAGES = PROFILE_LANGUAGE_OPTIONS.map((option) => option.value);
const KNOWN_THEMES = PROFILE_THEME_OPTIONS.map((option) => option.value);

export default async function EditProfilePage() {
  const { userId } = await requirePageAuth();
  const profile = await getUserProfile(userId);

  const language = KNOWN_LANGUAGES.includes(profile?.language ?? "") ? profile!.language : "en-US";
  const theme = KNOWN_THEMES.includes(profile?.theme ?? "") ? profile!.theme : "dark";

  return (
    <EditProfileForm
      initialValues={{
        username: profile?.username ?? "",
        email: profile?.email ?? "",
        firstName: profile?.firstName ?? "",
        lastName: profile?.lastName ?? "",
        institution: profile?.institution ?? "",
        orcid: profile?.orcid ?? "",
        gravatar: profile?.gravatar ?? "",
        language,
        theme,
      }}
    />
  );
}
