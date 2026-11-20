import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '#/components/ui/chart'
import type { ChartConfig } from '#/components/ui/chart'
import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts'

export interface MemberWorkloadItem {
  userId: string
  name: string
  image: string | null
  high: number
  medium: number
  low: number
  total: number
}

// Fixed order High → Medium → Low; colors follow the priority, never the rank.
const config = {
  high: { label: 'High', color: 'var(--chart-priority-high)' },
  medium: { label: 'Medium', color: 'var(--chart-priority-medium)' },
  low: { label: 'Low', color: 'var(--chart-priority-low)' },
} satisfies ChartConfig

const SEGMENTS = ['high', 'medium', 'low'] as const

/** Open tasks per assignee, stacked by priority. */
export function MemberWorkload({
  items,
}: {
  items: Array<MemberWorkloadItem>
}) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No open assigned tasks
      </p>
    )
  }

  // ~36px per member row plus room for the legend.
  const height = items.length * 36 + 48

  return (
    <div>
      <ChartContainer
        config={config}
        className="aspect-auto w-full text-[11px]"
        style={{ height }}
        aria-hidden
      >
        <BarChart
          data={items}
          layout="vertical"
          margin={{ left: 0, right: 32, top: 0, bottom: 0 }}
          barCategoryGap={8}
        >
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={96}
            tickFormatter={(name: string) =>
              name.length > 12 ? `${name.slice(0, 11)}…` : name
            }
          />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
            content={<ChartTooltipContent />}
          />
          {/* Keep series order (High → Medium → Low), not alphabetical. */}
          <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
          {SEGMENTS.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="workload"
              fill={`var(--color-${key})`}
              // 2px surface gap between stacked segments.
              stroke="var(--background)"
              strokeWidth={2}
              radius={i === SEGMENTS.length - 1 ? [0, 2, 2, 0] : 0}
              maxBarSize={20}
              // Static bars so the end-of-bar total always renders.
              isAnimationActive={false}
            >
              {i === SEGMENTS.length - 1 && (
                <LabelList
                  dataKey="total"
                  position="right"
                  className="fill-muted-foreground text-xs tabular-nums"
                />
              )}
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>
      <table className="sr-only">
        <caption>Open tasks per member by priority</caption>
        <thead>
          <tr>
            <th scope="col">Member</th>
            <th scope="col">High</th>
            <th scope="col">Medium</th>
            <th scope="col">Low</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.userId}>
              <th scope="row">{m.name}</th>
              <td>{m.high}</td>
              <td>{m.medium}</td>
              <td>{m.low}</td>
              <td>{m.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
