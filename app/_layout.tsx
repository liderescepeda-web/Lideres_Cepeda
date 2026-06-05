import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
} from '@expo-google-fonts/montserrat';
import { Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/theme';

function RootNavigator() {
  const { isAuthenticated, initializing, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const inOnboarding = segments[0] === 'onboarding';
    const onLanding = segments[0] === undefined; // ruta raíz '/'

    if (!isAuthenticated) {
      // Visitante: puede ver landing '/', (auth) y /r/[slug]. Si entra al área
      // privada, lo mandamos a la landing.
      if (inAppGroup || inOnboarding) router.replace('/');
    } else if (profile && !profile.consent_data && !inOnboarding) {
      // Falta aceptar Habeas Data / completar perfil mínimo
      router.replace('/onboarding');
    } else if (inAuthGroup || onLanding) {
      router.replace('/(app)');
    }
  }, [isAuthenticated, initializing, segments, profile, router]);

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
      <Stack.Screen name="r/[slug]" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
    Caveat_400Regular,
    Caveat_700Bold,
  });

  // Si las fuentes fallan, continuamos con las del sistema (no bloquear la app).
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
