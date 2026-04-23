import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/currency'
import { CategoryData } from '@/lib/budget-utils'
import { AlertTriangle } from 'lucide-react'
import { Trip } from '@/services/trips'
import { differenceInDays, parseISO, isAfter } from 'date-fns'

interface Props {
  data: CategoryData[]
  baseCurrency: string
  trip: Trip
}

export function SummaryCards({ data, baseCurrency, trip }: Props) {
  const totalPlanned = data.reduce((acc, curr) => acc + curr.planned, 0)
  const totalRealized = data.reduce((acc, curr) => acc + curr.realized, 0)
  const diff = totalPlanned - totalRealized

  const start = parseISO(trip.start_date)
  const end = parseISO(trip.end_date)
  const today = new Date()

  const tripDuration = Math.max(1, differenceInDays(end, start) + 1)

  let daysElapsed = 1
  let remainingDays = tripDuration

  if (isAfter(today, end)) {
    daysElapsed = tripDuration
    remainingDays = 0
  } else if (isAfter(today, start)) {
    daysElapsed = differenceInDays(today, start) + 1
    remainingDays = tripDuration - daysElapsed
  }

  const averageDailyExpense = totalRealized / daysElapsed
  const forecast = totalRealized + averageDailyExpense * remainingDays

  const percentRealized = totalPlanned > 0 ? (totalRealized / totalPlanned) * 100 : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Orçamento Planejado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalPlanned, baseCurrency)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Despesas Realizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(totalRealized, baseCurrency)}
          </div>
          <p className="text-xs font-medium mt-1 text-slate-500">
            {percentRealized.toFixed(1)}% do planejado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo Restante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(diff, baseCurrency)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Previsão Final
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div
              className={`text-2xl font-bold ${forecast > totalPlanned ? 'text-orange-500' : 'text-slate-900'}`}
            >
              {formatCurrency(forecast, baseCurrency)}
            </div>
            {forecast > totalPlanned && (
              <AlertTriangle className="h-5 w-5 text-orange-500 animate-pulse" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
