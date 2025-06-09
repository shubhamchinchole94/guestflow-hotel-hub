
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';

const RevenueChart = () => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);

  useEffect(() => {
    calculateRevenue();
  }, []);

  const calculateRevenue = () => {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const today = new Date();
    const last7Days = [];
    
    // Generate last 7 days data
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Calculate revenue for this date
      const dayBookings = bookings.filter((booking: any) => {
        const checkInDate = format(new Date(booking.checkInDate), 'yyyy-MM-dd');
        return checkInDate === dateStr;
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
      return checkInDate === todayStr;
    });
    
    const todayRev = todayBookings.reduce((sum: number, booking: any) => {
      return sum + (booking.farePerNight || 0);
    }, 0);
    
    setTodayRevenue(todayRev);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Today's Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">₹{todayRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Revenue from check-ins today
          </p>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [`₹${value}`, 'Revenue']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar dataKey="revenue" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueChart;
