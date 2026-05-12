export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
}
