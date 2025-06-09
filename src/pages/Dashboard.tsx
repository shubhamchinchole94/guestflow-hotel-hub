
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { LogOut, User, Hotel, CalendarDays, FileText, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import StatsCards from '@/components/StatsCards';
import RoomGrid from '@/components/RoomGrid';
import UserManagement from '@/components/UserManagement';
import HotelRegistration from '@/components/HotelRegistration';
import GuestRegistration from '@/components/GuestRegistration';
import ReportsExport from '@/components/ReportsExport';
import GuestList from '@/components/GuestList';
import RevenueChart from '@/components/RevenueChart';

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('');
  const [username, setUsername] = useState('');
  const [hotelConfig, setHotelConfig] = useState<any>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const user = localStorage.getItem('username');
    const loginTime = localStorage.getItem('loginTime');

    if (!role || !loginTime) {
      navigate('/login');
      return;
    }

    // Check session timeout (15 minutes)
    const sessionTimeout = 15 * 60 * 1000; // 15 minutes in milliseconds
    const loginTimestamp = new Date(loginTime).getTime();
    const currentTime = new Date().getTime();

    if (currentTime - loginTimestamp > sessionTimeout) {
      handleLogout();
      toast({
        title: "Session Expired",
        description: "Please login again",
        variant: "destructive"
      });
      return;
    }

    setUserRole(role);
    setUsername(user || '');
    loadHotelConfig();

    // Listen for dashboard refresh events
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
      loadHotelConfig();
    };
    window.addEventListener('refreshDashboard', handleRefresh);

    // Set up session check interval
    const interval = setInterval(() => {
      const currentLoginTime = localStorage.getItem('loginTime');
      if (currentLoginTime) {
        const currentTimestamp = new Date().getTime();
        const loginTimestamp = new Date(currentLoginTime).getTime();
        
        if (currentTimestamp - loginTimestamp > sessionTimeout) {
          handleLogout();
          toast({
            title: "Session Expired",
            description: "Please login again",
            variant: "destructive"
          });
        }
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshDashboard', handleRefresh);
    };
  }, [navigate]);

  const loadHotelConfig = () => {
    const savedConfig = localStorage.getItem('hotelConfig');
    if (savedConfig) {
      setHotelConfig(JSON.parse(savedConfig));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('loginTime');
    navigate('/login');
  };

  const handleLogoClick = () => {
    setActiveTab('dashboard');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: CalendarDays, roles: ['superadmin', 'user'] },
    { id: 'guests', label: 'Guest List', icon: Users, roles: ['superadmin', 'user'] },
    { id: 'users', label: 'User Management', icon: User, roles: ['superadmin'] },
    { id: 'hotel', label: 'Hotel Registration', icon: Hotel, roles: ['superadmin'] },
    { id: 'reports', label: 'Reports & Export', icon: FileText, roles: ['superadmin'] }
  ];

  const availableMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
              {hotelConfig.hotelLogo ? (
                <img 
                  src={hotelConfig.hotelLogo} 
                  alt="Hotel logo" 
                  className="h-8 w-8 object-contain mr-2"
                />
              ) : (
                <Hotel className="h-8 w-8 text-primary mr-2" />
              )}
              <h1 className="text-2xl font-bold">
                {hotelConfig.hotelName || 'GuestFlow Hotel Management'}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {username} ({userRole})
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card h-[calc(100vh-64px)]">
          <nav className="p-4 space-y-2">
            {availableMenuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Dashboard</h2>
                <p className="text-muted-foreground">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>

              <StatsCards key={refreshKey} />

              {/* Revenue Chart */}
              {userRole === 'superadmin' && (
                <RevenueChart key={refreshKey} />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border"
                    />
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Go to Today
                    </Button>
                  </CardContent>
                </Card>

                {/* Room Grid */}
                <div className="lg:col-span-2">
                  <RoomGrid selectedDate={selectedDate} key={refreshKey} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guests' && (
            <GuestList key={refreshKey} />
          )}

          {activeTab === 'users' && userRole === 'superadmin' && (
            <UserManagement />
          )}

          {activeTab === 'hotel' && userRole === 'superadmin' && (
            <HotelRegistration />
          )}

          {activeTab === 'reports' && userRole === 'superadmin' && (
            <ReportsExport />
          )}
        </main>
      </div>

      <GuestRegistration />
    </div>
  );
};

export default Dashboard;
