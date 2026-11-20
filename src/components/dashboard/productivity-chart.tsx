import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '#/components/ui/chart'
import type { ChartConfig } from '#/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

export interface ProductivityPoint {
  date: string
  label: string
  completed: number
}

const config = {
  completed: { label: 'Completed', color: 'var(--chart-series)' },
} satisfies ChartConfig

/** Tasks completed per day. One series, so the card title names it (no legend). */
export function ProductivityChart({
  data,
}: {
  data: Array<ProductivityPoint>
}) {
  const total = data.reduce((sum, d) => sum + d.completed, 0)

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">
          {total}
        </span>{' '}
        completed in the last {data.length} days
      </p>
      {total === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No tasks completed in this period
        </p>
      ) : (
        <ChartContainer
          config={config}
          className="aspect-auto h-48 w-full"
          aria-hidden
        >
          <BarChart data={data} margin={{ left: -20, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey="completed"
              fill="var(--color-completed)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      )}
      {/* Table view for screen readers (the plot itself is aria-hidden). */}
      <table className="sr-only">
        <caption>Tasks completed per day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Completed</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{d.label}</td>
              <td>{d.completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
