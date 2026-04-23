import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    const initial: Record<string, string> = {}
    data.forEach((d) => {
      initial[d.category] = d.originalPlannedValue > 0 ? d.originalPlannedValue.toString() : ''
    })
    setInputs(initial)
    setIsDirty(false)
  }, [data])

  const handleInputChange = (cat: string, val: string) => {
    setInputs((prev) => ({ ...prev, [cat]: val }))
    setIsDirty(true)
    setErrorMsg('')
  }

  const handleSave = async () => {
    setSaving(true)
    setErrorMsg('')
    try {
      for (const d of data) {
        const newVal = parseFloat(inputs[d.category] || '0')
        if (isNaN(newVal) || newVal < 0) {
          setErrorMsg('Os valores planejados devem ser maiores ou iguais a zero.')
          setSaving(false)
          return
        }

        if (newVal !== d.originalPlannedValue || (newVal > 0 && !d.orcamentoId)) {
          if (d.orcamentoId) {
            await updateOrcamento(d.orcamentoId, { valor_planejado: newVal, moeda: baseCurrency })
          } else {
            await createOrcamento({
              viagem_id: tripId,
              categoria: d.category,
              valor_planejado: newVal,
              moeda: baseCurrency,
            })
          }
        }
      }
      toast({ title: 'Orçamento atualizado com sucesso!' })
      setIsDirty(false)
      onReload()
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Verifique se os valores são válidos',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>Planejamento por Categoria</CardTitle>
          {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
        </div>
        {isDirty && (
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor Planejado ({baseCurrency})</TableHead>
              <TableHead>Realizado</TableHead>
              <TableHead>Diferença</TableHead>
              <TableHead>% Consumido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.category}>
                <TableCell className="capitalize font-medium">{row.category}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={inputs[row.category] ?? ''}
                    onChange={(e) => handleInputChange(row.category, e.target.value)}
                    className="w-32"
                  />
                </TableCell>
                <TableCell>{formatCurrency(row.realized, baseCurrency)}</TableCell>
                <TableCell
                  className={
                    row.diff >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                  }
                >
                  {formatCurrency(row.diff, baseCurrency)}
                </TableCell>
                <TableCell>{row.percent.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
