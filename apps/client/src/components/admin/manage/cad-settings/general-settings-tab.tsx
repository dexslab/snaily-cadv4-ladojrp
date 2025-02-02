import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "use-intl";
import useFetch from "lib/useFetch";
import { Button, Input, Loader, SwitchField, TabsContent, TextField } from "@snailycad/ui";
import { handleValidate } from "lib/handleValidate";
import { CAD_SETTINGS_SCHEMA } from "@snailycad/schemas";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Formik, FormikHelpers } from "formik";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";
import { toastMessage } from "lib/toastMessage";
import type { PutCADSettingsData } from "@snailycad/types/api";

export function GeneralSettingsTab() {
  const [logo, setLogo] = React.useState<(File | string) | null>(null);
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();
  const { AOP } = useFeatureEnabled();
  const t = useTranslations("CadSettings");
  const common = useTranslations("Common");

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!cad) return;

    const fd = new FormData();
    const validatedImage = validateFile(logo, helpers);

    if (validatedImage) {
      if (typeof validatedImage !== "string") {
        fd.set("image", validatedImage, validatedImage.name);
      }
    }

    const { json } = await execute<PutCADSettingsData, typeof INITIAL_VALUES>({
      path: "/admin/manage/cad-settings",
      method: "PUT",
      data: values,
      helpers,
    });

    if (json?.id) {
      if (validatedImage && typeof validatedImage === "object") {
        const {
          json: { logoId },
        } = await execute<PutCADSettingsData, typeof INITIAL_VALUES>({
          path: "/admin/manage/cad-settings/image",
          method: "POST",
          data: fd,
          helpers,
          headers: {
            "content-type": "multipart/form-data",
          },
        });

        json.logoId = logoId;
      }

      toastMessage({
        icon: "success",
        title: common("success"),
        message: common("savedSettingsSuccess"),
      });
      setCad({ ...cad, ...json });
    }
  }

  if (!cad) {
    return null;
  }

  const validate = handleValidate(CAD_SETTINGS_SCHEMA);
  const INITIAL_VALUES = {
    name: cad.name ?? "",
    areaOfPlay: cad.areaOfPlay ?? "",
    steamApiKey: cad.steamApiKey ?? "",
    towWhitelisted: cad.towWhitelisted ?? false,
    taxiWhitelisted: cad.taxiWhitelisted ?? false,
    whitelisted: cad.whitelisted ?? false,
    businessWhitelisted: cad.businessWhitelisted ?? false,
    registrationCode: cad.registrationCode ?? "",
    roleplayEnabled: cad.miscCadSettings?.roleplayEnabled ?? true,
    logoId: cad.logoId ?? "",
  };

  return (
    <TabsContent value={SettingsTabs.GeneralSettings}>
      <h2 className="text-2xl font-semibold">{t("generalSettings")}</h2>

      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, setFieldValue, values, errors }) => (
          <form autoComplete="off" className="mt-3" onSubmit={handleSubmit}>
            <SettingsFormField
              errorMessage={errors.name}
              action="input"
              label={t("cadName")}
              description={t.rich("cadNameDescription", {
                span: (children) => (
                  <span className="text-base italic font-semibold">{children}</span>
                ),
              })}
            >
              <Input onChange={handleChange} value={values.name} name="name" />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.name}
              action="input"
              label={t("cadLogo")}
              description={t.rich("cadLogoDescription", {
                span: (children) => (
                  <span className="text-base italic font-semibold">{children}</span>
                ),
              })}
            >
              <ImageSelectInput label={t("cadLogo")} image={logo} setImage={setLogo} />
            </SettingsFormField>

            {AOP ? (
              <SettingsFormField
                optional
                errorMessage={errors.steamApiKey}
                action="input"
                label={t("areaOfPlay")}
                description={t("areaOfPlayDescription")}
              >
                <Input onChange={handleChange} value={values.areaOfPlay} name="areaOfPlay" />
              </SettingsFormField>
            ) : null}

            <SettingsFormField
              optional
              errorMessage={errors.registrationCode}
              action="input"
              label={t("registrationCode")}
              description={t("registrationCodeDescription")}
            >
              <TextField
                label={t("registrationCode")}
                type="password"
                inputElementType="input"
                onFocus={(event) => (event.target as HTMLInputElement).select()}
                value={String(values.registrationCode)}
                onChange={(value) => setFieldValue("registrationCode", value)}
                autoComplete="off"
                isOptional
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.roleplayEnabled}
              action="checkbox"
              label={t("roleplayEnabled")}
              description={t("roleplayEnabledDescription")}
            >
              <SwitchField
                aria-label={t("roleplayEnabled")}
                isSelected={values.roleplayEnabled}
                onChange={(isSelected) => setFieldValue("roleplayEnabled", isSelected)}
              />
            </SettingsFormField>

            <section>
              <h3 className="font-semibold text-xl mb-3">{t("whitelisting")}</h3>

              <SettingsFormField
                errorMessage={errors.whitelisted}
                action="checkbox"
                label={t("cadWhitelist")}
                description={t("cadWhitelistDescription")}
              >
                <SwitchField
                  aria-label={t("cadWhitelist")}
                  isSelected={values.whitelisted}
                  onChange={(isSelected) => setFieldValue("whitelisted", isSelected)}
                />
              </SettingsFormField>

              <SettingsFormField
                errorMessage={errors.towWhitelisted}
                action="checkbox"
                label={t("towWhitelist")}
                description={t("towWhitelistDescription")}
              >
                <SwitchField
                  aria-label={t("towWhitelist")}
                  isSelected={values.towWhitelisted}
                  onChange={(isSelected) => setFieldValue("towWhitelisted", isSelected)}
                />
              </SettingsFormField>

              <SettingsFormField
                errorMessage={errors.taxiWhitelisted}
                action="checkbox"
                label={t("taxiWhitelist")}
                description={t("taxiWhitelistDescription")}
              >
                <SwitchField
                  aria-label={t("taxiWhitelist")}
                  isSelected={values.taxiWhitelisted}
                  onChange={(isSelected) => setFieldValue("taxiWhitelisted", isSelected)}
                />
              </SettingsFormField>

              <SettingsFormField
                errorMessage={errors.businessWhitelisted}
                action="checkbox"
                label={t("businessWhitelist")}
                description={t("businessWhitelistDescription")}
              >
                <SwitchField
                  aria-label={t("businessWhitelist")}
                  isSelected={values.businessWhitelisted}
                  onChange={(isSelected) => setFieldValue("businessWhitelisted", isSelected)}
                />
              </SettingsFormField>
            </section>

            <Button disabled={state === "loading"} className="flex items-center" type="submit">
              {state === "loading" ? <Loader className="mr-3" /> : null}
              {common("save")}
            </Button>
          </form>
        )}
      </Formik>
    </TabsContent>
  );
}
