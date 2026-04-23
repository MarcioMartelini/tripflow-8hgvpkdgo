import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { CategoryData } from '@/lib/budget-utils'
import { formatCurrency } from '@/lib/currency'

const chartConfig = {
  planned: { label: 'Planejado', color: '#3b82f6' },
  realized: { label: 'Realizado', color: '#22c55e' },
}

interface Props {
  data: CategoryData[]
  baseCurrency: string
}

export function ComparativeChart({ data, baseCurrency }: Props) {
  const hasData = data.some((d) => d.planned > 0 || d.realized > 0)

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Planejado vs Realizado</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
            Nenhuma despesa registrada
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} className="capitalize" />
              <YAxis
                tickFormatter={(val) => formatCurrency(val, baseCurrency).replace(/,00$/, '')}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(value as number, baseCurrency)}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="planned" fill="var(--color-planned)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realized" fill="var(--color-realized)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
