import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Spot } from '../../data/types';
import { useClaimFlow } from '../../hooks/useClaimFlow';
import type { Thresholds } from '../../verify/thresholds';
import { t } from '../../ui/strings';
import { theme } from '../../ui/theme';
import { ApproachStep } from './ApproachStep';
import { PlaceholderCaptureStep } from './CaptureStep';
import { NameStep } from './NameStep';
import { ResultStep } from './ResultStep';

type Props = {
  spot: Spot;
  /** Stored display name, null when none exists yet. */
  player: string | null;
  setPlayer: (name: string) => Promise<void>;
  thresholds: Thresholds;
  /** Back to map from any step: closes the flow only. */
  onClose: () => void;
  /** Done after a pass: closes the flow and the sheet. */
  onDone: () => void;
  onSaved: () => void;
};

/** Full-screen overlay above the map that renders the claim state machine's current step. */
export function ClaimFlow({ spot, player, setPlayer, thresholds, onClose, onDone, onSaved }: Props) {
  const { state, dispatch } = useClaimFlow({ spot, player, thresholds, onClose, onSaved });
  const abandon = () => dispatch({ type: 'abandon' });

  let body: React.ReactNode;
  switch (state.step) {
    case 'name':
      body = (
        <NameStep
          onSubmit={(name) => setPlayer(name).then(() => dispatch({ type: 'nameSet' }))}
          onCancel={abandon}
        />
      );
      break;
    case 'settling':
    case 'approaching':
    case 'dwelling':
      body = <ApproachStep state={state} />;
      break;
    case 'camera':
      body = (
        <PlaceholderCaptureStep
          spot={spot}
          heading={state.heading}
          onCapture={(photoUri) => dispatch({ type: 'capture', photoUri })}
          onCancel={abandon}
        />
      );
      break;
    case 'evaluating':
      body = (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={styles.saving}>{t('saving')}</Text>
        </View>
      );
      break;
    case 'passed':
    case 'failed':
    case 'saveError':
      body = (
        <ResultStep
          state={state}
          player={player ?? ''}
          onDone={onDone}
          onTryAgain={() => dispatch({ type: 'tryAgain' })}
          onRetrySave={() => dispatch({ type: 'retrySave' })}
          onBack={abandon}
        />
      );
      break;
    case 'closed':
      body = null;
  }

  return (
    <View style={styles.overlay}>
      {state.step !== 'camera' && state.step !== 'name' ? (
        <Pressable onPress={abandon} style={styles.back} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.backText}>← {t('backToMap')}</Text>
        </Pressable>
      ) : null}
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.background, paddingTop: 56 },
  back: { position: 'absolute', top: 56, left: 16, zIndex: 1, padding: 8 },
  backText: { color: theme.primary, fontWeight: '700', fontSize: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  saving: { color: theme.muted, fontSize: 16 },
});
