import { Index as UpstashIndex } from '@upstash/vector';

// Initialize Upstash Vector client
const index = new UpstashIndex({
  url: process.env.UPSTASH_VECTOR_REST_URL as string,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN as string,
});

type RedditMetadata = {
  postId?: string;
  postTitle?: string;
  author?: string;
  score?: string;
  created?: string;
  sentiment?: string;
  sentimentLabel?: string;
  keywords?: string;
  aiMentions?: boolean;
  topic?: string;
};

export const queryRedditData = async (
  query: string,
  filters?: Partial<RedditMetadata>,
  topK: number = 5
) => {
  // Build filter string if filters provided
  let filterStr = '';
  if (filters) {
    const filterParts = Object.entries(filters)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return `${key}=${value}`;
        } else {
          return `${key}='${value}'`;
        }
      });

    if (filterParts.length > 0) {
      filterStr = filterParts.join(' AND ');
    }
  }

  // Query the vector store
  const results = await index.query({
    data: query,
    topK,
    filter: filterStr || undefined,
    includeMetadata: true,
    includeData: true,
  });

  return results;
};
