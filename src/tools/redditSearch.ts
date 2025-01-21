import type { ToolFn } from '../../types';
import { z } from 'zod';
import { queryRedditData } from '../rag/query';

export const redditSearchToolDefinition = {
  name: 'redditSearch',
  parameters: z.object({
    query: z.string().describe('The search query for finding Reddit posts or comments'),
    sentimentLabel: z
      .string()
      .optional()
      .describe('Filter by sentiment label, such as Positive, Neutral, or Negative'),
    topic: z.string().optional().describe('Filter by topic classification'),
    author: z.string().optional().describe('Filter by the author of the comment'),
  }),
  description:
    'Searches for Reddit posts and comments, returning information like post title, comment body, author, sentiment, keywords, and topic. Use this to answer questions about Reddit discussions.',
};

type Args = z.infer<typeof redditSearchToolDefinition.parameters>;

export const redditSearch: ToolFn<Args, string> = async ({ toolArgs }) => {
  const { query, sentimentLabel, topic, author } = toolArgs;

  const filters = {
    ...(sentimentLabel && { sentimentLabel }),
    ...(topic && { topic }),
    ...(author && { author }),
  };

  let results;
  try {
    results = await queryRedditData(query, filters);
  } catch (error) {
    console.error(error);
    return 'Error: Failed to search for Reddit data';
  }

  const formattedResults = results.map((result) => ({
    postId: result.metadata?.postId,
    postTitle: result.metadata?.postTitle,
    author: result.metadata?.author,
    score: result.metadata?.score,
    created: result.metadata?.created,
    sentiment: result.metadata?.sentiment,
    sentimentLabel: result.metadata?.sentimentLabel,
    keywords: result.metadata?.keywords,
    aiMentions: result.metadata?.aiMentions,
    topic: result.metadata?.topic,
    body: result.data,
  }));

  return JSON.stringify(formattedResults, null, 2);
};
