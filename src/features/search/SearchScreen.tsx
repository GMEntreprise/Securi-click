import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDebounce, useDebouncedCallback } from '@/hooks';
import { searchItems } from '@/services/searchService';
import { SearchResult, SearchResponse } from './types';

const SearchScreen = React.memo(() => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const {
    data: searchResults,
    loading,
    error,
    execute: executeSearch,
  } = useDebouncedCallback<[string], SearchResponse>(
    async (searchQuery: string) => {
      return await searchItems(searchQuery);
    },
    { delay: 300 }
  );

  React.useEffect(() => {
    if (debouncedQuery.trim()) {
      executeSearch(debouncedQuery);
    }
  }, [debouncedQuery, executeSearch]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
  }, []);

  const renderSearchResult = useCallback(
    ({ item }: { item: SearchResult }) => (
      <TouchableOpacity className="p-4 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-1">
          {item.title}
        </Text>
        <Text className="text-sm text-gray-600 mb-1">{item.description}</Text>
        <Text className="text-xs text-blue-600 font-medium">
          {item.category}
        </Text>
      </TouchableOpacity>
    ),
    []
  );

  const keyExtractor = useCallback((item: SearchResult) => item.id, []);

  const listEmptyComponent = useMemo(
    () => (
      <View className="flex-1 items-center justify-center py-8">
        <Text className="text-gray-500 text-center">
          {query.trim() ? 'No results found' : 'Start typing to search'}
        </Text>
      </View>
    ),
    [query]
  );

  const loadingComponent = useMemo(
    () => (
      <View className="flex-1 items-center justify-center py-8">
        <Text className="text-gray-500">Searching...</Text>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Search</Text>

        <TextInput
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search for items..."
          className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        {loading && (
          <View className="mt-2">
            <Text className="text-sm text-blue-600">Loading...</Text>
          </View>
        )}

        {error && (
          <View className="mt-2">
            <Text className="text-sm text-red-600">Error: {error.message}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={searchResults?.results || []}
        renderItem={renderSearchResult}
        keyExtractor={keyExtractor}
        ListEmptyComponent={loading ? loadingComponent : listEmptyComponent}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
});

SearchScreen.displayName = 'SearchScreen';

export default SearchScreen;
