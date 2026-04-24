import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Conflito {
  id: string
  tipo: string
  dados_originais: any
  dados_conflitantes: any
  data_conflito: string
  resolvido: boolean
}

interface SyncLog {
  id: string
  tipo: string
  acao: string
  dados: string
  sincronizado: boolean
  sincronizado_em?: string
  created: string
}

export default function SyncHistory() {
  const { user } = useAuth()
  const [conflitos, setConflitos] = useState<Conflito[]>([])
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user) return
    try {
      const c = await pb.collection('conflitos_offline').getFullList<Conflito>({
        filter: `usuario_id = "${user.id}"`,
        sort: '-data_conflito',
      })
      setConflitos(c)
      const l = await pb.collection('sincronizacao_offline').getFullList<SyncLog>({
        filter: `usuario_id = "${user.id}"`,
        sort: '-created',
      })
      setLogs(l)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const resolverConflito = async (id: string) => {
    await pb.collection('conflitos_offline').update(id, { resolvido: true })
    loadData()
  }

  return (
    <div className="container max-w-5xl py-8 px-4 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2">Histórico de Sincronização</h1>
      <p className="text-slate-500 mb-8">
        Gerencie os conflitos e visualize o registro de sincronizações com a nuvem.
      </p>

      <Tabs defaultValue="conflitos">
        <TabsList className="mb-4">
          <TabsTrigger value="conflitos">
            Conflitos ({conflitos.filter((c) => !c.resolvido).length})
          </TabsTrigger>
          <TabsTrigger value="logs">Registro de Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="conflitos" className="space-y-4">
          {conflitos.length === 0 && !loading ? (
            <div className="text-center py-12 text-slate-500 border rounded-lg bg-slate-50">
              Nenhum conflito registrado.
            </div>
          ) : (
            conflitos.map((c) => (
              <Card key={c.id} className={c.resolvido ? 'opacity-60 transition-opacity' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle
                          className={`w-5 h-5 ${c.resolvido ? 'text-slate-400' : 'text-amber-500'}`}
                        />
                        Conflito em {c.tipo}
                      </CardTitle>
                      <CardDescription>
                        Detectado em{' '}
                        {format(new Date(c.data_conflito), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </CardDescription>
                    </div>
                    {!c.resolvido && (
                      <Button variant="outline" size="sm" onClick={() => resolverConflito(c.id)}>
                        Marcar como Resolvido
                      </Button>
                    )}
                    {c.resolvido && (
                      <span className="flex items-center text-sm text-green-600 font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" /> Resolvido
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <div className="bg-slate-50 p-4 rounded-md border text-sm">
                      <p className="font-semibold mb-2 text-slate-700">Versão Servidor (Mantida)</p>
                      <pre className="whitespace-pre-wrap overflow-x-auto text-xs text-slate-600">
                        {JSON.stringify(c.dados_originais, null, 2)}
                      </pre>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-md border border-amber-100 text-sm">
                      <p className="font-semibold mb-2 text-amber-800">Sua Edição (Descartada)</p>
                      <pre className="whitespace-pre-wrap overflow-x-auto text-xs text-amber-700">
                        {JSON.stringify(c.dados_conflitantes, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-slate-600">Status</th>
                    <th className="p-4 font-semibold text-slate-600">Data</th>
                    <th className="p-4 font-semibold text-slate-600">Tipo</th>
                    <th className="p-4 font-semibold text-slate-600">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  ) : (
                    logs.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          {l.sincronizado ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Sincronizado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600 whitespace-nowrap">
                          {format(new Date(l.created), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </td>
                        <td className="p-4 capitalize text-slate-700 font-medium">{l.tipo}</td>
                        <td className="p-4 capitalize text-slate-600">{l.acao}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
