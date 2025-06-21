import { useState } from "react";
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar as CalendarIcon, 
  User, 
  MapPin, 
  DollarSign, 
  Settings,
  RefreshCw,
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
  type: 'job' | 'google' | 'appointment';
  status?: string;
  description?: string;
  location?: string;
  attendees?: string[];
}

interface Job {
  id: number;
  jobName: string;
  customerId?: number;
  projectId?: number;
  assignedToId?: number;
  teamMembers: number[];
  customerSchedulingStatus: string;
  contractorAcceptanceStatus: string;
  shiftStartDate?: string;
  shiftEndDate?: string;
  duration: number;
  payoutAmount: number;
  description: string;
  requirements?: string;
  createdAt: string;
  assignedTo?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  customer?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
  };
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export default function CalendarView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleCalendarId, setGoogleCalendarId] = useState('');
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // Fetch jobs data
  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  // Fetch Google Calendar events
  const { data: googleEvents = [], isLoading: googleLoading } = useQuery<GoogleCalendarEvent[]>({
    queryKey: ["/api/google-calendar/events"],
    enabled: isGoogleConnected,
  });

  // Convert jobs to calendar events
  const jobEvents: CalendarEvent[] = (jobs as Job[])
    .filter((job: Job) => job.shiftStartDate && job.shiftEndDate)
    .map((job: Job) => ({
      id: `job-${job.id}`,
      title: job.jobName,
      start: new Date(job.shiftStartDate!),
      end: new Date(job.shiftEndDate!),
      type: 'job' as const,
      status: job.customerSchedulingStatus,
      description: job.description,
      location: job.customer?.address,
      resource: job,
    }));

  // Convert Google Calendar events to calendar events
  const googleCalendarEvents: CalendarEvent[] = (googleEvents as GoogleCalendarEvent[]).map((event: GoogleCalendarEvent) => ({
    id: `google-${event.id}`,
    title: event.summary,
    start: new Date(event.start.dateTime || event.start.date!),
    end: new Date(event.end.dateTime || event.end.date!),
    type: 'google' as const,
    description: event.description,
    location: event.location,
    attendees: event.attendees?.map(a => a.email),
    resource: event,
  }));

  // Combine all events
  const allEvents = [...jobEvents, ...googleCalendarEvents];

  // Google Calendar integration
  const connectToGoogle = async () => {
    try {
      const response = await apiRequest("POST", "/api/google-calendar/connect");
      if (response.ok) {
        setIsGoogleConnected(true);
        toast({
          title: "Google Calendar Connected",
          description: "Successfully connected to Google Calendar",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/google-calendar/events"] });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Calendar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const syncWithGoogle = async () => {
    try {
      await apiRequest("POST", "/api/google-calendar/sync");
      toast({
        title: "Calendar Synced",
        description: "Successfully synced with Google Calendar",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/google-calendar/events"] });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync with Google Calendar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createGoogleEvent = async (eventData: any) => {
    try {
      await apiRequest("POST", "/api/google-calendar/events", eventData);
      toast({
        title: "Event Created",
        description: "Event successfully created in Google Calendar",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/google-calendar/events"] });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create event in Google Calendar",
        variant: "destructive",
      });
    }
  };

  // Event styling
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';

    switch (event.type) {
      case 'job':
        backgroundColor = '#059669'; // Green for jobs
        borderColor = '#059669';
        if (event.status === 'scheduled') {
          backgroundColor = '#2563eb'; // Blue for scheduled
          borderColor = '#2563eb';
        } else if (event.status === 'completed') {
          backgroundColor = '#dc2626'; // Red for completed
          borderColor = '#dc2626';
        }
        break;
      case 'google':
        backgroundColor = '#7c3aed'; // Purple for Google events
        borderColor = '#7c3aed';
        break;
      default:
        backgroundColor = '#6b7280'; // Gray for others
        borderColor = '#6b7280';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: `2px solid ${borderColor}`,
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px',
      }
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // Create new event at selected time slot
    const newEvent: CalendarEvent = {
      id: `new-${Date.now()}`,
      title: 'New Event',
      start,
      end,
      type: 'appointment',
    };
    setSelectedEvent(newEvent);
    setIsEventDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Calendar & Scheduling
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={syncWithGoogle} disabled={!isGoogleConnected}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync
              </Button>
              {!isGoogleConnected ? (
                <Button onClick={connectToGoogle}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Google Calendar
                </Button>
              ) : (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Google Connected
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="settings">Calendar Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5" />
                    <span>Business Calendar</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setView(Views.MONTH)}
                      className={view === Views.MONTH ? "bg-blue-100" : ""}
                    >
                      Month
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setView(Views.WEEK)}
                      className={view === Views.WEEK ? "bg-blue-100" : ""}
                    >
                      Week
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setView(Views.DAY)}
                      className={view === Views.DAY ? "bg-blue-100" : ""}
                    >
                      Day
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {jobsLoading || googleLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading calendar...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 sm:h-[600px]">
                    <Calendar
                      localizer={localizer}
                      events={allEvents}
                      startAccessor="start"
                      endAccessor="end"
                      style={{ height: '100%' }}
                      view={view}
                      onView={setView}
                      date={date}
                      onNavigate={setDate}
                      onSelectEvent={handleSelectEvent}
                      onSelectSlot={handleSelectSlot}
                      selectable
                      eventPropGetter={eventStyleGetter}
                      formats={{
                        eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                          localizer?.format(start, 'h:mm A', culture) + ' - ' + localizer?.format(end, 'h:mm A', culture)
                      }}
                    />
                  </div>
                )}

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-600 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Jobs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled Jobs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-purple-600 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Google Calendar</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-600 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Calendar Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Google Calendar Integration</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Google Calendar Sync</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Sync your business calendar with Google Calendar
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isGoogleConnected ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Connected
                          </Badge>
                        ) : (
                          <Button onClick={connectToGoogle}>Connect</Button>
                        )}
                      </div>
                    </div>

                    {isGoogleConnected && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="calendarId">Default Calendar ID</Label>
                          <Input
                            id="calendarId"
                            value={googleCalendarId}
                            onChange={(e) => setGoogleCalendarId(e.target.value)}
                            placeholder="primary or your-calendar-id@group.calendar.google.com"
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Leave empty to use primary calendar
                          </p>
                        </div>

                        <Alert>
                          <ExternalLink className="h-4 w-4" />
                          <AlertDescription>
                            To find your calendar ID: Go to Google Calendar → Settings → Select calendar → 
                            Calendar ID section. Use "primary" for your main calendar.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Calendar Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="defaultView">Default View</Label>
                      <Select defaultValue="month">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Month</SelectItem>
                          <SelectItem value="week">Week</SelectItem>
                          <SelectItem value="day">Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timeFormat">Time Format</Label>
                      <Select defaultValue="12">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12 Hour</SelectItem>
                          <SelectItem value="24">24 Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Event Details Dialog */}
        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedEvent?.type === 'job' ? 'Job Details' : 
                 selectedEvent?.type === 'google' ? 'Google Calendar Event' : 'Event Details'}
              </DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{selectedEvent.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(selectedEvent.start, 'PPP p')} - {format(selectedEvent.end, 'p')}
                  </p>
                </div>
                
                {selectedEvent.description && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm mt-1">{selectedEvent.description}</p>
                  </div>
                )}
                
                {selectedEvent.location && (
                  <div>
                    <Label>Location</Label>
                    <p className="text-sm mt-1 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {selectedEvent.location}
                    </p>
                  </div>
                )}

                {selectedEvent.type === 'job' && selectedEvent.resource && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <Badge variant={selectedEvent.status === 'scheduled' ? 'default' : 'secondary'}>
                        {selectedEvent.status}
                      </Badge>
                      {selectedEvent.resource.payoutAmount && (
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${selectedEvent.resource.payoutAmount}
                        </div>
                      )}
                    </div>
                    
                    {selectedEvent.resource.assignedTo && (
                      <div>
                        <Label>Assigned To</Label>
                        <p className="text-sm mt-1 flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {selectedEvent.resource.assignedTo.firstName} {selectedEvent.resource.assignedTo.lastName}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div>
                    <Label>Attendees</Label>
                    <div className="text-sm mt-1">
                      {selectedEvent.attendees.map((email, index) => (
                        <div key={index} className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  {selectedEvent.type === 'job' && (
                    <Button
                      variant="outline"
                      onClick={() => createGoogleEvent({
                        summary: selectedEvent.title,
                        description: selectedEvent.description,
                        location: selectedEvent.location,
                        start: { dateTime: selectedEvent.start.toISOString() },
                        end: { dateTime: selectedEvent.end.toISOString() },
                      })}
                      disabled={!isGoogleConnected}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Add to Google Calendar
                    </Button>
                  )}
                  <Button onClick={() => setIsEventDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}