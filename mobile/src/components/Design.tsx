import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

export const colors = {
  background: '#f7f3ef',
  surface: '#ffffff',
  ink: '#2f2a26',
  muted: '#7b7169',
  line: '#eadfd5',
  primary: '#ea6a2a',
  primaryDark: '#c94e16',
  danger: '#dc2626',
  success: '#16835f',
  blue: '#2563eb',
};

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, icon }: ButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.primary : '#fff'} /> : icon}
      <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>{title}</Text>
    </Pressable>
  );
}

interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function Field({ label, error, style, ...props }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#a79d94"
        style={[styles.input, props.multiline && styles.textarea, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function Section({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'orange' | 'green' | 'red' | 'blue' }) {
  return (
    <View style={[styles.badge, styles[`badge_${tone}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>{label}</Text>
    </View>
  );
}

export function LoadingState({ label = 'Yükleniyor...' }: { label?: string }) {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.emptyDescription}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button_primary: { backgroundColor: colors.primary },
  button_secondary: { backgroundColor: '#fff4ed', borderColor: '#ffd2b8', borderWidth: 1 },
  button_ghost: { backgroundColor: 'transparent' },
  button_danger: { backgroundColor: colors.danger },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { fontSize: 15, fontWeight: '800' },
  buttonText_primary: { color: '#fff' },
  buttonText_secondary: { color: colors.primaryDark },
  buttonText_ghost: { color: colors.primaryDark },
  buttonText_danger: { color: '#fff' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  fieldWrap: { gap: 7, marginBottom: 14 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  textarea: {
    minHeight: 110,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badge_neutral: { backgroundColor: '#f1ece6' },
  badge_orange: { backgroundColor: '#fff0e5' },
  badge_green: { backgroundColor: '#e9f8f1' },
  badge_red: { backgroundColor: '#fee2e2' },
  badge_blue: { backgroundColor: '#e8f0ff' },
  badgeText: { fontSize: 12, fontWeight: '900' },
  badgeText_neutral: { color: colors.muted },
  badgeText_orange: { color: colors.primaryDark },
  badgeText_green: { color: colors.success },
  badgeText_red: { color: colors.danger },
  badgeText_blue: { color: colors.blue },
  state: {
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    padding: 32,
  },
  stateText: { color: colors.muted, fontWeight: '700' },
  empty: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
  },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  emptyDescription: { color: colors.muted, marginTop: 8, textAlign: 'center' },
});
