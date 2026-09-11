import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PLAYER_NAME_MAX, validatePlayerName } from '../../verify/playerName';
import { t } from '../../ui/strings';
import { theme } from '../../ui/theme';

type Props = {
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

/** Small modal asking for the display name on the first claim. Submits only a valid, trimmed name. */
export function NameStep({ onSubmit, onCancel }: Props) {
  const [raw, setRaw] = useState('');
  const name = validatePlayerName(raw);

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.prompt}>{t('namePrompt')}</Text>
          <Text style={styles.hint}>{t('nameHint')}</Text>
          <TextInput
            value={raw}
            onChangeText={setRaw}
            placeholder={t('namePlaceholder')}
            placeholderTextColor={theme.muted}
            maxLength={PLAYER_NAME_MAX + 2}
            autoFocus
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => name && onSubmit(name)}
            style={styles.input}
          />
          <Pressable
            onPress={() => name && onSubmit(name)}
            disabled={name === null}
            style={[styles.confirm, name === null && styles.disabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: name === null }}
          >
            <Text style={styles.confirmText}>{t('nameConfirm')}</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={styles.cancel} accessibilityRole="button">
            <Text style={styles.cancelText}>{t('backToMap')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: theme.backdrop, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: theme.white, borderRadius: 16, padding: 20, gap: 10 },
  prompt: { fontSize: 20, fontWeight: '700', color: theme.text },
  hint: { color: theme.muted, fontSize: 13 },
  input: {
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.text,
  },
  confirm: { backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  disabled: { opacity: theme.disabledOpacity },
  confirmText: { color: theme.white, fontWeight: '700', fontSize: 16 },
  cancel: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: theme.primary, fontWeight: '700' },
});
