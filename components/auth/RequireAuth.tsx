import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import Button from '../Button';

interface RequireAuthProps {
  children: React.ReactNode;
  roles?: string[];
  requireAuth?: boolean;
  fallbackRoute?: string;
}

const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  roles = [],
  requireAuth = true,
  fallbackRoute = '/login',
}) => {
  const router = useRouter();
  const { user, token, isInitialized, loading } = useAuthStore();

  useEffect(() => {
    if (!isInitialized || loading) return;

    // Check if authentication is required
    if (requireAuth && !user) {
      router.replace(fallbackRoute);
      return;
    }

    // Check if user has required role
    if (user && roles.length > 0 && !roles.includes(user.role)) {
      // Redirect to appropriate dashboard based on user role
      const redirectRoute = getUserDashboard(user.role);
      router.replace(redirectRoute);
      return;
    }
  }, [user, token, isInitialized, loading, requireAuth, roles, router, fallbackRoute]);

  const getUserDashboard = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'affiliate':
        return '/affiliate/dashboard';
      case 'client':
        return '/(tabs)/home';
      default:
        return '/(tabs)/home';
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleGoToDashboard = () => {
    if (user) {
      const dashboardRoute = getUserDashboard(user.role);
      router.replace(dashboardRoute);
    }
  };

  // Show loading while initializing
  if (!isInitialized || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Verificando acceso...</Text>
      </View>
    );
  }

  // Show login required message
  if (requireAuth && !user) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed-outline" size={64} color="#6B7280" />
          </View>
          <Text style={styles.title}>Acceso Requerido</Text>
          <Text style={styles.message}>
            Debes iniciar sesión para acceder a esta sección
          </Text>
          <Button onPress={handleGoToLogin} style={styles.button}>
            Iniciar Sesión
          </Button>
        </View>
      </View>
    );
  }

  // Show role access denied message
  if (user && roles.length > 0 && !roles.includes(user.role)) {
    const getRoleLabel = (role: string) => {
      switch (role) {
        case 'client':
          return 'Cliente';
        case 'affiliate':
          return 'Afiliado';
        case 'admin':
          return 'Administrador';
        default:
          return 'Usuario';
      }
    };

    const requiredRolesText = roles.map(getRoleLabel).join(', ');
    const currentRoleText = getRoleLabel(user.role);

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-outline" size={64} color="#EF4444" />
          </View>
          <Text style={styles.title}>Acceso Denegado</Text>
          <Text style={styles.message}>
            Esta sección requiere permisos de: {requiredRolesText}
          </Text>
          <Text style={styles.currentRole}>
            Tu rol actual: {currentRoleText}
          </Text>
          <Button onPress={handleGoToDashboard} style={styles.button}>
            Ir a Mi Dashboard
          </Button>
        </View>
      </View>
    );
  }

  // User has access, render children
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 32,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  currentRole: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
  },
});

export default RequireAuth;
