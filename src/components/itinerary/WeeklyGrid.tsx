import { ItinerarioEvent } from '@/services/itinerario'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WeeklyGridProps {
  days: Date[]
  events: ItinerarioEvent[]
  onDayClick: (date: Date) => void
}

export function WeeklyGrid({ days, events, onDayClick }: WeeklyGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 animate-fade-in">
      {days.map((day) => {
        const dayEvents = events.filter((e) => isSameDay(new Date(e.data.substring(0, 10)), day))

        return (
          <Card
            key={day.toISOString()}
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
            onClick={() => onDayClick(day)}
          >
            <CardHeader className="p-3 bg-slate-50 border-b">
              <CardTitle className="text-center text-sm font-medium flex flex-col">
                <span className="text-slate-500 capitalize font-normal text-xs">
                  {format(day, 'EEEE', { locale: ptBR })}
                </span>
                <span className="text-lg mt-0.5">{format(day, 'dd/MM')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 min-h-[120px]">
              {dayEvents.length === 0 ? (
                <div className="text-xs text-center text-slate-400 mt-4">Nenhuma atividade</div>
              ) : (
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="text-xs p-1.5 bg-slate-100 rounded truncate flex flex-col gap-0.5"
                    >
                      <span className="font-semibold text-primary">{event.hora_inicio}</span>
                      <span className="truncate" title={event.atividade}>
                        {event.atividade}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
