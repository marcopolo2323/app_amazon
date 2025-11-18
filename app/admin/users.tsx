import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { useAuthStore } from '../../stores/auth';
import { API_URL } from '../../lib/config';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersScreen() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('Loading users from:', `${API_URL}/admin/users`);
      const response = await fetch(
        `${API_URL}/admin/users?page=${page}&limit=20&search=${search}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Users response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Users loaded:', data.users?.length || 0);
      setUsers(data.users);
      setTotalPages(data.pagination.pages);
    } catch (error: any) {
      console.error('Error loading users:', error);
      Alert.alert('Error', `No se pudieron cargar los usuarios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <Card style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={24} color="#6B7280" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.phone && <Text style={styles.userPhone}>{item.phone}</Text>}
        </View>
        <View style={[styles.roleBadge, getRoleBadgeStyle(item.role)]}>
          <Text style={styles.roleText}>{getRoleLabel(item.role)}</Text>
        </View>
      </View>
    </Card>
  );

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      client: 'Cliente',
      affiliate: 'Afiliado',
      admin: 'Admin',
    };
    return labels[role] || role;
  };

  const getRoleBadgeStyle = (role: string) => {
    const styles: Record<string, any> = {
      client: { backgroundColor: '#DBEAFE' },
      affiliate: { backgroundColor: '#D1FAE5' },
      admin: { backgroundColor: '#FEE2E2' },
    };
    return styles[role] || {};
  };

  if (loading && users.length === 0) {
    return (
      <Screen title="Usuarios" safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Usuarios" safeArea scrollable={false}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o email..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadUsers}
      />

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <Ionicons name="chevron-back" size={20} color={page === 1 ? '#D1D5DB' : '#2563EB'} />
          </TouchableOpacity>
          <Text style={styles.pageText}>
            Página {page} de {totalPages}
          </Text>
          <TouchableOpacity
            style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
            onPress={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <Ionicons name="chevron-forward" size={20} color={page === totalPages ? '#D1D5DB' : '#2563EB'} />
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111827',
  },
  listContainer: {
    paddingBottom: 16,
  },
  userCard: {
    marginBottom: 12,
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
