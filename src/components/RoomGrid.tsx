
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useGuestStore } from '@/store/guestStore';

interface RoomGridProps {
  selectedDate: Date;
}

interface Room {
  roomNumber: string;
  floor: number;
  type: string;
  price: number;
  isOccupied: boolean;
  guest: any | null;
}

const RoomGrid = ({ selectedDate }: RoomGridProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const { openGuestForm, openGuestDetails } = useGuestStore();

  useEffect(() => {
    generateRooms();
    
    // Listen for dashboard refresh events
    const handleRefresh = () => generateRooms();
    window.addEventListener('refreshDashboard', handleRefresh);
    
    return () => window.removeEventListener('refreshDashboard', handleRefresh);
  }, [selectedDate]);

  const generateRooms = () => {
    const hotelConfig = JSON.parse(localStorage.getItem('hotelConfig') || '{}');
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    if (!hotelConfig.totalFloors || !hotelConfig.roomsPerFloor) {
      // Default configuration if no hotel is registered
      const defaultRooms: Room[] = [];
      for (let floor = 1; floor <= 2; floor++) {
        for (let room = 1; room <= 4; room++) {
          const roomNumber = `${floor}0${room}`;
          defaultRooms.push({
            roomNumber,
            floor,
            type: 'Regular',
            price: 1000,
            isOccupied: false,
            guest: null
          });
        }
      }
      setRooms(defaultRooms);
      return;
    }

    const generatedRooms: Room[] = [];
    const { totalFloors, roomsPerFloor, roomTypes = [] } = hotelConfig;

    for (let floor = 1; floor <= totalFloors; floor++) {
      for (let room = 1; room <= roomsPerFloor; room++) {
        const roomNumber = `${floor}0${room}`;
        
        // Check if room is occupied on selected date
        const roomBooking = bookings.find((booking: any) => {
          const checkIn = new Date(booking.checkInDate);
          const checkOut = new Date(booking.checkOutDate);
          return booking.roomNumber === roomNumber && 
                 selectedDate >= checkIn && 
                 selectedDate <= checkOut;
        });

        // Assign room type cyclically
        const typeIndex = (room - 1) % roomTypes.length;
        const roomType = roomTypes[typeIndex] || { name: 'Regular', price: 1000 };

        generatedRooms.push({
          roomNumber,
          floor,
          type: roomType.name,
          price: roomType.price,
          isOccupied: !!roomBooking,
          guest: roomBooking || null
        });
      }
    }

    setRooms(generatedRooms);
  };

  const handleRoomClick = (room: Room) => {
    if (room.isOccupied && room.guest) {
      openGuestDetails(room.guest);
    } else {
      openGuestForm(room.roomNumber, selectedDate);
    }
  };

  const groupedRooms = rooms.reduce((acc: Record<number, Room[]>, room) => {
    if (!acc[room.floor]) {
      acc[room.floor] = [];
    }
    acc[room.floor].push(room);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          Rooms Status - {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedRooms).map(([floor, floorRooms]) => (
            <div key={floor}>
              <h3 className="text-base md:text-lg font-semibold mb-3">Floor {floor}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {floorRooms.map((room) => (
                  <div
                    key={room.roomNumber}
                    className={`p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      hoveredRoom === room.roomNumber
                        ? room.isOccupied
                          ? 'bg-red-100 border-red-300'
                          : 'bg-green-100 border-green-300'
                        : 'bg-card border-border hover:border-primary'
                    }`}
                    onMouseEnter={() => setHoveredRoom(room.roomNumber)}
                    onMouseLeave={() => setHoveredRoom(null)}
                    onClick={() => handleRoomClick(room)}
                  >
                    <div className="text-center">
                      <div className="text-lg md:text-xl font-bold mb-1">Room</div>
                      <div className="text-xl md:text-2xl font-bold text-primary mb-2">
                        {room.roomNumber}
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground mb-2">
                        {room.type} - ₹{room.price}/night
                      </div>
                      {room.isOccupied ? (
                        <div className="space-y-1">
                          <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            Occupied
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full text-xs"
                          >
                            View Details
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            Available
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full text-xs"
                          >
                            Click to Book
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomGrid;
