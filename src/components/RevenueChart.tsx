
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import DashboardService from '@/services/DashboardService';
import GuestRegistrationService from '@/services/GuestRegistrationService';

const RevenueChart = () => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);

  useEffect(() => {
    calculateRevenue();
  }, []);

  const calculateRevenue = async () => {
    try {
      const response = await GuestRegistrationService.getAllRegistrations();
      const bookings = response.data || [];
      const today = new Date();
      const last7Days = [];
      
      // Generate last 7 days data
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Calculate revenue for this date
        const dayBookings = bookings.filter((booking: any) => {
          const checkInDate = format(new Date(booking.checkInDate), 'yyyy-MM-dd');
          return checkInDate === dateStr && booking.status === 'active';
        });
        
        const revenue = dayBookings.reduce((sum: number, booking: any) => {
          return sum + (booking.farePerNight || 0);
        }, 0);
        
        last7Days.push({
          date: format(date, 'MMM dd'),
          revenue: revenue,
          bookings: dayBookings.length
        });
      }
      
      setRevenueData(last7Days);
      
      // Calculate today's revenue
      const todayStr = format(today, 'yyyy-MM-dd');
      const todayBookings = bookings.filter((booking: any) => {
        const checkInDate = format(new Date(booking.checkInDate), 'yyyy-MM-dd');
        return checkInDate === todayStr && booking.status === 'active';
      });
      
      const todayRev = todayBookings.reduce((sum: number, booking: any) => {
        return sum + (booking.farePerNight || 0);
      }, 0);
      
      setTodayRevenue(todayRev);
    } catch (error) {
      console.error('Error calculating revenue:', error);
      // Fallback to default data if service fails
      setRevenueData([]);
      setTodayRevenue(0);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Today's Revenue */}
      <Card className="hotstar-card-gradient">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm md:text-base font-medium">Today's Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-primary">₹{todayRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Revenue from check-ins today
          </p>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card className="hotstar-card-gradient">
        <CardHeader>
          <CardTitle className="text-sm md:text-base">7-Day Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={revenueData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                formatter={(value, name) => [`₹${value}`, 'Revenue']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--card-foreground))'
                }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueChart;
