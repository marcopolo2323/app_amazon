import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiConfig, debugLog } from "../lib/config";

const ConnectionTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // Try multiple URLs for better compatibility
  const testUrls = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://10.0.2.2:5000",
    "http://192.168.56.1:5000",
    "http://192.168.1.176:5000",
  ];

  const addResult = (message: string) => {
    setResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testConnection = async () => {
    setTesting(true);
    setResults([]);

    addResult(`Testing multiple backend URLs...`);
    debugLog("Starting connection test", { testUrls });

    let serverFound = false;
    let workingUrl = "";

    // Test each URL to find working server
    for (const baseUrl of testUrls) {
      addResult(`🔍 Trying: ${baseUrl}`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${baseUrl}/api/health`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          addResult(`✅ Found server at: ${baseUrl}`);
          addResult(
            `✅ Health check: ${data.ok ? "Server healthy" : "Server responding"}`,
          );
          serverFound = true;
          workingUrl = baseUrl;
          break;
        } else {
          addResult(`⚠️ Server responds but unhealthy: ${response.status}`);
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          addResult(`⏱️ Timeout: ${baseUrl}`);
        } else if (error.message.includes("Network request failed")) {
          addResult(`❌ No server: ${baseUrl}`);
        } else {
          addResult(`❌ Error: ${baseUrl} - ${error.message}`);
        }
      }
    }

    if (!serverFound) {
      addResult(`❌ No backend server found on any URL`);
      addResult(`💡 Make sure backend is running: npm run dev`);
      setTesting(false);
      return;
    }

    // Test 2: API endpoint with working URL
    try {
      const apiUrl = `${workingUrl}/api`;
      addResult(`🔍 Testing API: ${apiUrl}/categories`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiUrl}/categories`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok || response.status === 401) {
        addResult(`✅ API endpoint working (status: ${response.status})`);
        addResult(`🎉 Backend is fully accessible!`);
        addResult(`💡 Update .env: EXPO_PUBLIC_API_URL=${apiUrl}`);
      } else {
        addResult(`❌ API endpoint failed: ${response.status}`);
      }
    } catch (error: any) {
      let errorMessage = `❌ API endpoint error: ${error.message}`;
      if (error.name === "AbortError") {
        errorMessage = "❌ API endpoint timeout";
      } else if (error.message.includes("Network request failed")) {
        errorMessage = "❌ API Network request failed";
      }
      addResult(errorMessage);
    }

    // Test 3: Basic network connectivity
    try {
      const response = await fetch("https://httpbin.org/get");
      if (response.ok) {
        addResult(`✅ Internet connection working`);
      } else {
        addResult(`⚠️ Internet connection issue`);
      }
    } catch (error: any) {
      addResult(`❌ No internet connection: ${error.message}`);
    }

    setTesting(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Connection Test</Text>

      <View style={styles.info}>
        <Text style={styles.infoText}>Current API: {apiConfig.apiUrl}</Text>
        <Text style={styles.infoText}>
          Testing URLs: {testUrls.length} options
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.testButton,
            testing && styles.buttonDisabled,
          ]}
          onPress={testConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="refresh" size={16} color="#ffffff" />
          )}
          <Text style={styles.buttonText}>
            {testing ? "Testing..." : "Test Connection"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
        >
          <Ionicons name="trash" size={16} color="#EF4444" />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.results}>
        <Text style={styles.resultsTitle}>Results:</Text>
        {results.length === 0 ? (
          <Text style={styles.noResults}>No tests run yet</Text>
        ) : (
          results.map((result, index) => (
            <Text key={index} style={styles.resultItem}>
              {result}
            </Text>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.helpButton}
        onPress={() => {
          Alert.alert(
            "Troubleshooting",
            "1. Start backend: cd backend && npm run dev\n" +
              "2. Start MongoDB: mongod\n" +
              "3. Check backend logs for errors\n" +
              "4. Try restarting both servers\n" +
              "5. Update .env with working URL from test\n" +
              "6. For Android emulator use 10.0.2.2:5000\n" +
              "7. For iOS simulator use localhost:5000",
            [{ text: "OK" }],
          );
        }}
      >
        <Ionicons name="help-circle" size={16} color="#2563EB" />
        <Text style={styles.helpText}>Troubleshooting</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: 16,
  },
  info: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "monospace",
    marginBottom: 4,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  testButton: {
    backgroundColor: "#2563EB",
    flex: 1,
  },
  clearButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "500",
    fontSize: 14,
  },
  clearButtonText: {
    color: "#EF4444",
    fontWeight: "500",
    fontSize: 14,
  },
  results: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    minHeight: 120,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  noResults: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 20,
  },
  resultItem: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 4,
    fontFamily: "monospace",
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  helpText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ConnectionTest;
