
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGuestStore } from '@/store/guestStore';
import { Eye, UserPlus } from 'lucide-react';

interface RoomGridProps {
  selectedDate: Date;
}

const RoomGrid: React.FC<RoomGridProps> = ({ selectedDate }) => {
  const [hotelConfig, setHotelConfig] = useState<any>({});
  const [bookings, setBookings] = useState<any[]>([]);
  const { openGuestRegistration, openGuestDetails } = useGuestStore();

  useEffect(() => {
    loadHotelConfig();
    loadBookings();
    
    const handleRefresh = () => {
      loadHotelConfig();
      loadBookings();
    };
    window.addEventListener('refreshDashboard', handleRefresh);
    
    return () => window.removeEventListener('refreshDashboard', handleRefresh);
  }, []);

  const loadHotelConfig = () => {
    const savedConfig = localStorage.getItem('hotelConfig');
    if (savedConfig) {
      setHotelConfig(JSON.parse(savedConfig));
    }
  };

  const loadBookings = () => {
    const savedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    setBookings(savedBookings);
  };

  const generateRooms = () => {
    if (!hotelConfig.totalFloors || !hotelConfig.roomsPerFloor) {
      return [];
    }

    const rooms = [];
    for (let floor = 1; floor <= hotelConfig.totalFloors; floor++) {
      for (let room = 1; room <= hotelConfig.roomsPerFloor; room++) {
        const roomNumber = `${floor}${room.toString().padStart(2, '0')}`;
        rooms.push({
          number: roomNumber,
          floor,
          status: getRoomStatus(roomNumber)
        });
      }
    }
    return rooms;
  };

  const getRoomStatus = (roomNumber: string) => {
    const booking = bookings.find(b => {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      return b.roomNumber === roomNumber && 
             selectedDate >= checkIn && 
             selectedDate <= checkOut;
    });
    
    return booking ? 'occupied' : 'available';
  };

  const getRoomBooking = (roomNumber: string) => {
    return bookings.find(b => {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      return b.roomNumber === roomNumber && 
             selectedDate >= checkIn && 
             selectedDate <= checkOut;
    });
  };

  const handleRoomClick = (roomNumber: string) => {
    const booking = getRoomBooking(roomNumber);
    if (booking) {
      openGuestDetails(booking);
    } else {
      openGuestRegistration(roomNumber, selectedDate);
    }
  };

  const rooms = generateRooms();

  if (rooms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Room Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Please configure hotel details first to see room grid.
          </p>
        </CardContent>
      </Card>
    );
  }

  const groupedRooms = rooms.reduce((acc, room) => {
    if (!acc[room.floor]) {
      acc[room.floor] = [];
    }
    acc[room.floor].push(room);
    return acc;
  }, {} as Record<number, typeof rooms>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Room Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedRooms).map(([floor, floorRooms]) => (
            <div key={floor}>
              <h3 className="text-lg font-semibold mb-3">Floor {floor}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {floorRooms.map((room) => {
                  const booking = getRoomBooking(room.number);
                  return (
                    <Card 
                      key={room.number} 
                      className={`group cursor-pointer transition-all hover:shadow-md ${
                        room.status === 'occupied' 
                          ? 'border-red-200 bg-red-50' 
                          : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="text-center space-y-2">
                          <h4 className="font-semibold text-lg">{room.number}</h4>
                          <Badge 
                            variant={room.status === 'occupied' ? 'destructive' : 'default'}
                            className={room.status === 'occupied' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                          >
                            {room.status === 'occupied' ? 'Occupied' : 'Available'}
                          </Badge>
                          
                          {booking && (
                            <div className="text-xs text-gray-600 mt-2">
                              <p className="font-medium">
                                {booking.primaryGuest.firstName} {booking.primaryGuest.lastName}
                              </p>
                              <p>{booking.totalGuests} guests</p>
                            </div>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoomClick(room.number)}
                            className="w-full mt-2 opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                          >
                            {room.status === 'occupied' ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                View Details
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3 w-3 mr-1" />
                                Book Room
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>Occupied</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomGrid;
