import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import { z } from 'zod'
import { writeFileSync } from 'fs'
import { join } from 'path'

export const chartGeneratorToolDefinition = {
  name: 'chartGenerator',
  description:
    'Generates a colorful chart as a PNG file using Chart.js. Provide chart type and data to render.',
  parameters: z.object({
    chartType: z.enum(['bar', 'line', 'pie']).describe('The type of chart'),
    data: z.object({
      labels: z.array(z.string()).describe('Labels for the x-axis'),
      datasets: z.array(
        z.object({
          label: z.string().describe('Label for the dataset'),
          data: z.array(z.number()).describe('Data points for the dataset'),
        })
      ).describe('Array of datasets to plot'),
    }).describe('Chart.js-compatible data object'),
    options: z
      .object({})
      .optional()
      .describe('Optional Chart.js configuration options'),
  }),
}

type ChartGeneratorArgs = z.infer<typeof chartGeneratorToolDefinition.parameters>

const width = 800 // Canvas width
const height = 600 // Canvas height
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height })

export const chartGenerator = async ({
  toolArgs,
}: {
  toolArgs: ChartGeneratorArgs
}): Promise<string> => {
  const { chartType, data, options } = toolArgs

  try {
    // Generate colorful chart data by adding colors
    const colors = generateColors(data.labels.length)
    const enhancedDatasets = data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: chartType === 'pie' ? colors : colors[index], // Use different colors for pie charts
      borderColor: chartType === 'line' ? colors[index] : undefined, // Line chart gets border colors
      borderWidth: 1,
    }))

    const chartConfig = {
      type: chartType,
      data: {
        ...data,
        datasets: enhancedDatasets,
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
        ...options,
      },
    }

    // Render the chart to a PNG buffer
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(chartConfig)

    // Save to the root directory
    const rootDirectory = process.cwd() // Current working directory (root of the project)
    const fileName = `chart_${Date.now()}.png` // Unique file name
    const outputPath = join(rootDirectory, fileName)

    writeFileSync(outputPath, imageBuffer)
    console.log(`Chart saved to ${outputPath}`)

    return `Chart saved at: ${outputPath}`
  } catch (error) {
    console.error('Error generating chart:', error)
    return 'Error: Failed to generate chart'
  }
}

// Helper function to generate a color palette
const generateColors = (count: number): string[] => {
  const baseColors = [
    '#FF6384', // Red
    '#36A2EB', // Blue
    '#FFCE56', // Yellow
    '#4BC0C0', // Teal
    '#9966FF', // Purple
    '#FF9F40', // Orange
    '#E7E9ED', // Gray
  ]

  // Repeat colors if there are more labels than base colors
  return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length])
}
