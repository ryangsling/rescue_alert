import { SafeAreaContainer, Stack, Text } from "@rescue-alert/ui";

export default function Home() {
  return (
    <SafeAreaContainer>
      <Stack align="center" justify="center" gap="4" className="flex-1 p-8">
        <Text variant="heading1">Rescue Alert</Text>
        <Text tone="muted">Rescue UI foundation - mobile app scaffold.</Text>
      </Stack>
    </SafeAreaContainer>
  );
}
