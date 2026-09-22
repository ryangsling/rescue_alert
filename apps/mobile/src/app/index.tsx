import { Button, SafeAreaContainer, Stack, Text } from "@rescue-alert/ui";
import { translate, useLocale } from "@rescue-alert/localization";

export default function Home() {
  const { locale, setLocale } = useLocale();

  return (
    <SafeAreaContainer>
      <Stack align="center" justify="center" gap="4" className="flex-1 p-8">
        <Text variant="heading1">{translate(locale, "app_name")}</Text>
        <Text tone="muted">Rescue UI foundation - mobile app scaffold.</Text>
        <Button
          variant="outline"
          onPress={() => setLocale(locale === "en" ? "bn" : "en")}
        >
          {locale === "en" ? "বাংলা" : "English"}
        </Button>
      </Stack>
    </SafeAreaContainer>
  );
}
