import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock,
  Target,
  Activity,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  Share,
  MoreVertical
} from 'lucide-react';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock data for analytics - in real app, this would come from API
  const analyticsData = {
    totalProjects: 24,
    completedProjects: 8,
    inProgressProjects: 12,
    teamMembers: 15,
    totalRevenue: 125000,
    avgProjectTime: 14,
    teamUtilization: 78,
    projectStatusDistribution: [
      { name: 'New Lead', count: 4, color: 'bg-gray-500' },
      { name: 'In Progress', count: 12, color: 'bg-orange-500' },
      { name: 'Measured', count: 3, color: 'bg-blue-500' },
      { name: 'Quoted', count: 2, color: 'bg-yellow-500' },
      { name: 'Sold', count: 1, color: 'bg-green-500' },
      { name: 'Installed', count: 1, color: 'bg-purple-500' },
      { name: 'Done', count: 1, color: 'bg-emerald-500' }
    ],
    recentActivity: [
      { action: 'New project created', project: 'Smith Kitchen Remodel', time: '2 hours ago' },
      { action: 'Quote sent', project: 'Johnson Windows', time: '4 hours ago' },
      { action: 'Project completed', project: 'Miller Bathroom', time: '1 day ago' }
    ],
    upcomingDeadlines: [
      { project: 'Davis Home Renovation', deadline: '2 days', status: 'urgent' },
      { project: 'Wilson Kitchen', deadline: '1 week', status: 'normal' },
      { project: 'Brown Flooring', deadline: '2 weeks', status: 'normal' }
    ],
    monthlyRevenue: [
      { month: 'Jan', revenue: 45000 },
      { month: 'Feb', revenue: 52000 },
      { month: 'Mar', revenue: 48000 },
      { month: 'Apr', revenue: 61000 },
      { month: 'May', revenue: 55000 },
      { month: 'Jun', revenue: 67000 }
    ]
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue }) => (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-200">{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>{subtitle}</span>
          {trend && (
            <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ProjectStatusChart = () => (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-200 flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Project Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analyticsData.projectStatusDistribution.map((status, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <span className="text-slate-300 text-sm">{status.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">{status.count} projects</span>
                <div className="w-16 bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${status.color}`}
                    style={{ width: `${(status.count / analyticsData.totalProjects) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const RecentActivity = () => (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-200 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analyticsData.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">No recent activity</p>
              <p className="text-slate-500 text-sm">Project activities will appear here</p>
            </div>
          ) : (
            analyticsData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-slate-300 text-sm">{activity.action}</p>
                  <p className="text-slate-200 font-medium">{activity.project}</p>
                  <p className="text-slate-500 text-xs">{activity.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  const UpcomingDeadlines = () => (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-200 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analyticsData.upcomingDeadlines.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">No upcoming deadlines scheduled</p>
              <p className="text-slate-500 text-sm">Add projects to see revenue trends</p>
            </div>
          ) : (
            analyticsData.upcomingDeadlines.map((deadline, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-slate-200 font-medium">{deadline.project}</p>
                  <p className="text-slate-400 text-sm">Due in {deadline.deadline}</p>
                </div>
                <Badge variant={deadline.status === 'urgent' ? 'destructive' : 'secondary'}>
                  {deadline.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  const MonthlyRevenue = () => (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-200 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Monthly Revenue Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analyticsData.monthlyRevenue.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">No revenue data available yet</p>
              <p className="text-slate-500 text-sm">Add projects to see revenue trends</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyticsData.monthlyRevenue.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm w-12">{month.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                        style={{ width: `${(month.revenue / 70000) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-slate-200 text-sm font-medium">
                    ${month.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const TeamPerformance = () => (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-200 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Users className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400">No team members added yet</p>
          <p className="text-slate-500 text-sm">Add team members to track performance</p>
        </div>
      </CardContent>
    </Card>
  );

  const CalendarView = () => (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-200 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Project Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Calendar View Coming Soon</p>
          <p className="text-slate-500">Schedule and track project deadlines, meetings, and milestones</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <h1 className="text-xl font-bold">Windows & Doors Projects</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="text-slate-300 border-slate-600">
              <Filter className="h-4 w-4 mr-2" />
              All Status
            </Button>
            <Button variant="outline" size="sm" className="text-slate-300 border-slate-600">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="text-slate-300 border-slate-600">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="text-slate-300 border-slate-600">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700 px-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calendar'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Calendar
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Projects"
                value={analyticsData.totalProjects}
                subtitle="0 of 0 items"
                icon={Target}
              />
              <StatCard
                title="Completed"
                value={analyticsData.completedProjects}
                subtitle="This month"
                icon={TrendingUp}
                trend="up"
                trendValue="12%"
              />
              <StatCard
                title="In Progress"
                value={analyticsData.inProgressProjects}
                subtitle="Days to complete"
                icon={Clock}
              />
              <StatCard
                title="Team Members"
                value={analyticsData.teamMembers}
                subtitle="No data yet"
                icon={Users}
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Revenue"
                value={`$${analyticsData.totalRevenue.toLocaleString()}`}
                subtitle="Current total"
                icon={DollarSign}
              />
              <StatCard
                title="Completed Projects"
                value={analyticsData.completedProjects}
                subtitle="This month"
                icon={Target}
              />
              <StatCard
                title="Avg. Project Time"
                value={analyticsData.avgProjectTime}
                subtitle="No data yet"
                icon={Clock}
              />
              <StatCard
                title="Team Utilization"
                value={`${analyticsData.teamUtilization}%`}
                subtitle="Average workload"
                icon={Users}
              />
            </div>

            {/* Charts and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProjectStatusChart />
              <MonthlyRevenue />
            </div>

            {/* Activity and Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RecentActivity />
              <UpcomingDeadlines />
              <TeamPerformance />
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <CalendarView />
          </div>
        )}
      </div>
    </div>
  );
}