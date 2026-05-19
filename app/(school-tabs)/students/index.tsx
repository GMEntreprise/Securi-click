import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Search, Users, GraduationCap, User } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useMySchool } from '@/features/school/hooks/useSchool';
import { useStudents } from '@/features/school/hooks/useStudents';
import { Avatar } from '@/shared/ui/base/avatar';
import { QueryError } from '@/shared/ui/base/query-error';
import { useDebounce } from '@/hooks/useDebounce';
import type { SchoolChild } from '@/features/school/types';

export default function StudentsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 250);

  const { data: school } = useMySchool();
  const schoolId = school?.id ?? '';
  const { data: students, isLoading, isError, refetch } = useStudents(schoolId);

  const classes = useMemo(() => {
    const set = new Set<string>();
    for (const s of students ?? []) {
      if (s.class_name) set.add(s.class_name);
    }
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    let list = students ?? [];
    if (classFilter) {
      list = list.filter(s => s.class_name === classFilter);
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        s =>
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          (s.parent?.last_name ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, classFilter, debouncedSearch]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SchoolChild>) => <StudentRow item={item} />,
    []
  );

  const keyExtractor = useCallback((item: SchoolChild) => item.id, []);

  if (isError) return <QueryError onRetry={refetch} />;

  if (isLoading && !students) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 16,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text
            style={{
              color: theme.text,
              fontSize: 24,
              fontWeight: '800',
              letterSpacing: -0.5,
            }}
          >
            Élèves
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 14 }}>
            {filtered.length} / {students?.length ?? 0}
          </Text>
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.input,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.inputBorder,
            paddingHorizontal: 12,
            height: 44,
            gap: 8,
          }}
        >
          <Search size={16} color={theme.placeholder} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un élève…"
            placeholderTextColor={theme.placeholder}
            style={{ flex: 1, fontSize: 15, color: theme.text }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text
                style={{ color: theme.accent, fontSize: 13, fontWeight: '600' }}
              >
                Effacer
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Class filter chips */}
        {classes.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 4 }}
          >
            {['Tous', ...classes].map(item => {
              const isActive =
                item === 'Tous' ? !classFilter : classFilter === item;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setClassFilter(item === 'Tous' ? null : item);
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 10,
                    backgroundColor: isActive ? theme.accent : theme.iconBg,
                    borderWidth: 1,
                    borderColor: isActive ? 'transparent' : theme.cardBorder,
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? '#fff' : theme.textSecondary,
                      fontSize: 13,
                      fontWeight: '700',
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>

      {!filtered.length ? (
        debouncedSearch || classFilter ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: 100,
            }}
          >
            <Search size={40} color={theme.textMuted} strokeWidth={1.2} />
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 16,
                fontWeight: '600',
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              Aucun résultat
            </Text>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 13,
                marginTop: 6,
                textAlign: 'center',
              }}
            >
              Essayez un autre nom ou classe.
            </Text>
          </View>
        ) : (
          <StudentsEmptyState />
        )
      ) : (
        <FlashList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        />
      )}
    </View>
  );
}

const StudentsEmptyState = memo(function StudentsEmptyState() {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingBottom: 100,
        gap: 16,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 28,
          backgroundColor: theme.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <GraduationCap size={40} color={theme.primary} strokeWidth={1.5} />
      </View>

      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text
          style={{
            color: theme.text,
            fontSize: 20,
            fontWeight: '800',
            textAlign: 'center',
            letterSpacing: -0.3,
          }}
        >
          Aucun élève inscrit
        </Text>
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          Les élèves rattachés à votre établissement par les parents apparaîtront ici.
        </Text>
      </View>

      <View
        style={{
          backgroundColor: theme.card,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          padding: 16,
          gap: 12,
          width: '100%',
        }}
      >
        {[
          { step: '1', label: 'Un parent crée son compte Securi\'Click.' },
          { step: '2', label: 'Il ajoute son enfant et le rattache à votre établissement.' },
          { step: '3', label: 'L\'élève apparaît automatiquement dans cette liste.' },
        ].map(({ step, label }) => (
          <View key={step} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                backgroundColor: theme.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>{step}</Text>
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 }}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
});

const StudentRow = memo(function StudentRow({ item }: { item: SchoolChild }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.separator,
      }}
    >
      <Avatar
        image={{
          uri: item.photo_url ?? '',
          name: `${item.first_name} ${item.last_name}`,
        }}
        size={48}
        showBorder={false}
        backgroundColor={theme.primaryBg}
        textColor={theme.primary}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>
          {item.first_name} {item.last_name}
        </Text>
        {item.parent && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              marginTop: 2,
            }}
          >
            <User size={11} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>
              {item.parent.first_name} {item.parent.last_name}
            </Text>
          </View>
        )}
      </View>
      {item.class_name && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: theme.primaryBg,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 9,
          }}
        >
          <GraduationCap size={12} color={theme.primary} />
          <Text
            style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}
          >
            {item.class_name}
          </Text>
        </View>
      )}
    </View>
  );
});
