
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useGuestStore } from '@/store/guestStore';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, ArrowRight, Clock } from 'lucide-react';
import HotelService from '@/services/hotel';
import DashboardService from '@/services/DashboardService';
import GuestRegistrationService from '@/services/GuestRegistrationService';

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
  status: 'available' | 'booked' | 'cleaning' | 'unavailable';
  hasWakeUpCall?: boolean;
}

const RoomGrid = ({ selectedDate, onBulkBookingOpen, onRoomTransferOpen, onRoomStatusChange }: RoomGridProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [wakeUpAlert, setWakeUpAlert] = useState<string>('');
  const { openGuestForm, openGuestDetails } = useGuestStore();

  useEffect(() => {
    generateRooms();

    const handleRefresh = () => {
      generateRooms();
    };
    window.addEventListener('refreshDashboard', handleRefresh);

    return () => window.removeEventListener('refreshDashboard', handleRefresh);
  }, [selectedDate]);

  const generateRooms = async () => {
    try {
      const [hotelConfigResponse, bookingsResponse, roomStatusesResponse] = await Promise.all([
        HotelService.getHotelConfig(),
        GuestRegistrationService.getAllRegistrations(),
        DashboardService.getRoomStatuses(),
      ]);

      const hotelConfig = hotelConfigResponse.data || {};
      const bookings = bookingsResponse.data || [];
      const roomStatuses = roomStatusesResponse.data || {};
      const todayString = format(selectedDate, 'yyyy-MM-dd');

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
              status: status as any,
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
              selectedDate <= checkOut &&
              booking.status === 'active';
          });

          const typeIndex = (room - 1) % roomTypes.length;
          const roomType = roomTypes[typeIndex] || { name: 'Regular', price: 1000 };

          let status = roomStatuses[roomNumber] || 'available';
          if (roomBooking) {
            status = 'booked';
          }

          generatedRooms.push({
            roomNumber,
            floor,
            type: roomType.name,
            price: roomType.price,
            isOccupied: !!roomBooking,
            guest: roomBooking || null,
            status: status as any,
          });
        }
      }

      setRooms(generatedRooms);
    } catch (error) {
      console.error('Error generating rooms:', error);
      // Fallback to default rooms if service calls fail
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
            guest: null,
            status: 'available',
            hasWakeUpCall: false
          });
        }
      }
      setRooms(defaultRooms);
    }
  };

  const handleRoomClick = (room: Room) => {
    if (room.status === 'unavailable') {
      return; // Don't allow any action on unavailable rooms
    }

    if (room.isOccupied && room.guest) {
      openGuestDetails(room.guest);
    } else if (room.status === 'available') {
      openGuestForm(room.roomNumber, selectedDate);
    }
  };

  const handleRoomStatusChange = async (roomNumber: string, newStatus: string) => {
    try {
      await DashboardService.updateRoomStatus(roomNumber, newStatus);

      if (onRoomStatusChange) {
        onRoomStatusChange(roomNumber, newStatus);
      }

      generateRooms();
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (error) {
      console.error('Error updating room status:', error);
    }
  };

  const handleCheckout = async (roomNumber: string) => {
    try {
      // Update room status to cleaning after checkout
      await handleRoomStatusChange(roomNumber, 'cleaning');
    } catch (error) {
      console.error('Error during checkout:', error);
    }
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'booked':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'cleaning':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      case 'unavailable':
        return 'bg-orange-50 border-orange-200 hover:bg-orange-100';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getRoomStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'booked':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'cleaning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'unavailable':
        return 'bg-orange-500 hover:bg-orange-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getRoomStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'booked':
        return 'Occupied';
      case 'cleaning':
        return 'Cleaning';
      case 'unavailable':
        return 'Out of Order';
      default:
        return 'Unknown';
    }
  };

  const getActionButtonText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Click to Book';
      case 'booked':
        return 'View Details';
      case 'cleaning':
        return 'Mark Available';
      case 'unavailable':
        return 'Mark Available';
      default:
        return 'Click to Book';
    }
  };

  const getActionButtonColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 hover:text-green-700';
      case 'booked':
        return 'text-red-600 hover:text-red-700';
      case 'cleaning':
        return 'text-yellow-600 hover:text-yellow-700';
      case 'unavailable':
        return 'text-orange-600 hover:text-orange-700';
      default:
        return 'text-gray-600 hover:text-gray-700';
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
    <Card className="bg-white">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Rooms Status - {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </CardTitle>
          {onBulkBookingOpen && (
            <Button onClick={onBulkBookingOpen} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Users className="h-4 w-4 mr-2" />
              Bulk Booking
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {Object.entries(groupedRooms).map(([floor, floorRooms]) => (
          <div key={floor} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Floor {floor}
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {floorRooms.map((room) => (
                <div
                  key={room.roomNumber}
                  className={`relative border-2 rounded-lg p-4 transition-all duration-200 hover:shadow-md ${getRoomStatusColor(room.status)}`}
                >
                  {/* Room Header */}
                  <div className="text-center mb-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Room</div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {room.roomNumber}
                    </div>

                    {/* Status Badge */}
                    <div className="mb-3">
                      <Badge className={`${getRoomStatusBadgeColor(room.status)} px-3 py-1 text-sm font-medium`}>
                        {getRoomStatusText(room.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* Primary Action Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-full ${getActionButtonColor(room.status)} font-medium`}
                      onClick={() => {
                        if (room.status === 'available') {
                          handleRoomClick(room);
                        } else if (room.status === 'booked') {
                          handleRoomClick(room);
                        } else if (room.status === 'cleaning' || room.status === 'unavailable') {
                          handleRoomStatusChange(room.roomNumber, 'available');
                        }
                      }}
                    >
                      {getActionButtonText(room.status)}
                    </Button>

                    {/* Transfer Button - Show only for booked rooms */}
                    {room.status === 'booked' && onRoomTransferOpen && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                        onClick={() => onRoomTransferOpen(room.roomNumber)}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Transfer
                      </Button>
                    )}

                    {/* Mark Out of Order Button - Show by default for available/cleaning rooms */}
                    {(room.status === 'available' || room.status === 'cleaning') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                        onClick={() => handleRoomStatusChange(room.roomNumber, 'unavailable')}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Mark Out of Order
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RoomGrid;
