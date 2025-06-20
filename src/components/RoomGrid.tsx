
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useGuestStore } from '@/store/guestStore';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, ArrowRight, Clock } from 'lucide-react';

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
  hasWakeUpCall?: boolean;
}

const RoomGrid = ({ selectedDate, onBulkBookingOpen, onRoomTransferOpen, onRoomStatusChange }: RoomGridProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [wakeUpAlert, setWakeUpAlert] = useState<string>('');
  const { openGuestForm, openGuestDetails } = useGuestStore();

  useEffect(() => {
    generateRooms();
    checkWakeUpCalls();
    
    const handleRefresh = () => {
      generateRooms();
      checkWakeUpCalls();
    };
    window.addEventListener('refreshDashboard', handleRefresh);
    
    return () => window.removeEventListener('refreshDashboard', handleRefresh);
  }, [selectedDate]);

  const checkWakeUpCalls = () => {
    const wakeUpCalls = JSON.parse(localStorage.getItem('wakeUpCalls') || '[]');
    const todayString = format(selectedDate, 'yyyy-MM-dd');
    const currentTime = new Date();
    
    const todaysWakeUpCalls = wakeUpCalls.filter((call: any) => call.date === todayString);
    
    todaysWakeUpCalls.forEach((call: any) => {
      const [hours, minutes] = call.time.split(':');
      const wakeUpTime = new Date();
      wakeUpTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const timeDiff = wakeUpTime.getTime() - currentTime.getTime();
      const minutesUntilWakeUp = Math.floor(timeDiff / (1000 * 60));
      
      if (minutesUntilWakeUp >= 0 && minutesUntilWakeUp <= 30) {
        setWakeUpAlert(`Wake-up call for Room ${call.roomNumber} (${call.guestName}) at ${call.time}`);
        setTimeout(() => setWakeUpAlert(''), 10000); // Hide after 10 seconds
      }
    });
  };

  const generateRooms = () => {
    const hotelConfig = JSON.parse(localStorage.getItem('hotelConfig') || '{}');
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const roomStatuses = JSON.parse(localStorage.getItem('roomStatuses') || '{}');
    const wakeUpCalls = JSON.parse(localStorage.getItem('wakeUpCalls') || '[]');
    const todayString = format(selectedDate, 'yyyy-MM-dd');
    
    if (!hotelConfig.totalFloors || !hotelConfig.roomsPerFloor) {
      const defaultRooms: Room[] = [];
      for (let floor = 1; floor <= 2; floor++) {
        for (let room = 1; room <= 4; room++) {
          const roomNumber = `${floor}0${room}`;
          const status = roomStatuses[roomNumber] || 'available';
          const hasWakeUpCall = wakeUpCalls.some((call: any) => 
            call.roomNumber === roomNumber && call.date === todayString
          );
          
          defaultRooms.push({
            roomNumber,
            floor,
            type: 'Regular',
            price: 1000,
            isOccupied: false,
            guest: null,
            status: status as any,
            hasWakeUpCall
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

        const hasWakeUpCall = wakeUpCalls.some((call: any) => 
          call.roomNumber === roomNumber && call.date === todayString
        );

        generatedRooms.push({
          roomNumber,
          floor,
          type: roomType.name,
          price: roomType.price,
          isOccupied: !!roomBooking,
          guest: roomBooking || null,
          status: status as any,
          hasWakeUpCall
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

  const getRoomStatusColor = (status: string, hasWakeUpCall?: boolean) => {
    let baseColor = '';
    switch (status) {
      case 'available':
        baseColor = 'bg-green-100 border-green-300 text-green-800';
        break;
      case 'occupied':
        baseColor = 'bg-red-100 border-red-300 text-red-800';
        break;
      case 'cleaning':
        baseColor = 'bg-yellow-100 border-yellow-300 text-yellow-800';
        break;
      case 'out-of-order':
        baseColor = 'bg-gray-100 border-gray-400 text-gray-600';
        break;
      default:
        baseColor = 'bg-gray-100 border-gray-300 text-gray-800';
    }
    
    if (hasWakeUpCall) {
      return baseColor + ' ring-2 ring-orange-400 ring-offset-2';
    }
    
    return baseColor;
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
    <>
      {/* Wake Up Call Alert */}
      {wakeUpAlert && (
        <div className="fixed top-4 right-4 bg-orange-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Wake-up Call Alert!</span>
          </div>
          <p className="text-sm mt-1">{wakeUpAlert}</p>
        </div>
      )}

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
                          ? getRoomStatusColor(room.status, room.hasWakeUpCall)
                          : 'bg-card border-border hover:border-primary'
                      } ${room.hasWakeUpCall ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}
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
                        
                        <div className="flex flex-col items-center space-y-1">
                          <Badge variant="outline" className={`${getRoomStatusColor(room.status, room.hasWakeUpCall)}`}>
                            {room.status === 'out-of-order' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {getRoomStatusText(room.status)}
                          </Badge>
                          
                          {room.hasWakeUpCall && (
                            <Badge variant="outline" className="bg-orange-100 border-orange-300 text-orange-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Wake-up Call
                            </Badge>
                          )}
                        </div>
                        
                        {room.isOccupied && room.guest ? (
                          <div className="space-y-1 mt-2">
                            <div className="text-xs text-blue-600 font-medium">
                              Guest Checked In
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full text-xs mb-1"
                            >
                              View Details
                            </Button>
                            {onRoomTransferOpen && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRoomTransferOpen(room.roomNumber);
                                }}
                              >
                                <ArrowRight className="h-3 w-3 mr-1" />
                                Transfer
                              </Button>
                            )}
                          </div>
                        ) : room.status === 'cleaning' ? (
                          <div className="space-y-1 mt-2">
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
                          <div className="space-y-1 mt-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full text-xs mb-1"
                            >
                              Click to Book
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRoomStatusChange(room.roomNumber, 'out-of-order');
                              }}
                            >
                              Out of Order
                            </Button>
                          </div>
                        ) : room.status === 'out-of-order' ? (
                          <div className="space-y-1 mt-2">
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
    </>
  );
};

export default RoomGrid;
