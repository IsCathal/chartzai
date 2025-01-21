import 'dotenv/config';
import { Index as UpstashIndex } from '@upstash/vector';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import ora from 'ora';

// Initialize Upstash Vector client
const index = new UpstashIndex({
  url: process.env.UPSTASH_VECTOR_REST_URL as string,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN as string,
});

// Function to index Reddit comments data
export async function indexRedditData() {
  const spinner = ora('Reading Reddit data...').start();

  // Read and parse CSV file
  const csvPath = path.join(process.cwd(), 'src/rag/reddit_comments_enriched.csv');
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });

  spinner.text = 'Starting Reddit comments indexing...';

  // Index each comment
  for (const comment of records) {
    spinner.text = `Indexing comment: ${comment['Comment ID']}`;
    const text = `${comment['Post Title']}. ${comment['Comment Body']}`;

    try {
      await index.upsert({
        id: comment['Comment ID'], // Using Comment ID as unique ID
        data: text, // Text will be automatically embedded
        metadata: {
          postId: comment['Post ID'],
          postTitle: comment['Post Title'],
          author: comment['Comment Author'],
          score: comment['Comment Score'],
          created: comment['Comment Created'],
          sentiment: comment['Sentiment'],
          sentimentLabel: comment['Sentiment Label'],
          keywords: comment['Keywords'],
          aiMentions: comment['AI Mentions'],
          topic: comment['Topic'],
        },
      });
    } catch (error) {
      spinner.fail(`Error indexing comment ${comment['Comment ID']}`);
      console.error(error);
    }
  }

  spinner.succeed('Finished indexing Reddit data');
}

indexRedditData();
