import { SearchResult, SearchResponse } from '@/features/search/types';

const mockData: SearchResult[] = [
  {
    id: '1',
    title: 'React Native',
    description: 'Framework for building mobile apps',
    category: 'Technology',
  },
  {
    id: '2',
    title: 'TypeScript',
    description: 'Typed JavaScript for better code',
    category: 'Language',
  },
  {
    id: '3',
    title: 'Expo',
    description: 'Platform for React Native development',
    category: 'Platform',
  },
  {
    id: '4',
    title: 'Supabase',
    description: 'Open source Firebase alternative',
    category: 'Database',
  },
  {
    id: '5',
    title: 'TailwindCSS',
    description: 'Utility-first CSS framework',
    category: 'Styling',
  },
];

export async function searchItems(query: string): Promise<SearchResponse> {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

  if (!query.trim()) {
    return {
      results: [],
      total: 0,
      hasMore: false,
    };
  }

  const filtered = mockData.filter(
    item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  return {
    results: filtered,
    total: filtered.length,
    hasMore: false,
  };
}
