import { generateImageToolDefinition } from './generateImage'
// import { redditToolDefinition } from './reddit'
import { dadJokeToolDefinition } from './dadJoke'
import { movieSearchToolDefinition } from './movieSearch'
import { redditSearchToolDefinition } from './redditSearch'
import { chartGeneratorToolDefinition } from './chartGenerator' 


export const tools = [
  generateImageToolDefinition,
  // redditToolDefinition,
  dadJokeToolDefinition,
  movieSearchToolDefinition,
  redditSearchToolDefinition,
  chartGeneratorToolDefinition
]
