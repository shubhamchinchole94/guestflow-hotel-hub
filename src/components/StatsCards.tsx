
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hotel, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const StatsCards = () => {
  const [stats, setStats] = useState({
    totalRooms: 12,
    availableRooms: 11,
    occupiedRooms: 1,
    occupancyRate: 8
  });

  useEffect(() => {
    calculateStats();
    
    // Listen for dashboard refresh events
    const handleRefresh = () => calculateStats();
    window.addEventListener('refreshDashboard', handleRefresh);
    
    return () => window.removeEventListener('refreshDashboard', handleRefresh);
  }, []);

  const calculateStats = () => {
    // Load hotel configuration and calculate stats
    const hotelConfig = JSON.parse(localStorage.getItem('hotelConfig') || '{}');
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    if (hotelConfig.totalFloors && hotelConfig.roomsPerFloor) {
      const totalRooms = hotelConfig.totalFloors * hotelConfig.roomsPerFloor;
      const currentBookings = bookings.filter((booking: any) => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const today = new Date();
        return today >= checkIn && today <= checkOut;
      });
      
      const occupiedRooms = currentBookings.length;
      const availableRooms = totalRooms - occupiedRooms;
      const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

      setStats({
        totalRooms,
        availableRooms,
        occupiedRooms,
        occupancyRate
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
          <Hotel className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRooms}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.availableRooms}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Occupied</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.occupiedRooms}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
