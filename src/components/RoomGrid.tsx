
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useGuestStore } from '@/store/guestStore';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users } from 'lucide-react';

interface RoomGridProps {
  selectedDate: Date;
  onBulkBookingOpen?: () => void;
  onRoomTransferOpen?: (roomNumber: string) => void;
  onRoomStatusChange?: (roomNumber: string, status: string) => void;
}

interface Room {
  roomNumber: string;
  floor: number;
  type: string;
  price: number;
  isOccupied: boolean;
  guest: any | null;
  status: 'available' | 'occupied' | 'cleaning' | 'out-of-order';
}

const RoomGrid = ({ selectedDate, onBulkBookingOpen, onRoomTransferOpen, onRoomStatusChange }: RoomGridProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const { openGuestForm, openGuestDetails } = useGuestStore();

  useEffect(() => {
    generateRooms();
    
    const handleRefresh = () => generateRooms();
    window.addEventListener('refreshDashboard', handleRefresh);
    
    return () => window.removeEventListener('refreshDashboard', handleRefresh);
  }, [selectedDate]);

  const generateRooms = () => {
    const hotelConfig = JSON.parse(localStorage.getItem('hotelConfig') || '{}');
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const roomStatuses = JSON.parse(localStorage.getItem('roomStatuses') || '{}');
    
    if (!hotelConfig.totalFloors || !hotelConfig.roomsPerFloor) {
      const defaultRooms: Room[] = [];
      for (let floor = 1; floor <= 2; floor++) {
        for (let room = 1; room <= 4; room++) {
          const roomNumber = `${floor}0${room}`;
          const status = roomStatuses[roomNumber] || 'available';
          defaultRooms.push({
            roomNumber,
            floor,
            type: 'Regular',
            price: 1000,
            isOccupied: false,
            guest: null,
            status: status as any
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
        
        const roomBooking = bookings.find((booking: any) => {
          const checkIn = new Date(booking.checkInDate);
          const checkOut = new Date(booking.checkOutDate);
          return booking.roomNumber === roomNumber && 
                 selectedDate >= checkIn && 
                 selectedDate <= checkOut;
        });

        const typeIndex = (room - 1) % roomTypes.length;
        const roomType = roomTypes[typeIndex] || { name: 'Regular', price: 1000 };
        
        let status = roomStatuses[roomNumber] || 'available';
        if (roomBooking) {
          status = 'occupied';
        }

        generatedRooms.push({
          roomNumber,
          floor,
          type: roomType.name,
          price: roomType.price,
          isOccupied: !!roomBooking,
          guest: roomBooking || null,
          status: status as any
        });
      }
    }

    setRooms(generatedRooms);
  };

  const handleRoomClick = (room: Room) => {
    if (room.status === 'out-of-order') {
      return; // Don't allow any action on out-of-order rooms
    }
    
    if (room.isOccupied && room.guest) {
      openGuestDetails(room.guest);
    } else if (room.status === 'available') {
      openGuestForm(room.roomNumber, selectedDate);
    }
  };

  const handleRoomStatusChange = (roomNumber: string, newStatus: string) => {
    const roomStatuses = JSON.parse(localStorage.getItem('roomStatuses') || '{}');
    roomStatuses[roomNumber] = newStatus;
    localStorage.setItem('roomStatuses', JSON.stringify(roomStatuses));
    
    if (onRoomStatusChange) {
      onRoomStatusChange(roomNumber, newStatus);
    }
    
    generateRooms();
    window.dispatchEvent(new CustomEvent('refreshDashboard'));
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'occupied':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'cleaning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'out-of-order':
        return 'bg-gray-100 border-gray-400 text-gray-600';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getRoomStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'cleaning':
        return 'Cleaning';
      case 'out-of-order':
        return 'Out of Order';
      default:
        return 'Unknown';
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
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg md:text-xl">
            Rooms Status - {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </CardTitle>
          {onBulkBookingOpen && (
            <Button onClick={onBulkBookingOpen} size="sm">
              <Users className="h-4 w-4 mr-2" />
              Bulk Booking
            </Button>
          )}
        </div>
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
                      room.status === 'out-of-order' 
                        ? 'opacity-50 cursor-not-allowed' 
                        : hoveredRoom === room.roomNumber
                        ? getRoomStatusColor(room.status)
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
                      
                      <Badge variant="outline" className={`mb-2 ${getRoomStatusColor(room.status)}`}>
                        {room.status === 'out-of-order' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {getRoomStatusText(room.status)}
                      </Badge>
                      
                      {room.isOccupied && room.guest ? (
                        <div className="space-y-1">
                          <div className="text-xs">
                            {room.guest.primaryGuest.firstName} {room.guest.primaryGuest.lastName}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full text-xs"
                          >
                            View Details
                          </Button>
                        </div>
                      ) : room.status === 'cleaning' ? (
                        <div className="space-y-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRoomStatusChange(room.roomNumber, 'available');
                            }}
                          >
                            Mark as Clean
                          </Button>
                        </div>
                      ) : room.status === 'available' ? (
                        <div className="space-y-1">
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full text-xs mb-1"
                          >
                            Click to Book
                          </Button>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRoomStatusChange(room.roomNumber, 'out-of-order');
                              }}
                            >
                              Out of Order
                            </Button>
                            {onRoomTransferOpen && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRoomTransferOpen(room.roomNumber);
                                }}
                              >
                                Transfer
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : room.status === 'out-of-order' ? (
                        <div className="space-y-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRoomStatusChange(room.roomNumber, 'available');
                            }}
                          >
                            Mark Available
                          </Button>
                        </div>
                      ) : null}
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
