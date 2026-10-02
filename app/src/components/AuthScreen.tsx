import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { registerWithEmail, signInWithEmail } from '../data/auth';
import { t } from '../ui/strings';
import { theme } from '../ui/theme';
import { validatePlayerName } from '../verify/playerName';

type Props = { initialError?: string | null };
type Mode = 'sign-in' | 'register';

export function AuthScreen({ initialError = null }: Props) {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'register') {
        const validName = validatePlayerName(displayName);
        if (!validName) {
          setError(t('authDisplayNameRequired'));
          return;
        }
        const signedIn = await registerWithEmail(email, password, validName);
        if (signedIn) {
          setNotice(t('authAccountCreated'));
        } else {
          setNotice(t('authCheckEmail'));
        }
      } else {
        await signInWithEmail(email, password);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('authGenericError'));
    } finally {
      setBusy(false);
    }
  };

  const registering = mode === 'register';
  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (!registering || validatePlayerName(displayName) !== null);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.wordmark}>{t('appName')}</Text>
          <Text style={styles.title}>{t(registering ? 'authRegisterTitle' : 'authLoginTitle')}</Text>
          <Text style={styles.subtitle}>{t('authSubtitle')}</Text>

          {registering ? (
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t('authDisplayName')}
              placeholderTextColor={theme.muted}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={20}
              textContentType="nickname"
              returnKeyType="next"
              style={styles.input}
              editable={!busy}
            />
          ) : null}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('authEmail')}
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="next"
            style={styles.input}
            editable={!busy}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('authPassword')}
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            textContentType={registering ? 'newPassword' : 'password'}
            autoComplete={registering ? 'new-password' : 'current-password'}
            returnKeyType="done"
            onSubmitEditing={submit}
            style={styles.input}
            editable={!busy}
          />

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {notice ? <Text accessibilityRole="text" style={styles.notice}>{notice}</Text> : null}

          <Pressable
            onPress={submit}
            disabled={busy || !canSubmit}
            style={[styles.submit, (busy || !canSubmit) && styles.disabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy || !canSubmit }}
          >
            {busy ? <ActivityIndicator color={theme.white} /> : (
              <Text style={styles.submitText}>{t(registering ? 'authRegisterButton' : 'authLoginButton')}</Text>
            )}
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{t(registering ? 'authHaveAccount' : 'authNeedAccount')}</Text>
            <Pressable
              onPress={() => {
                setMode(registering ? 'sign-in' : 'register');
                setError(null);
                setNotice(null);
              }}
              disabled={busy}
              accessibilityRole="button"
            >
              <Text style={styles.switchAction}>{t(registering ? 'authLoginButton' : 'authRegisterButton')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: theme.white,
    borderRadius: 22,
    padding: 22,
    gap: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  },
  wordmark: { color: theme.primary, fontWeight: '900', fontSize: 30, letterSpacing: 1 },
  title: { color: theme.text, fontSize: 23, fontWeight: '800' },
  subtitle: { color: theme.muted, fontSize: 15, marginBottom: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.white,
  },
  error: { color: theme.error, fontSize: 14 },
  notice: { color: theme.primary, fontSize: 14 },
  submit: { minHeight: 48, backgroundColor: theme.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 12 },
  disabled: { opacity: theme.disabledOpacity },
  submitText: { color: theme.white, fontWeight: '800', fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 5 },
  switchText: { color: theme.muted },
  switchAction: { color: theme.primary, fontWeight: '800' },
});
