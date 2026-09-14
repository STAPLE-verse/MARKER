import { requirePageAuth } from "@/utils/auth";
import { getUserProfile } from "@/features/users/queries/getUserProfile";
import { PROFILE_LANGUAGE_OPTIONS } from "@/features/users/schemas";
import EditProfileForm from "./EditProfileForm";

const KNOWN_LANGUAGES = PROFILE_LANGUAGE_OPTIONS.map((option) => option.value);

export default async function EditProfilePage() {
  const { userId } = await requirePageAuth();
  const profile = await getUserProfile(userId);

  const language = KNOWN_LANGUAGES.includes(profile?.language ?? "") ? profile!.language : "en-US";

  return (
    <EditProfileForm
      initialValues={{
        firstName: profile?.firstName ?? "",
        lastName: profile?.lastName ?? "",
        institution: profile?.institution ?? "",
        orcid: profile?.orcid ?? "",
        gravatar: profile?.gravatar ?? "",
        language,
      }}
    />
  );
}
