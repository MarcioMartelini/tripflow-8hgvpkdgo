import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CategoryData } from '@/lib/budget-utils'
import { formatCurrency } from '@/lib/currency'
import { createOrcamento, updateOrcamento } from '@/services/finances'
import { useToast } from '@/hooks/use-toast'

interface Props {
  data: CategoryData[]
  baseCurrency: string
  tripId: string
  onReload: () => void
}

export function PlanningTable({ data, baseCurrency, tripId, onReload }: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    const initial: Record<string, string> = {}
    data.forEach((d) => {
      initial[d.category] = d.originalPlannedValue > 0 ? d.originalPlannedValue.toString() : ''
    })
    setInputs(initial)
  }, [data])

  const handleInputChange = (cat: string, val: string) => {
    setInputs((prev) => ({ ...prev, [cat]: val }))
  }

  const handleBlur = async (row: CategoryData) => {
    const val = inputs[row.category] || '0'
    const newVal = parseFloat(val)

    if (isNaN(newVal) || newVal < 0) {
      toast({
        title: 'Valor inválido',
        description: 'Os valores devem ser maiores ou iguais a zero.',
        variant: 'destructive',
      })
      return
    }

    // Only update if changed
    if (newVal === row.originalPlannedValue) return

    try {
      if (row.orcamentoId) {
        await updateOrcamento(row.orcamentoId, { valor_planejado: newVal, moeda: baseCurrency })
      } else {
        await createOrcamento({
          viagem_id: tripId,
          categoria: row.category,
          valor_planejado: newVal,
          moeda: baseCurrency,
        })
      }
      onReload()
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o orçamento.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="p-0">
        <div className="min-w-[600px]">
          <div className="flex items-center py-3 px-6 gap-4 bg-slate-100 border-b border-slate-200 font-semibold text-slate-700 text-sm">
            <div className="w-1/4">Título das Categorias</div>
            <div className="w-1/4">Valor Planejado</div>
            <div className="w-1/4">Valor Executado</div>
            <div className="w-1/4">Percentual</div>
          </div>
          {data.map((row, i) => (
            <div
              key={row.category}
              className={`flex items-center py-4 px-6 gap-4 hover:bg-slate-50 transition-colors ${
                i !== data.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <div className="w-1/4 font-semibold text-slate-800 capitalize">{row.category}</div>
              <div className="w-1/4">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={inputs[row.category] ?? ''}
                  onChange={(e) => handleInputChange(row.category, e.target.value)}
                  onBlur={() => handleBlur(row)}
                  className="w-full max-w-[140px] bg-white border-slate-200"
                />
              </div>
              <div className="w-1/4 text-slate-700 font-medium">
                {formatCurrency(row.realized, baseCurrency)}
              </div>
              <div
                className={`w-1/4 font-bold ${
                  row.planned > 0
                    ? row.percent > 100
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                    : 'text-slate-600'
                }`}
              >
                {row.planned > 0 ? `${row.percent.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
