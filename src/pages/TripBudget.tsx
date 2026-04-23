import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getTrip, Trip } from '@/services/trips'
import {
  getOrcamentos,
  getDespesas,
  createOrcamento,
  createDespesa,
  deleteDespesa,
  OrcamentoPlanejado,
  Despesa,
} from '@/services/finances'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, parseISO, isValid } from 'date-fns'
import { ArrowLeft, Banknote, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react'

const CATEGORIAS = ['hospedagem', 'transporte', 'alimentação', 'atividades', 'compras', 'outro']
const MOEDAS = ['BRL', 'USD', 'EUR', 'GBP', 'AUD']

export default function TripBudget() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [orcamentos, setOrcamentos] = useState<OrcamentoPlanejado[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)

  const [openOrcamentoModal, setOpenOrcamentoModal] = useState(false)
  const [openDespesaModal, setOpenDespesaModal] = useState(false)

  const [oForm, setOForm] = useState({ categoria: '', valor_planejado: '', moeda: 'BRL' })
  const [dForm, setDForm] = useState({
    categoria: '',
    descricao: '',
    valor: '',
    moeda: 'BRL',
    data_despesa: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    if (!tripId) return
    try {
      const [tripData, oData, dData] = await Promise.all([
        getTrip(tripId),
        getOrcamentos(tripId),
        getDespesas(tripId),
      ])
      setTrip(tripData)
      setOrcamentos(oData)
      setDespesas(dData)
    } catch (err) {
      toast({ title: 'Erro ao carregar orçamento', variant: 'destructive' })
      navigate(`/trips/${tripId}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [tripId])

  useRealtime('orcamento_planejado', () => loadData())
  useRealtime('despesas', () => loadData())

  const handleSaveOrcamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tripId) return
    setIsSubmitting(true)
    try {
      await createOrcamento({
        viagem_id: tripId,
        categoria: oForm.categoria,
        valor_planejado: parseFloat(oForm.valor_planejado),
        moeda: oForm.moeda,
      })
      toast({ title: 'Orçamento planejado salvo!' })
      setOpenOrcamentoModal(false)
      setOForm({ categoria: '', valor_planejado: '', moeda: 'BRL' })
    } catch (err) {
      toast({ title: 'Erro ao salvar orçamento', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDespesa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tripId || !user) return
    setIsSubmitting(true)
    try {
      await createDespesa({
        viagem_id: tripId,
        usuario_id: user.id,
        categoria: dForm.categoria,
        descricao: dForm.descricao,
        valor: parseFloat(dForm.valor),
        moeda: dForm.moeda,
        data_despesa: dForm.data_despesa
          ? new Date(dForm.data_despesa).toISOString()
          : new Date().toISOString(),
      })
      toast({ title: 'Despesa registrada!' })
      setOpenDespesaModal(false)
      setDForm({ categoria: '', descricao: '', valor: '', moeda: 'BRL', data_despesa: '' })
    } catch (err) {
      toast({ title: 'Erro ao registrar despesa', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDespesa = async (id: string) => {
    try {
      await deleteDespesa(id)
      toast({ title: 'Despesa removida' })
    } catch (err) {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  const formatCurrency = (val: number, cur: string) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cur }).format(val)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, 'dd/MM/yyyy') : ''
  }

  if (loading || !trip) {
    return (
      <div className="container py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const categoriesData = CATEGORIAS.map((cat) => {
    const planned = orcamentos
      .filter((o) => o.categoria === cat)
      .reduce((acc, curr) => acc + curr.valor_planejado, 0)
    const actual = despesas
      .filter((d) => d.categoria === cat)
      .reduce((acc, curr) => acc + curr.valor, 0)
    return { category: cat, planned, actual, diff: planned - actual }
  })

  const totalPlanned = categoriesData.reduce((acc, curr) => acc + curr.planned, 0)
  const totalActual = categoriesData.reduce((acc, curr) => acc + curr.actual, 0)

  return (
    <div className="container py-8 px-4 animate-fade-in space-y-8">
      <div>
        <Button variant="ghost" className="mb-4 -ml-4 text-slate-500" asChild>
          <Link to={`/trips/${tripId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Viagem
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Orçamento e Despesas</h1>
            <p className="text-slate-500">{trip.title}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={openOrcamentoModal} onOpenChange={setOpenOrcamentoModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Banknote className="h-4 w-4" /> Planejar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Planejar Orçamento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveOrcamento} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select required onValueChange={(v) => setOForm({ ...oForm, categoria: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map((c) => (
                          <SelectItem key={c} value={c} className="capitalize">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={oForm.valor_planejado}
                        onChange={(e) => setOForm({ ...oForm, valor_planejado: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Moeda</Label>
                      <Select
                        value={oForm.moeda}
                        onValueChange={(v) => setOForm({ ...oForm, moeda: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MOEDAS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    Salvar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={openDespesaModal} onOpenChange={setOpenDespesaModal}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Despesa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveDespesa} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      required
                      value={dForm.descricao}
                      onChange={(e) => setDForm({ ...dForm, descricao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select required onValueChange={(v) => setDForm({ ...dForm, categoria: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map((c) => (
                          <SelectItem key={c} value={c} className="capitalize">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={dForm.valor}
                        onChange={(e) => setDForm({ ...dForm, valor: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Moeda</Label>
                      <Select
                        value={dForm.moeda}
                        onValueChange={(v) => setDForm({ ...dForm, moeda: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MOEDAS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      required
                      value={dForm.data_despesa}
                      onChange={(e) => setDForm({ ...dForm, data_despesa: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    Registrar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-50 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Planejado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalPlanned, 'BRL')}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalActual, 'BRL')}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Saldo Restante</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${totalPlanned - totalActual < 0 ? 'text-red-500' : 'text-green-600'}`}
            >
              {formatCurrency(totalPlanned - totalActual, 'BRL')}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Resumo por Categoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesData
            .filter((c) => c.planned > 0 || c.actual > 0)
            .map((cat) => (
              <Card key={cat.category}>
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize text-slate-700">{cat.category}</span>
                    {cat.diff < 0 ? (
                      <span className="flex items-center text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
                        <TrendingUp className="w-3 h-3 mr-1" /> Estourou
                      </span>
                    ) : (
                      <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                        <TrendingDown className="w-3 h-3 mr-1" /> No limite
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-slate-500">Planejado:</span>
                    <span className="font-medium">{formatCurrency(cat.planned, 'BRL')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Gasto:</span>
                    <span className="font-medium">{formatCurrency(cat.actual, 'BRL')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full ${cat.actual > cat.planned ? 'bg-red-500' : 'bg-primary'}`}
                      style={{
                        width: `${Math.min((cat.actual / (cat.planned || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          {categoriesData.filter((c) => c.planned > 0 || c.actual > 0).length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500 border border-dashed rounded-lg">
              Nenhum dado financeiro registrado para esta viagem.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Histórico de Despesas</h2>
        <div className="bg-white border rounded-lg overflow-hidden">
          {despesas.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Nenhuma despesa registrada.</div>
          ) : (
            <div className="divide-y">
              {despesas.map((d) => (
                <div
                  key={d.id}
                  className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group"
                >
                  <div>
                    <div className="font-medium text-slate-900">{d.descricao}</div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="capitalize px-2 py-0.5 bg-slate-100 rounded-md">
                        {d.categoria}
                      </span>
                      <span>{formatDate(d.data_despesa)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{formatCurrency(d.valor, d.moeda)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteDespesa(d.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
