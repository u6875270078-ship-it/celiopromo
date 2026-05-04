import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Award, Clock, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';

// Simple progress bar component
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </div>
);

interface CustomerJourneyStage {
  id: number;
  customerId: number;
  stageName: string;
  stageTitle: string;
  stageDescription: string;
  isCompleted: boolean;
  completedAt: string | null;
  progressPercentage: number;
  milestoneData: any;
  createdAt: string;
  updatedAt: string;
}

interface CustomerJourneyEvent {
  id: number;
  customerId: number;
  eventType: string;
  eventValue: string;
  eventData: any;
  points: number;
  stageName: string;
  createdAt: string;
}

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  currentJourneyStage: string;
  journeyScore: number;
  totalSpent: string;
  orderCount: number;
}

interface CustomerJourneyTrackerProps {
  customerId: number;
  customer?: Customer;
}

const stageIcons: { [key: string]: string } = {
  'visitor': '👋',
  'interested': '👀', 
  'first_purchase': '🛍️',
  'returning': '🔄',
  'loyal': '💎',
  'vip': '👑'
};

const stageColors: { [key: string]: string } = {
  'visitor': 'bg-gray-500',
  'interested': 'bg-blue-500',
  'first_purchase': 'bg-green-500', 
  'returning': 'bg-yellow-500',
  'loyal': 'bg-purple-500',
  'vip': 'bg-red-500'
};

const eventTypeLabels: { [key: string]: string } = {
  'customer_registered': 'Registrazione Cliente',
  'product_view': 'Visualizzazione Prodotto',
  'cart_add': 'Aggiunto al Carrello',
  'purchase': 'Acquisto Completato',
  'return_visit': 'Visita di Ritorno',
  'review_left': 'Recensione Lasciata',
  'newsletter_signup': 'Iscrizione Newsletter'
};

export default function CustomerJourneyTracker({ customerId, customer }: CustomerJourneyTrackerProps) {
  // Fetch customer journey stages
  const { data: stages = [], isLoading: stagesLoading } = useQuery<CustomerJourneyStage[]>({
    queryKey: ['/api/customers', customerId, 'journey-stages'],
  });

  // Fetch customer journey events
  const { data: events = [], isLoading: eventsLoading } = useQuery<CustomerJourneyEvent[]>({
    queryKey: ['/api/customers', customerId, 'journey-events'],
  });

  // Calculate overall progress
  const completedStages = stages.filter(stage => stage.isCompleted).length;
  const totalStages = stages.length;
  const overallProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  // Get current stage info
  const currentStage = stages.find(stage => stage.stageName === customer?.currentJourneyStage);

  if (stagesLoading || eventsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Percorso Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Percorso Cliente - {customer?.firstName} {customer?.lastName}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            <span>{customer?.journeyScore || 0} punti</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{completedStages}/{totalStages} fasi completate</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="w-full">
          <div className="flex border-b border-gray-200 mb-6">
            <button 
              className="px-4 py-2 text-sm font-medium border-b-2 border-blue-500 text-blue-600"
              onClick={() => {}}
            >
              Progresso
            </button>
            <button 
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              onClick={() => {}}
            >
              Attività
            </button>
          </div>

          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progresso Complessivo</span>
                <span className="text-sm text-gray-600">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Current Stage Highlight */}
            {currentStage && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {stageIcons[currentStage.stageName] || '📊'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Fase Attuale: {currentStage.stageTitle}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {currentStage.stageDescription}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Journey Stages Timeline */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Timeline del Percorso</h3>
              <div className="relative">
                {stages.map((stage, index) => (
                  <div key={stage.id} className="relative flex items-start gap-4 pb-8">
                    {/* Timeline Line */}
                    {index < stages.length - 1 && (
                      <div className="absolute left-4 top-8 w-px h-16 bg-gray-200"></div>
                    )}
                    
                    {/* Stage Icon */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-white text-sm
                      ${stage.isCompleted ? stageColors[stage.stageName] || 'bg-gray-400' : 'bg-gray-300'}
                    `}>
                      {stage.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </div>

                    {/* Stage Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {stage.stageTitle}
                        </h4>
                        {stage.stageName === customer?.currentJourneyStage && (
                          <Badge variant="outline" className="text-xs">
                            Attuale
                          </Badge>
                        )}
                        <span className="text-lg">
                          {stageIcons[stage.stageName] || '📊'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {stage.stageDescription}
                      </p>
                      {stage.isCompleted && stage.completedAt && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Completata il {format(new Date(stage.completedAt), 'dd/MM/yyyy')}
                        </p>
                      )}
                      {!stage.isCompleted && stage.progressPercentage > 0 && (
                        <div className="mt-2 space-y-1">
                          <Progress value={stage.progressPercentage} className="h-1" />
                          <span className="text-xs text-gray-500">
                            {stage.progressPercentage}% completato
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 hidden" id="events-tab">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Attività Recenti</h3>
              
              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nessuna attività registrata</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 10).map((event) => (
                    <Card key={event.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium">
                              {eventTypeLabels[event.eventType] || event.eventType}
                            </h4>
                            {event.eventValue && parseFloat(event.eventValue) > 0 && (
                              <p className="text-sm text-green-600 font-medium">
                                +{parseFloat(event.eventValue).toFixed(2)}€
                              </p>
                            )}
                            {event.eventData && (
                              <p className="text-xs text-gray-600">
                                {JSON.stringify(event.eventData).substring(0, 100)}...
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(event.createdAt), 'dd/MM/yyyy HH:mm')}
                            </div>
                            {event.points > 0 && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                +{event.points} punti
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}