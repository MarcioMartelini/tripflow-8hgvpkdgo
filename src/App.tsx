/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Trips from './pages/Trips'
import TripDetails from './pages/TripDetails'
import TripItinerary from './pages/TripItinerary'
import TripDocuments from './pages/TripDocuments'
import TripTicketsReservations from './pages/TripTicketsReservations'
import TripBudget from './pages/TripBudget'
import Documents from './pages/Documents'
import Alerts from './pages/Alerts'
import TripReport from './pages/TripReport'
import SyncHistory from './pages/SyncHistory'
import { AuthProvider } from './hooks/use-auth'

const Generic = ({ title }: { title: string }) => (
  <div className="container py-12 flex flex-col items-center justify-center animate-fade-in">
    <h1 className="text-3xl font-bold mb-4">{title}</h1>
    <p className="text-muted-foreground">Página em construção.</p>
  </div>
)

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/trips/:id" element={<TripDetails />} />
            <Route path="/trips/:id/itinerary" element={<TripItinerary />} />
            <Route path="/trips/:tripId/tickets-reservas" element={<TripTicketsReservations />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/documents/:tripId" element={<TripDocuments />} />
            <Route path="/orcamento/:tripId" element={<TripBudget />} />
            <Route path="/trips/:id/report" element={<TripReport />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings/sync-history" element={<SyncHistory />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
