import { TripFormModal } from './TripFormModal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function NewTripDialog() {
  return (
    <TripFormModal>
      <Button className="gap-2">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Nova Viagem</span>
      </Button>
    </TripFormModal>
  )
}
