import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
  timestamp: string;
}

const NetworkDiagnostics: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://amazon-group-app.onrender.com';
  const BASE_URL = API_URL.replace('/api', '');

  const addResult = (result: Omit<DiagnosticResult, 'timestamp'>) => {
    setResults(prev => [...prev, {
      ...result,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testNetworkConnection = async () => {
    try {
      addResult({
        test: 'Network Connection',
        status: 'pending',
        message: 'Testing basic network connectivity...'
      });

      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        addResult({
          test: 'Network Connection',
          status: 'success',
          message: 'Network connectivity is working',
          details: `Status: ${response.status}`
        });
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      addResult({
        test: 'Network Connection',
        status: 'error',
        message: 'Network connectivity failed',
        details: error.message
      });
      return false;
    }
  };

  const testBackendReachability = async () => {
    try {
      addResult({
        test: 'Backend Reachability',
        status: 'pending',
        message: `Testing connection to ${BASE_URL}...`
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        addResult({
          test: 'Backend Reachability',
          status: 'success',
          message: 'Backend server is reachable',
          details: `Status: ${response.status}, Response: ${JSON.stringify(data)}`
        });
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      let errorMessage = 'Backend server is not reachable';
      let details = error.message;

      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout (10s)';
        details = 'Server might be down or unreachable';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Network request failed';
        details = 'Check if backend is running and IP address is correct';
      }

      addResult({
        test: 'Backend Reachability',
        status: 'error',
        message: errorMessage,
        details: `URL: ${BASE_URL}, Error: ${details}`
      });
      return false;
    }
  };

  const testAPIEndpoints = async () => {
    const endpoints = [
      { path: '/users/health', name: 'Users API' },
      { path: '/categories', name: 'Categories API' },
      { path: '/services', name: 'Services API' }
    ];

    for (const endpoint of endpoints) {
      try {
        addResult({
          test: endpoint.name,
          status: 'pending',
          message: `Testing ${endpoint.path}...`
        });

        const response = await fetch(`${API_URL}${endpoint.path}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (response.ok || response.status === 401) {
          // 401 is acceptable as it means the endpoint exists but requires auth
          addResult({
            test: endpoint.name,
            status: response.status === 401 ? 'warning' : 'success',
            message: response.status === 401 ? 'Endpoint exists (auth required)' : 'Endpoint is working',
            details: `Status: ${response.status}`
          });
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error: any) {
        addResult({
          test: endpoint.name,
          status: 'error',
          message: `Endpoint ${endpoint.path} failed`,
          details: error.message
        });
      }
    }
  };

  const testCORSConfiguration = async () => {
    try {
      addResult({
        test: 'CORS Configuration',
        status: 'pending',
        message: 'Testing CORS headers...'
      });

      const response = await fetch(`${BASE_URL}/api/categories`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'exp://localhost:19000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });

      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
      };

      if (corsHeaders['Access-Control-Allow-Origin']) {
        addResult({
          test: 'CORS Configuration',
          status: 'success',
          message: 'CORS is properly configured',
          details: JSON.stringify(corsHeaders, null, 2)
        });
      } else {
        addResult({
          test: 'CORS Configuration',
          status: 'warning',
          message: 'CORS headers not found',
          details: 'Backend might not be configured for cross-origin requests'
        });
      }
    } catch (error: any) {
      addResult({
        test: 'CORS Configuration',
        status: 'error',
        message: 'CORS test failed',
        details: error.message
      });
    }
  };

  const runFullDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    addResult({
      test: 'Configuration',
      status: 'success',
      message: 'Starting diagnostics...',
      details: `API URL: ${API_URL}\nBase URL: ${BASE_URL}`
    });

    const networkOk = await testNetworkConnection();

    if (networkOk) {
      const backendOk = await testBackendReachability();

      if (backendOk) {
        await testAPIEndpoints();
        await testCORSConfiguration();
      }
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
      case 'error':
        return <Ionicons name="close-circle" size={20} color="#EF4444" />;
      case 'warning':
        return <Ionicons name="warning" size={20} color="#F59E0B" />;
      case 'pending':
        return <ActivityIndicator size="small" color="#2563EB" />;
      default:
        return <Ionicons name="help-circle" size={20} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'pending':
        return '#2563EB';
      default:
        return '#6B7280';
    }
  };

  const renderResult = (result: DiagnosticResult, index: number) => (
    <View key={index} style={styles.resultItem}>
      <View style={styles.resultHeader}>
        {getStatusIcon(result.status)}
        <Text style={styles.testName}>{result.test}</Text>
        <Text style={styles.timestamp}>{result.timestamp}</Text>
      </View>

      <Text style={[styles.message, { color: getStatusColor(result.status) }]}>
        {result.message}
      </Text>

      {result.details && (
        <Text style={styles.details}>{result.details}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Diagnostics</Text>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runFullDiagnostics}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="refresh" size={20} color="#ffffff" />
          )}
          <Text style={styles.buttonText}>
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.configInfo}>
        <Text style={styles.configTitle}>Configuration:</Text>
        <Text style={styles.configText}>API URL: {API_URL}</Text>
        <Text style={styles.configText}>Base URL: {BASE_URL}</Text>
      </View>

      <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
        {results.length === 0 && !isRunning && (
          <Text style={styles.noResults}>
            Tap "Run Diagnostics" to test your backend connection
          </Text>
        )}
        {results.map(renderResult)}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Tips: Make sure your backend is running on the correct port and your device is on the same network
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  configInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  configText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  results: {
    flex: 1,
  },
  noResults: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    marginTop: 40,
  },
  resultItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginLeft: 12,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  details: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  footer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  footerText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
});

export default NetworkDiagnostics;
