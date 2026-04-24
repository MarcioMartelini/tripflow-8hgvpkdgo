import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, AlertTriangle, Loader2, Download } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export default function Privacy() {
  const { signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isExporting, setIsExporting] = useState(false)

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
        title: 'Conta deletada',
        description: 'Seus dados foram deletados permanentemente.',
      })

      signOut()
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

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-primary" />
          Privacidade
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seus dados e preferências de privacidade (LGPD).
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Baixar Meus Dados</h2>
          <p className="text-muted-foreground mb-6">
            Exporte todos os seus dados em formato JSON para usar em outro serviço.
          </p>
          <Button onClick={handleExportData} disabled={isExporting} className="font-semibold">
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
        </div>

        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-destructive mb-2">Deletar Meus Dados</h2>
          <p className="text-slate-700 mb-6">
            Ao clicar abaixo, TODOS os seus dados serão deletados permanentemente. Esta ação não
            pode ser desfeita.
          </p>

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
        </div>
      </div>
    </div>
  )
}
