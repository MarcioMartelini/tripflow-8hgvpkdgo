import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { getTrips, type Trip } from '@/services/trips'
import { MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SelectTripDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setLoading(true)
      getTrips()
        .then((data) => setTrips(data))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open])

  const handleCreateNewTrip = () => {
    onOpenChange(false)
    // Find and click the "Nova Viagem" button in the top navigation bar to trigger its specific flow
    const btn = Array.from(document.querySelectorAll('button')).find((el) =>
      el.textContent?.includes('Nova Viagem'),
    )
    if (btn) {
      btn.click()
    } else {
      navigate('/trips')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Selecionar Viagem</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando viagens...</div>
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Você ainda não possui viagens cadastradas.
            </p>
            <Button onClick={handleCreateNewTrip}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Nova Viagem
            </Button>
          </div>
        ) : (
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Buscar viagem..." />
            <CommandList>
              <CommandEmpty>Nenhuma viagem encontrada.</CommandEmpty>
              <CommandGroup>
                {trips.map((trip) => (
                  <CommandItem
                    key={trip.id}
                    value={`${trip.title || trip.nome} ${trip.destination || trip.destino}`}
                    onSelect={() => {
                      onOpenChange(false)
                      navigate(`/orcamento/${trip.id}`)
                    }}
                    className="cursor-pointer flex flex-col items-start p-3 py-3 border-b last:border-0"
                  >
                    <span className="font-medium text-sm">{trip.title || trip.nome}</span>
                    <span className="text-xs text-muted-foreground flex items-center mt-1">
                      <MapPin className="mr-1 h-3 w-3" />
                      {trip.destination || trip.destino}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </DialogContent>
    </Dialog>
  )
}
