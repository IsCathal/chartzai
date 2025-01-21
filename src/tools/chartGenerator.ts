import type { ToolFn } from '../../types'
import { z } from 'zod'
import { readFileSync } from 'fs'

// If you're on Node.js < 18, install "node-fetch" and import it. 
// If you're on Node.js 18+, the 'fetch' API is built-in.
// import fetch from 'node-fetch'

export const chartGeneratorToolDefinition = {
  name: 'chartGenerator',
  description:
    'Generates a chart (as an image URL) from the array of movies in db.json. Provide chart type and x/y fields to plot.',
  parameters: z.object({
    chartType: z.enum(['bar', 'line', 'pie']).describe('The type of chart'),
    xField: z.string().describe('Key in the data to map onto the x-axis'),
    yField: z.string().describe('Key in the data to map onto the y-axis'),
    limit: z.number().optional().describe('Optionally limit the number of data points'),
  }),
}

type ChartGeneratorArgs = z.infer<typeof chartGeneratorToolDefinition.parameters>

export const chartGenerator: ToolFn<ChartGeneratorArgs, string> = async ({ toolArgs }) => {
  const { chartType, xField, yField, limit } = toolArgs

  let dbData
  try {
    dbData = JSON.parse(readFileSync('db.json', 'utf8'))
  } catch (error) {
    console.error(error)
    return 'Error: Failed to read db.json'
  }

  // dbData is expected to be an object containing { messages: [ ... ] }
  if (!dbData || !Array.isArray(dbData.messages)) {
    return 'Error: db.json has no "messages" array'
  }

  // 1) Find the last "tool" role that presumably has the array of movies
  const toolMessages = dbData.messages.filter((m: any) => m.role === 'tool')
  if (!toolMessages.length) {
    return 'Error: No tool messages found in db.json'
  }

  const lastToolMsg = toolMessages[toolMessages.length - 1]

  // 2) Parse the actual array of movies stored in `lastToolMsg.content`
  let movies
  try {
    movies = JSON.parse(lastToolMsg.content)
  } catch (err) {
    console.error(err)
    return 'Error: The tool message content is not valid JSON'
  }

  if (!Array.isArray(movies)) {
    return 'Error: The last tool message content is not an array'
  }

  // (Optional) limit results
  const sliced = limit ? movies.slice(0, limit) : movies

  // 3) Build Chart.js-compatible chart object
  const chartConfig = {
    type: chartType, // e.g. 'bar'
    data: {
      labels: sliced.map((item) => String(item[xField] ?? '')),
      datasets: [
        {
          label: `${yField} by ${xField}`,
          data: sliced.map((item) => Number(item[yField] ?? 0)),
        },
      ],
    },
  }

  // 4) Send chartConfig to QuickChart to generate a chart image URL
  try {
    const response = await fetch('https://quickchart.io/chart/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chart: chartConfig }),
    })

    const result = await response.json()
    if (!result.url) {
      return 'Error: QuickChart did not return a chart URL.'
    }

    // Return the final chart image URL
    return result.url
  } catch (err) {
    console.error('Error generating chart image:', err)
    return 'Error: Failed to generate chart image.'
  }
}
