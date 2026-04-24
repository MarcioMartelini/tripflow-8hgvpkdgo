import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldAlert,
  AlertTriangle,
  Loader2,
  Download,
  Trash2,
  FileText,
  Activity,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import {
  getMyShares,
  revokeShare,
  CompartilhamentoDocumento,
} from '@/services/compartilhamento_documentos'
import { getAuditLogs, LogAuditoria } from '@/services/logs_auditoria'

export default function Privacy() {
  const { signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const [shares, setShares] = useState<CompartilhamentoDocumento[]>([])
  const [logs, setLogs] = useState<LogAuditoria[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [errorData, setErrorData] = useState(false)
  const [logFilter, setLogFilter] = useState('all')

  const fetchData = async () => {
    setIsLoadingData(true)
    setErrorData(false)
    try {
      const [sharesData, logsData] = await Promise.all([getMyShares(), getAuditLogs()])
      setShares(sharesData)
      setLogs(logsData)
    } catch (err) {
      console.error(err)
      setErrorData(true)
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRevoke = async (id: string) => {
    try {
      await revokeShare(id)
      toast({ title: 'Acesso revogado com sucesso.' })
      fetchData()
    } catch (err) {
      toast({ title: 'Erro ao revogar acesso', variant: 'destructive' })
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const data = await pb.send('/backend/v1/users/export-data', {
        method: 'GET',
      })

      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      const dateStr = new Date().toISOString().split('T')[0]
      link.download = `tripflow_dados_${dateStr}.json`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Dados exportados com sucesso!',
        description: 'O download do seu arquivo JSON foi iniciado.',
      })
      fetchData()
    } catch (err: any) {
      toast({
        title: 'Erro ao exportar dados',
        description: err.message || 'Ocorreu um erro ao tentar exportar seus dados.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!password) {
      setError('Senha é obrigatória')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await pb.send('/backend/v1/users/delete-account', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })

      toast({
        title: 'Seus dados foram deletados permanentemente',
        description: 'Sua conta e dados foram excluídos.',
      })

      await signOut()
      navigate('/login')
    } catch (err: any) {
      const fieldErrors = extractFieldErrors(err)
      if (fieldErrors.password) {
        setError(fieldErrors.password)
      } else {
        setError(err.message || 'Erro ao deletar conta. Verifique sua senha.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => logFilter === 'all' || log.acao === logFilter)

  return (
    <div className="container max-w-4xl py-8 animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-primary" />
          Privacidade e Dados
        </h1>
        <p className="text-muted-foreground mt-2">Controle seus dados conforme LGPD.</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Export Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              Exportar Meus Dados
            </CardTitle>
            <CardDescription>Baixe todos os seus dados em formato JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              className="font-semibold bg-blue-600 hover:bg-blue-700"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Dados
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Shared Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Compartilhados
            </CardTitle>
            <CardDescription>
              Gerencie e revogue o acesso a documentos que você compartilhou.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : errorData ? (
              <div className="text-destructive flex items-center gap-2">
                Erro ao carregar{' '}
                <Button variant="link" onClick={fetchData} className="p-0 h-auto">
                  Tentar novamente
                </Button>
              </div>
            ) : shares.length === 0 ? (
              <p className="text-muted-foreground">Você não compartilhou nenhum documento.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Compartilhado com</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shares.map((share) => (
                      <TableRow key={share.id}>
                        <TableCell className="font-medium">
                          {share.expand?.documento_id?.nome_arquivo_original ||
                            share.expand?.documento_id?.nome_arquivo ||
                            'Documento excluído'}
                        </TableCell>
                        <TableCell>
                          {share.expand?.usuario_receptor?.name || 'Usuário desconhecido'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(share.created), "dd 'de' MMM, yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevoke(share.id)}
                          >
                            Revogar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Logs */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Histórico de Atividades
              </CardTitle>
              <CardDescription>Registro de ações relevantes de segurança.</CardDescription>
            </div>
            <Select value={logFilter} onValueChange={setLogFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as atividades</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="compartilhamento_documento">Compartilhamento</SelectItem>
                <SelectItem value="revogacao_compartilhamento">Revogação</SelectItem>
                <SelectItem value="portabilidade_dados">Exportação de Dados</SelectItem>
                <SelectItem value="direito_ao_esquecimento">Deleção de Conta</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : errorData ? (
              <div className="text-destructive flex items-center gap-2">
                Erro ao carregar{' '}
                <Button variant="link" onClick={fetchData} className="p-0 h-auto">
                  Tentar novamente
                </Button>
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma atividade registrada</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Atividade</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="capitalize">{log.acao.replace(/_/g, ' ')}</TableCell>
                        <TableCell className="text-muted-foreground">{log.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Deletar Meus Dados
            </CardTitle>
            <CardDescription className="text-slate-700">
              Ao clicar abaixo, TODOS os seus dados serão deletados permanentemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog
              open={isOpen}
              onOpenChange={(open) => {
                setIsOpen(open)
                if (!open) {
                  setPassword('')
                  setError('')
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="destructive" className="font-semibold">
                  Deletar Todos os Meus Dados
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Tem certeza que deseja deletar TODOS os seus dados?
                  </DialogTitle>
                  <DialogDescription className="text-destructive font-medium pt-2">
                    Esta ação é IRREVERSÍVEL. Todos os seus dados, viagens, documentos, despesas e
                    comentários serão deletados permanentemente.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Digite sua senha para confirmar</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Sua senha"
                      disabled={isLoading}
                    />
                    {error && <p className="text-sm text-destructive mt-1">{error}</p>}
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={isLoading}>
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={!password || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deletando...
                      </>
                    ) : (
                      'Deletar Permanentemente'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Legal Links */}
        <Card>
          <CardHeader>
            <CardTitle>Conformidade Legal</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row">
            <Button variant="outline" className="justify-start text-muted-foreground" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Leia nossa Política de Privacidade Completa
              </a>
            </Button>
            <Button variant="outline" className="justify-start text-muted-foreground" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Leia nossos Termos de Serviço
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
