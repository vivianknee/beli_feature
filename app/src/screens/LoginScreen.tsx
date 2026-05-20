import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuthStore } from "../store";
import { beliLogin } from "../services/api";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { token, display_name } = await beliLogin(email, password);
      await setAuth(token, display_name);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Login failed", e.response?.data?.detail ?? "Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.heading}>Connect Beli</Text>
        <Text style={styles.sub}>Enter your Beli credentials to save places directly to your account.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />

        <TouchableOpacity
          style={[styles.button, (!email || !password || loading) && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={!email || !password || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 28, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 },
  sub: { fontSize: 15, color: "#666", marginBottom: 32, lineHeight: 22 },
  input: {
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1a1a1a",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#2e7d52",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: "#a0c4b0" },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
