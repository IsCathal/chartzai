import type OpenAI from 'openai'
import {
  generateImage,
  generateImageToolDefinition,
} from './tools/generateImage'
// import { reddit, redditToolDefinition } from './tools/reddit'
import { dadJoke, dadJokeToolDefinition } from './tools/dadJoke'
import { movieSearch, movieSearchToolDefinition } from './tools/movieSearch'
import { redditSearch, redditSearchToolDefinition } from './tools/redditSearch'
import { chartGenerator, chartGeneratorToolDefinition } from './tools/chartGenerator'

export const runTool = async (
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
  userMessage: string
) => {
  const input = {
    userMessage,
    toolArgs: JSON.parse(toolCall.function.arguments || '{}'),
  }

  switch (toolCall.function.name) {
    case generateImageToolDefinition.name:
      return generateImage(input)

    // case redditToolDefinition.name:
    //   return reddit(input)

    case dadJokeToolDefinition.name:
      return dadJoke(input)

    case movieSearchToolDefinition.name:
      return movieSearch(input)

    case redditSearchToolDefinition.name:
      return redditSearch(input)

    case chartGeneratorToolDefinition.name:
      return chartGenerator(input)

    default:
      return `Never run this tool: ${toolCall.function.name} again, or else!`
  }
}
