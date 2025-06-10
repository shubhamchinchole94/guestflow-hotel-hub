
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { LogOut, User, Hotel, CalendarDays, FileText, Users, Menu } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from '@/components/ui/sidebar';
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
  const [sessionTime, setSessionTime] = useState('');
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
    const sessionTimeout = 15 * 60 * 1000;
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

    // Update session time
    updateSessionTime(loginTime);
    const sessionInterval = setInterval(() => updateSessionTime(loginTime), 1000);

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
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(sessionInterval);
      window.removeEventListener('refreshDashboard', handleRefresh);
    };
  }, [navigate]);

  const updateSessionTime = (loginTime: string) => {
    const loginTimestamp = new Date(loginTime).getTime();
    const currentTime = new Date().getTime();
    const sessionDuration = currentTime - loginTimestamp;
    
    const hours = Math.floor(sessionDuration / (1000 * 60 * 60));
    const minutes = Math.floor((sessionDuration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((sessionDuration % (1000 * 60)) / 1000);
    
    setSessionTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

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

  function AppSidebar() {
    return (
      <Sidebar className="border-r border-sidebar-border">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
            {hotelConfig.hotelLogo ? (
              <img 
                src={hotelConfig.hotelLogo} 
                alt="Hotel logo" 
                className="h-8 w-8 object-contain mr-3"
              />
            ) : (
              <Hotel className="h-8 w-8 text-sidebar-primary mr-3" />
            )}
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-sidebar-foreground">
                {hotelConfig.hotelName || 'GuestFlow'}
              </h1>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {availableMenuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveTab(item.id)}
                      isActive={activeTab === item.id}
                      className="w-full"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/70 mb-2">
            Session: {sessionTime}
          </div>
          <div className="text-xs text-sidebar-foreground/70 mb-2">
            {username} ({userRole})
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset className="flex-1">
            {/* Header */}
            <header className="flex h-16 items-center justify-between px-4 md:px-6 border-b border-border bg-card/50 backdrop-blur-sm">
              <div className="flex items-center space-x-2 md:space-x-4">
                <SidebarTrigger />
                <div className="md:hidden flex items-center cursor-pointer" onClick={handleLogoClick}>
                  {hotelConfig.hotelLogo ? (
                    <img 
                      src={hotelConfig.hotelLogo} 
                      alt="Hotel logo" 
                      className="h-6 w-6 object-contain mr-2"
                    />
                  ) : (
                    <Hotel className="h-6 w-6 text-primary mr-2" />
                  )}
                  <h1 className="text-lg font-bold">
                    {hotelConfig.hotelName || 'GuestFlow'}
                  </h1>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Session: {sessionTime} | Welcome, {username} ({userRole})
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              {activeTab === 'dashboard' && (
                <div className="space-y-4 md:space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <h2 className="text-2xl md:text-3xl font-bold">Dashboard</h2>
                    <p className="text-muted-foreground text-sm md:text-base">
                      {format(new Date(), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>

                  <StatsCards key={refreshKey} />

                  <RevenueChart key={refreshKey} />

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <Card className="lg:col-span-1">
                      <CardHeader>
                        <CardTitle className="text-lg md:text-xl">Select Date</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          className="rounded-md border w-full"
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
          </SidebarInset>
        </div>
      </SidebarProvider>

      <GuestRegistration />
    </div>
  );
};

export default Dashboard;
