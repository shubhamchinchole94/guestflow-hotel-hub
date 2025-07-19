
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hotel, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import HotelService from '@/services/hotel';
import DashboardService from '@/services/DashboardService';
import GuestRegistrationService from '@/services/GuestRegistrationService';
import RoomService from '@/services/RoomService';

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

  const calculateStats = async () => {
    try {
      // Get hotel configuration from service
      const hotelConfigResponse = await HotelService.getHotelConfig();
      const hotelConfig = hotelConfigResponse.data || {};

      // Get bookings from service
      const bookingsResponse = await GuestRegistrationService.getAllRegistrations();
      const bookings = bookingsResponse.data || [];
      const roomStatuses =  await RoomService.getAllRooms();
      const roomstatus = roomStatuses.data || [];


      if (hotelConfig.totalFloors && hotelConfig.roomsPerFloor) {
        const totalRooms = hotelConfig.totalFloors * hotelConfig.roomsPerFloor;
        // const currentBookings = bookings.filter((booking: any) => {
        //   const checkIn = new Date(booking.checkInDate);
        //   const checkOut = new Date(booking.checkOutDate);
        //   const today = new Date();
        //   return booking.status === 'booked' || booking.status === 'room_transferred';
        // });

        const occupiedRooms = roomstatus.filter(
          (room: any) =>
            room.status === 'booked' ||
            room.status === 'room_transferred' ||
            room.status === 'cleaning' ||
            room.status === 'unavailable'
        ).length;
        const availableRooms = totalRooms - occupiedRooms;
        const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);
        console.log("Calculated Stats:", occupiedRooms);
        console.log("available Rooms:", availableRooms);
        console.log("occupancyRate:", occupancyRate);

        setStats({
          totalRooms,
          availableRooms,
          occupiedRooms,
          occupancyRate
        });
      }
    } catch (error) {
      console.error('Error calculating stats:', error);
      // Fallback to default values if service calls fail

    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      <Card className="hotstar-card-gradient">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Total Rooms</CardTitle>
          <Hotel className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">{stats.totalRooms}</div>
        </CardContent>
      </Card>

      <Card className="hotstar-card-gradient">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Available</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-green-600">{stats.availableRooms}</div>
        </CardContent>
      </Card>

      <Card className="hotstar-card-gradient">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Occupied</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-red-600">{stats.occupiedRooms}</div>
        </CardContent>
      </Card>

      <Card className="hotstar-card-gradient">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Occupancy Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">{stats.occupancyRate}%</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
