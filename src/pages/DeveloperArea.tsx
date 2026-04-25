import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings, LayoutTemplate, Database, Save, AlertCircle } from 'lucide-react'
import {
  getConfiguracoes,
  updateConfiguracao,
  getDatabaseStats,
  Configuracao,
} from '@/services/configuracoes'
import { useToast } from '@/hooks/use-toast'

export default function DeveloperArea() {
  const { toast } = useToast()
  const [configs, setConfigs] = useState<Configuracao[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ tripsCount: 0, itinerarioCount: 0, usersCount: 0 })

  // Form States for System Settings
  const [sysName, setSysName] = useState('')
  const [sysEmail, setSysEmail] = useState('')
  const [sysJson, setSysJson] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [confData, statsData] = await Promise.all([getConfiguracoes(), getDatabaseStats()])
      setConfigs(confData)
      setStats(statsData)

      // Initialize form states
      const nameConf = confData.find((c) => c.chave === 'app_nome')
      const emailConf = confData.find((c) => c.chave === 'email_suporte')
      const jsonConf = confData.find((c) => c.chave === 'raw_json_config')

      if (nameConf) setSysName(nameConf.valor)
      if (emailConf) setSysEmail(emailConf.valor)
      if (jsonConf) setSysJson(jsonConf.valor)
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggleConfig = async (chave: string, checked: boolean) => {
    const conf = configs.find((c) => c.chave === chave)
    if (!conf) return

    const newVal = checked ? 'true' : 'false'

    // Optimistic update
    setConfigs((prev) => prev.map((c) => (c.chave === chave ? { ...c, valor: newVal } : c)))

    try {
      await updateConfiguracao(conf.id, newVal)
      toast({ title: 'Configuração atualizada' })
    } catch (error) {
      // Revert on error
      setConfigs((prev) => prev.map((c) => (c.chave === chave ? { ...c, valor: conf.valor } : c)))
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const handleSaveSystemConfig = async () => {
    setIsSaving(true)
    try {
      const nameConf = configs.find((c) => c.chave === 'app_nome')
      const emailConf = configs.find((c) => c.chave === 'email_suporte')
      const jsonConf = configs.find((c) => c.chave === 'raw_json_config')

      const promises = []
      if (nameConf && nameConf.valor !== sysName)
        promises.push(updateConfiguracao(nameConf.id, sysName))
      if (emailConf && emailConf.valor !== sysEmail)
        promises.push(updateConfiguracao(emailConf.id, sysEmail))
      if (jsonConf && jsonConf.valor !== sysJson)
        promises.push(updateConfiguracao(jsonConf.id, sysJson))

      if (promises.length > 0) {
        await Promise.all(promises)
        toast({ title: 'Configurações do sistema salvas com sucesso!' })
        loadData()
      } else {
        toast({ title: 'Nenhuma alteração detectada' })
      }
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro ao salvar configurações', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const getConfigValue = (chave: string) => {
    return configs.find((c) => c.chave === chave)?.valor === 'true'
  }

  if (loading) {
    return (
      <div className="container py-8 max-w-5xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-5xl space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2 bg-slate-900 rounded-md text-white">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Área do Desenvolvedor</h1>
          <p className="text-muted-foreground">
            Gerenciamento de configurações globais e evolução do sistema.
          </p>
        </div>
      </div>

      <Tabs defaultValue="layout" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" /> Ajustes de Layout
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" /> Saúde do Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Relatório de Viagem</CardTitle>
              <CardDescription>
                Controle a visibilidade dos elementos gerados no relatório final.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Mostrar Logo "TripFlow"</Label>
                  <p className="text-sm text-slate-500">
                    Ocultado forçadamente conforme os requisitos do sistema para o cabeçalho de
                    impressão.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-slate-200 text-slate-600">
                    Oculto
                  </Badge>
                  <Switch disabled checked={false} />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="grafico" className="text-base cursor-pointer">
                    Mostrar Gráfico de Orçamento
                  </Label>
                  <p className="text-sm text-slate-500">
                    Exibe o comparativo visual entre planejado e realizado.
                  </p>
                </div>
                <Switch
                  id="grafico"
                  checked={getConfigValue('relatorio_mostrar_grafico')}
                  onCheckedChange={(c) => handleToggleConfig('relatorio_mostrar_grafico', c)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="alerta" className="text-base cursor-pointer">
                    Mostrar Alerta de Gastos
                  </Label>
                  <p className="text-sm text-slate-500">
                    Exibe um aviso em vermelho quando o orçamento é excedido.
                  </p>
                </div>
                <Switch
                  id="alerta"
                  checked={getConfigValue('relatorio_mostrar_alerta')}
                  onCheckedChange={(c) => handleToggleConfig('relatorio_mostrar_alerta', c)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="descricao" className="text-base cursor-pointer">
                    Mostrar Descrição da Viagem
                  </Label>
                  <p className="text-sm text-slate-500">
                    Inclui o bloco de texto livre digitado pelo usuário.
                  </p>
                </div>
                <Switch
                  id="descricao"
                  checked={getConfigValue('relatorio_mostrar_descricao')}
                  onCheckedChange={(c) => handleToggleConfig('relatorio_mostrar_descricao', c)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Globais</CardTitle>
                  <CardDescription>
                    Metadados da aplicação e variáveis de ambiente em tempo de execução.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sysName">Nome da Aplicação</Label>
                    <Input
                      id="sysName"
                      value={sysName}
                      onChange={(e) => setSysName(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="sysEmail">E-mail de Suporte</Label>
                    <Input
                      id="sysEmail"
                      type="email"
                      value={sysEmail}
                      onChange={(e) => setSysEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2 pt-4">
                    <Label htmlFor="sysJson">Configurações Avançadas (JSON)</Label>
                    <Textarea
                      id="sysJson"
                      className="font-mono text-sm h-32"
                      value={sysJson}
                      onChange={(e) => setSysJson(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-end py-4">
                  <Button onClick={handleSaveSystemConfig} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feature Toggles</CardTitle>
                  <CardDescription>Ative ou desative módulos completos do sistema.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <Label htmlFor="offline" className="text-base cursor-pointer">
                        Sincronização Offline
                      </Label>
                      <p className="text-sm text-slate-500">
                        Habilita filas locais e WebWorkers (Requer reload).
                      </p>
                    </div>
                    <Switch
                      id="offline"
                      checked={getConfigValue('feature_offline_sync')}
                      onCheckedChange={(c) => handleToggleConfig('feature_offline_sync', c)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="maintenance"
                        className="text-base cursor-pointer flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 text-orange-600" /> Modo de Manutenção
                      </Label>
                      <p className="text-sm text-orange-700">
                        Bloqueia o acesso a novos logins e exibe tela de manutenção.
                      </p>
                    </div>
                    <Switch
                      id="maintenance"
                      checked={getConfigValue('modo_manutencao')}
                      onCheckedChange={(c) => handleToggleConfig('modo_manutencao', c)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas do Banco</CardTitle>
                  <CardDescription>Métricas em tempo real</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Usuários</span>
                    <span className="font-bold">{stats.usersCount}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Viagens Criadas</span>
                    <span className="font-bold">{stats.tripsCount}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">
                      Eventos de Itinerário
                    </span>
                    <span className="font-bold">{stats.itinerarioCount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
