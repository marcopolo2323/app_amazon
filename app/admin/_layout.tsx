import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F9FAFB' },
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="users" />
      <Stack.Screen name="affiliates" />
      <Stack.Screen name="services" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="payments" />
    </Stack>
  );
}
