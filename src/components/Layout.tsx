import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { User, LogOut, Bell } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NewTripDialog } from './NewTripDialog'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import logoUrl from '@/assets/design-sem-nome-314e3.png'

export default function Layout() {
  const { user, signOut, loading } = useAuth()
  const location = useLocation()
  const { toast } = useToast()
  const [unreadAlerts, setUnreadAlerts] = useState(0)

  useEffect(() => {
    if (user) {
      pb.collection('alertas')
        .getList(1, 1, { filter: `usuario_id = "${user.id}" && lido = false` })
        .then((res) => setUnreadAlerts(res.totalItems))
        .catch(() => {})
    }
  }, [user])

  useRealtime('alertas', (e) => {
    if (!user) return
    if (e.action === 'create' && e.record.usuario_id === user.id) {
      if (!e.record.lido) setUnreadAlerts((prev) => prev + 1)
      toast({
        title: 'Novo Alerta',
        description: e.record.mensagem,
        duration: 5000,
        action: <ToastAction altText="Fechar">Fechar</ToastAction>,
      })
    } else if (e.action === 'update' && e.record.usuario_id === user.id) {
      pb.collection('alertas')
        .getList(1, 1, { filter: `usuario_id = "${user.id}" && lido = false` })
        .then((res) => setUnreadAlerts(res.totalItems))
        .catch(() => {})
    } else if (e.action === 'delete' && e.record.usuario_id === user.id) {
      pb.collection('alertas')
        .getList(1, 1, { filter: `usuario_id = "${user.id}" && lido = false` })
        .then((res) => setUnreadAlerts(res.totalItems))
        .catch(() => {})
    }
  })

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  const tripMatch = location.pathname.match(
    /\/(?:trips|documents|orcamento|alerts)\/([a-zA-Z0-9_-]+)/,
  )
  const activeTripId = tripMatch ? tripMatch[1] : ''

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Minhas Viagens', path: '/trips' },
    { name: 'Documentos', path: activeTripId ? `/documents/${activeTripId}` : '/documents' },
    { name: 'Orçamento', path: activeTripId ? `/orcamento/${activeTripId}` : '/trips' },
    { name: 'Alertas', path: '/alerts' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 w-full border-b bg-white shadow-sm">
        <div className="container flex h-20 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoUrl} alt="TripFlow Logo" className="h-12 object-contain" />
            </Link>

            <nav className="hidden md:flex gap-6">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.path &&
                  !(item.name === 'Orçamento' && item.path === '/trips')
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary relative py-7 flex items-center gap-1.5',
                      isActive ? 'text-primary' : 'text-slate-500',
                    )}
                  >
                    {item.name === 'Alertas' && <Bell className="h-4 w-4" />}
                    {item.name}
                    {item.name === 'Alertas' && unreadAlerts > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {unreadAlerts}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/alerts"
              className="relative p-2 text-slate-500 hover:text-primary transition-colors md:hidden"
            >
              <Bell className="h-5 w-5" />
              {unreadAlerts > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadAlerts}
                </span>
              )}
            </Link>
            <NewTripDialog />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
