import pb from '@/lib/pocketbase/client'
import type { Trip } from './trips'

export type EventType = 'voo' | 'hotel' | 'atividade'

export interface TripEvent {
  id: string
  trip_id: string
  type: EventType
  date: string
  time: string
  description: string
  created: string
  updated: string
  expand?: {
    trip_id: Trip
  }
}

export const getUpcomingEvents = () =>
  pb.collection('events').getList<TripEvent>(1, 5, {
    sort: 'date,time',
    expand: 'trip_id',
  })
