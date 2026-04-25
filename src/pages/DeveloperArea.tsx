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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Settings,
  LayoutTemplate,
  Database,
  Save,
  AlertTriangle,
  ShieldAlert,
  WifiOff,
  FileText,
  DollarSign,
  Eye,
} from 'lucide-react'
import {
  getConfiguracoes,
  updateConfiguracao,
  createConfiguracao,
  getDatabaseStats,
  Configuracao,
} from '@/services/configuracoes'
import { getTrips } from '@/services/trips'
import { useToast } from '@/hooks/use-toast'
import TripReport from '@/pages/TripReport'

export default function DeveloperArea() {
  const { toast } = useToast()
  const [configs, setConfigs] = useState<Configuracao[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ tripsCount: 0, itinerarioCount: 0, usersCount: 0 })

  const [sysName, setSysName] = useState('')
  const [sysEmail, setSysEmail] = useState('')
  const [sysJson, setSysJson] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [previewTripId, setPreviewTripId] = useState<string | undefined>()

  const [activePreset, setActivePreset] = useState('preset_detalhado')
  const [presetCompacto, setPresetCompacto] = useState('')
  const [presetExecutivo, setPresetExecutivo] = useState('')
  const [presetDetalhado, setPresetDetalhado] = useState('')
  const [isSavingPresets, setIsSavingPresets] = useState(false)

  const defaultPresets = {
    compacto: {
      margin_top: 10,
      margin_bottom: 10,
      margin_left: 10,
      margin_right: 10,
      font_size: 'text-xs',
      show_charts: false,
      show_notes: false,
      show_alerts: false,
      page_break: false,
      name: 'Compacto',
    },
    executivo: {
      margin_top: 25,
      margin_bottom: 25,
      margin_left: 25,
      margin_right: 25,
      font_size: 'text-base',
      show_charts: true,
      show_notes: false,
      show_alerts: true,
      page_break: true,
      name: 'Executivo',
    },
    detalhado: {
      margin_top: 20,
      margin_bottom: 20,
      margin_left: 20,
      margin_right: 20,
      font_size: 'text-sm',
      show_charts: true,
      show_notes: true,
      show_alerts: true,
      page_break: false,
      name: 'Detalhado',
    },
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [confData, statsData, tripsData] = await Promise.all([
        getConfiguracoes(),
        getDatabaseStats(),
        getTrips(),
      ])
      setConfigs(confData)
      setStats(statsData)
      if (tripsData && tripsData.length > 0) {
        setPreviewTripId(tripsData[0].id)
      }

      const nameConf = confData.find((c) => c.chave === 'app_nome')
      const emailConf = confData.find((c) => c.chave === 'email_suporte')
      const jsonConf = confData.find((c) => c.chave === 'raw_json_config')
      if (nameConf) setSysName(nameConf.valor)
      if (emailConf) setSysEmail(emailConf.valor)
      if (jsonConf) setSysJson(jsonConf.valor)

      const activeConf = confData.find((c) => c.chave === 'active_report_preset')
      if (activeConf) setActivePreset(activeConf.valor)

      const compConf = confData.find((c) => c.chave === 'preset_compacto')
      setPresetCompacto(
        compConf ? compConf.valor : JSON.stringify(defaultPresets.compacto, null, 2),
      )

      const execConf = confData.find((c) => c.chave === 'preset_executivo')
      setPresetExecutivo(
        execConf ? execConf.valor : JSON.stringify(defaultPresets.executivo, null, 2),
      )

      const detConf = confData.find((c) => c.chave === 'preset_detalhado')
      setPresetDetalhado(
        detConf ? detConf.valor : JSON.stringify(defaultPresets.detalhado, null, 2),
      )
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
    handleUpdateConfigString(chave, checked ? 'true' : 'false')
  }

  const handleUpdateConfigString = async (chave: string, valor: string) => {
    const conf = configs.find((c) => c.chave === chave)
    setConfigs((prev) => {
      if (conf) return prev.map((c) => (c.chave === chave ? { ...c, valor } : c))
      return [...prev, { id: 'temp', chave, valor, descricao: '', created: '', updated: '' }]
    })
    try {
      if (conf) {
        await updateConfiguracao(conf.id, valor)
      } else {
        await createConfiguracao(chave, valor)
        loadData()
      }
      toast({ title: 'Configuração atualizada' })
    } catch (error) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
      loadData()
    }
  }

  const handleSavePresets = async () => {
    setIsSavingPresets(true)
    try {
      JSON.parse(presetCompacto)
      JSON.parse(presetExecutivo)
      JSON.parse(presetDetalhado)

      const saveConf = async (chave: string, valor: string, desc: string) => {
        const conf = configs.find((c) => c.chave === chave)
        if (conf) return updateConfiguracao(conf.id, valor)
        return createConfiguracao(chave, valor, desc)
      }

      await Promise.all([
        saveConf('active_report_preset', activePreset, 'Preset ativo do relatorio'),
        saveConf('preset_compacto', presetCompacto, 'Configuração do preset Compacto'),
        saveConf('preset_executivo', presetExecutivo, 'Configuração do preset Executivo'),
        saveConf('preset_detalhado', presetDetalhado, 'Configuração do preset Detalhado'),
      ])

      toast({ title: 'Presets salvos com sucesso!' })
      loadData()
    } catch (error) {
      console.error(error)
      toast({ title: 'JSON Inválido ou erro ao salvar', variant: 'destructive' })
    } finally {
      setIsSavingPresets(false)
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

  const getConfigValue = (chave: string, defaultValue: boolean = false) => {
    const conf = configs.find((c) => c.chave === chave)
    return conf ? conf.valor === 'true' : defaultValue
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
              <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Presets de Layout</Label>
                  <p className="text-sm text-slate-500">
                    Defina os presets e ajuste as margens (mm), fontes e visibilidade para
                    exportação de PDFs.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 font-semibold">
                    Preset Ativo Padrão
                  </Label>
                  <Select value={activePreset} onValueChange={setActivePreset}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preset_compacto">Compacto</SelectItem>
                      <SelectItem value="preset_executivo">Executivo</SelectItem>
                      <SelectItem value="preset_detalhado">Detalhado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs text-slate-500 font-semibold">Definições JSON</Label>
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    <AccordionItem value="compacto" className="bg-slate-50 border rounded-lg px-4">
                      <AccordionTrigger className="text-sm hover:no-underline">
                        Preset Compacto
                      </AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          className="font-mono text-xs h-48 bg-white"
                          value={presetCompacto}
                          onChange={(e) => setPresetCompacto(e.target.value)}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="executivo" className="bg-slate-50 border rounded-lg px-4">
                      <AccordionTrigger className="text-sm hover:no-underline">
                        Preset Executivo
                      </AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          className="font-mono text-xs h-48 bg-white"
                          value={presetExecutivo}
                          onChange={(e) => setPresetExecutivo(e.target.value)}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="detalhado" className="bg-slate-50 border rounded-lg px-4">
                      <AccordionTrigger className="text-sm hover:no-underline">
                        Preset Detalhado
                      </AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          className="font-mono text-xs h-48 bg-white"
                          value={presetDetalhado}
                          onChange={(e) => setPresetDetalhado(e.target.value)}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                <Button
                  onClick={handleSavePresets}
                  disabled={isSavingPresets}
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingPresets ? 'Salvando...' : 'Salvar Presets'}
                </Button>
              </div>

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

              <div className="pt-4 flex justify-end">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Visualizar Preview do Relatório
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[90vw] w-[1000px] h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2 border-b shrink-0 bg-white">
                      <DialogTitle>Preview do Relatório</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                      <div
                        className="max-w-[1024px] mx-auto bg-white shadow-lg border relative rounded-xl"
                        style={{ overflow: 'hidden' }}
                      >
                        <TripReport
                          tripId={previewTripId}
                          isPreview={true}
                          previewConfigMap={{
                            ...configs.reduce(
                              (acc, c) => ({ ...acc, [c.chave]: c.valor }),
                              {} as Record<string, string>,
                            ),
                            active_report_preset: activePreset,
                            preset_compacto: presetCompacto,
                            preset_executivo: presetExecutivo,
                            preset_detalhado: presetDetalhado,
                          }}
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                      <Label
                        htmlFor="modulo_despesas"
                        className="text-base cursor-pointer flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4 text-slate-500" /> Módulo de Despesas
                      </Label>
                      <p className="text-sm text-slate-500">
                        Habilita o controle financeiro e orçamento.
                      </p>
                    </div>
                    <Switch
                      id="modulo_despesas"
                      checked={getConfigValue('modulo_despesas', true)}
                      onCheckedChange={(c) => handleToggleConfig('modulo_despesas', c)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="modulo_documentos"
                        className="text-base cursor-pointer flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4 text-slate-500" /> Módulo de Documentos
                      </Label>
                      <p className="text-sm text-slate-500">
                        Permite anexar arquivos e gerenciar validades.
                      </p>
                    </div>
                    <Switch
                      id="modulo_documentos"
                      checked={getConfigValue('modulo_documentos', true)}
                      onCheckedChange={(c) => handleToggleConfig('modulo_documentos', c)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="offline"
                        className="text-base cursor-pointer flex items-center gap-2"
                      >
                        <WifiOff className="h-4 w-4 text-slate-500" /> Sincronização Offline
                      </Label>
                      <p className="text-sm text-slate-500">
                        Habilita filas locais e WebWorkers (Requer reload).
                      </p>
                    </div>
                    <Switch
                      id="offline"
                      checked={getConfigValue('feature_offline_sync', true)}
                      onCheckedChange={(c) => handleToggleConfig('feature_offline_sync', c)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="maintenance"
                        className="text-base cursor-pointer flex items-center gap-2"
                      >
                        <ShieldAlert className="h-4 w-4 text-orange-600" /> Modo de Manutenção
                      </Label>
                      <p className="text-sm text-orange-700">
                        Bloqueia o acesso a novos logins e exibe tela de manutenção.
                      </p>
                    </div>
                    <Switch
                      id="maintenance"
                      checked={getConfigValue('modo_manutencao', false)}
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
