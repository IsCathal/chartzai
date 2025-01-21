import type { AIMessage } from '../types'
import { addMessages, getMessages, saveToolResponse } from './memory'
import { runApprovalCheck, runLLM } from './llm'
import { showLoader, logMessage } from './ui'
import { runTool } from './toolRunner'
import { generateImageToolDefinition } from './tools/generateImage'

const handleImageApprovalFlow = async (
  history: AIMessage[],
  userMessage: string
) => {
  console.log("Starting image approval flow...");
  const lastMessage = history[history.length - 1]
  const toolCall = lastMessage?.tool_calls?.[0]

  if (
    !toolCall ||
    toolCall.function.name !== generateImageToolDefinition.name
  ) {
    console.log("No tool call or tool call doesn't match image generation.");
    return false
  }

  const loader = showLoader('Processing approval...')
  console.log("Running approval check...");
  const approved = await runApprovalCheck(userMessage)

  if (approved) {
    console.log("User approved. Executing tool...");
    loader.update(`executing tool: ${toolCall.function.name}`)
    const toolResponse = await runTool(toolCall, userMessage)

    console.log("Tool response received.");
    loader.update(`done: ${toolCall.function.name}`)
    await saveToolResponse(toolCall.id, toolResponse)
    console.log("Tool response saved.");
  } else {
    console.log("User did not approve. Saving response...");
    await saveToolResponse(
      toolCall.id,
      'User did not approve image generation at this time.'
    )
  }

  loader.stop()
  console.log("Approval flow complete.");
  return true
}

export const runAgent = async ({
  userMessage,
  tools,
}: {
  userMessage: string
  tools: any[]
}) => {
  console.log("Running agent...");
  const history = await getMessages()
  console.log("History retrieved:", history);
  const isImageApproval = await handleImageApprovalFlow(history, userMessage)

  if (!isImageApproval) {
    await addMessages([{ role: 'user', content: userMessage }])
    console.log("User message added to history.");
  }

  const loader = showLoader('🤔')

  while (true) {
    console.log("Starting loop iteration...");
    const history = await getMessages()
    console.log("Updated history retrieved:", history);
    const response = await runLLM({ messages: history, tools })

    console.log("LLM response received:", response);
    if (!response) {
      console.error("No response received from LLM. Exiting loop.");
      loader.stop();
      break;
    }

    await addMessages([response])
    console.log("Response added to history.");

    if (response.content) {
      console.log("Response with content received. Stopping loader.");
      loader.stop()
      logMessage(response)
      return getMessages()
    }

    if (response.tool_calls) {
      const toolCall = response.tool_calls[0]
      logMessage(response)
      loader.update(`executing: ${toolCall.function.name}`)
      console.log("Executing tool:", toolCall.function.name);

      if (toolCall.function.name === generateImageToolDefinition.name) {
        loader.update('need user approval')
        loader.stop()
        console.log("Image approval required. Returning messages.");
        return getMessages()
      }

      console.log('Running tool:', toolCall.function.name);
      const toolResponse = await runTool(toolCall, userMessage);
      console.log('Tool response received:', toolResponse);

      await saveToolResponse(toolCall.id, toolResponse);
      console.log('Tool response saved:', toolCall.function.name);

      loader.update(`done: ${toolCall.function.name}`);
    }
    console.log("Ending loop iteration.");
  }
}

export const runAgentEval = async ({
  userMessage,
  tools,
}: {
  userMessage: string
  tools: any[]
}) => {
  console.log("Running agent evaluation...");
  let messages: AIMessage[] = [{ role: 'user', content: userMessage }]

  while (true) {
    console.log("Running LLM for evaluation...");
    const response = await runLLM({ messages, tools })
    messages = [...messages, response]

    if (response.content) {
      console.log("Response with content received during evaluation.");
      return messages
    }

    if (response.tool_calls) {
      const toolCall = response.tool_calls[0]

      if (toolCall.function.name === generateImageToolDefinition.name) {
        console.log("Image generation tool call detected in eval. Returning messages.");
        return messages
      }

      console.log("Running tool for eval:", toolCall.function.name);
      const toolResponse = await runTool(toolCall, userMessage)
      messages = [
        ...messages,
        { role: 'tool', content: toolResponse, tool_call_id: toolCall.id },
      ]
      console.log("Tool response added to evaluation messages.");
    }
  }
}
