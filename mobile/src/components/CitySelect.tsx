import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronDown, MapPin, X } from 'lucide-react-native';

import { Button, colors } from '@/components/Design';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { CityItem } from '@/types';

interface CitySelectProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
}

export function CitySelect({
  label,
  value = '',
  onChange,
  error,
  placeholder = 'Şehir seç',
  allowEmpty = false,
  emptyLabel = 'Tüm şehirler',
  disabled = false,
}: CitySelectProps) {
  const [cities, setCities] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const loadCities = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await api.get<CityItem[]>('/cities');
      setCities(data);
    } catch (loadCitiesError) {
      setLoadError(getApiErrorMessage(loadCitiesError, 'Şehirler yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCities();
  }, [loadCities]);

  const options = useMemo(() => {
    return allowEmpty ? [{ id: 'all-cities', name: emptyLabel }, ...cities] : cities;
  }, [allowEmpty, cities, emptyLabel]);

  const selectedLabel = value || '';
  const buttonText = loading ? 'Şehirler yükleniyor...' : selectedLabel || placeholder;
  const canOpen = !disabled && !loading && !loadError;

  const selectCity = (cityName: string) => {
    onChange(cityName === emptyLabel ? '' : cityName);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        disabled={!canOpen}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.select, error && styles.selectError, !canOpen && styles.selectDisabled, pressed && styles.pressed]}
      >
        <View style={styles.selectContent}>
          <MapPin color={colors.primary} size={18} />
          <Text numberOfLines={1} style={[styles.value, !selectedLabel && styles.placeholder]}>
            {buttonText}
          </Text>
        </View>
        <ChevronDown color={colors.muted} size={18} />
      </Pressable>
      {loadError ? <Button title="Şehirleri Tekrar Yükle" variant="secondary" onPress={loadCities} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal animationType="slide" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
                <X color={colors.muted} size={20} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.optionList}
              renderItem={({ item }) => {
                const cityName = item.name === emptyLabel ? '' : item.name;
                const active = cityName === value;
                return (
                  <Pressable style={[styles.option, active && styles.optionActive]} onPress={() => selectCity(item.name)}>
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.name}</Text>
                    {active ? <Check color={colors.primaryDark} size={18} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7, marginBottom: 14 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  select: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  selectContent: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10 },
  selectDisabled: { opacity: 0.6 },
  selectError: { borderColor: colors.danger },
  pressed: { opacity: 0.82 },
  value: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: '700' },
  placeholder: { color: '#a79d94' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  overlay: { backgroundColor: 'rgba(47,42,38,0.32)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '72%',
    paddingBottom: 12,
  },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  sheetTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#f1ece6',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  optionList: { paddingHorizontal: 12 },
  option: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  optionActive: { backgroundColor: '#fff4ed' },
  optionText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  optionTextActive: { color: colors.primaryDark, fontWeight: '900' },
});
