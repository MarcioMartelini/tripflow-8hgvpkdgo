import { Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { Plane, User, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
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

export default function Layout() {
  const { user, signOut, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Minhas Viagens', path: '/trips' },
    { name: 'Documentos', path: '/documents' },
    { name: 'Orçamento', path: '/budget' },
    { name: 'Alertas', path: '/alerts' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 w-full border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <Plane className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">TripFlow</span>
            </Link>

            <nav className="hidden md:flex gap-6">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary relative py-5',
                      isActive ? 'text-primary' : 'text-slate-500',
                    )}
                  >
                    {item.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
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
