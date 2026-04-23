import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Plane } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [email, setEmail] = useState('marcio_martelini@hotmail.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (!error) {
      navigate('/')
    } else {
      toast({
        title: 'Erro de Autenticação',
        description: 'Credenciais inválidas.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="flex items-center gap-2 mb-8 animate-fade-in-down">
        <Plane className="h-8 w-8 text-primary" />
        <span className="text-3xl font-bold text-primary">TripFlow</span>
      </div>
      <Card className="w-full max-w-md shadow-lg animate-fade-in-up">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
          <CardDescription>Entre com sua conta para acessar o painel</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
