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
import { stringify } from 'querystring';
import RoomService from '@/services/RoomService';
import { Navigate, useNavigate } from 'react-router-dom';
import { json } from 'stream/consumers';

interface RoomGridProps {
  selectedDate: Date;
  onBulkBookingOpen?: () => void;
  onRoomTransferOpen?: (roomNumber: string) => void;
  onRoomStatusChange?: (roomNumber: string, status: string) => void;
  openGuestForm?: (roomNumber: string, selectedDate: Date) => void;
  onViewGuestDetailsOpen?: (guest: any) => void; // New prop for viewing guest details
}

export type RoomStatus = 'available' | 'booked' | 'cleaning' | 'unavailable' | 'room_transferred';

interface Room {
  roomNumber: string;
  floor: number;
  type: string;
  price: number;
  isOccupied: boolean;
  guest: any | null;
  status: RoomStatus;
  hasWakeUpCall?: boolean;
}

const RoomGrid = ({ selectedDate, onBulkBookingOpen, onRoomTransferOpen, onRoomStatusChange, onViewGuestDetailsOpen }: RoomGridProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [wakeUpAlert, setWakeUpAlert] = useState<string>('');
  const { openGuestForm: storeOpenGuestForm } = useGuestStore();

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
      RoomService.getAllRooms(),
    ]);

    const hotelConfig = hotelConfigResponse.data || {};
    const bookings = bookingsResponse.data || [];
    const roomStatuses = roomStatusesResponse.data || [];
    const todayString = format(selectedDate, 'yyyy-MM-dd');

    const defaultRooms: Room[] = [];

    if (hotelConfig.totalFloors && hotelConfig.roomsPerFloor) {
      const totalFloors = hotelConfig.totalFloors;
      const roomsPerFloor = hotelConfig.roomsPerFloor;

      for (let floor = 1; floor <= totalFloors; floor++) {
      for (let room = 1; room <= roomsPerFloor; room++) {
        const roomNumber = `${floor}0${room}`;

        // Find booking for this roomNumber
        const roomBooking = bookings.find((booking: any) => booking.roomNumber === roomNumber);

        // Find status for this roomNumber in roomStatuses
        const manualRoomStatus = Array.isArray(roomStatuses)
        ? roomStatuses.find((r: any) => r.roomNumber === roomNumber)?.status
        : roomStatuses[roomNumber];

        let finalStatus: RoomStatus = 'available';

        if (roomBooking) {
        // If booking exists, use status from roomStatuses if present, else use booking.status
        if (manualRoomStatus) {
          finalStatus = manualRoomStatus;
        } else if (roomBooking.status) {
          finalStatus = roomBooking.status;
        }
        } else if (manualRoomStatus) {
        // If no booking, but status exists in roomStatuses, use it
        finalStatus = manualRoomStatus;
        }

        // Assign room type
        const typeIndex = ((floor - 1) * roomsPerFloor + (room - 1)) % (hotelConfig.roomTypes?.length || 1);
        const roomType = hotelConfig.roomTypes?.[typeIndex] || {
        name: 'Regular',
        price: 1000,
        status: finalStatus,
        };

        defaultRooms.push({
        roomNumber,
        floor,
        type: roomType.name,
        price: roomType.price,
        isOccupied: !!roomBooking,
        guest: roomBooking,
        status: finalStatus,
        });
      }
      }

      setRooms(defaultRooms);
    }
  } catch (error) {
    console.error('Error generating rooms:', error);
  }
};


  const navigate = useNavigate();
  const handleRoomClick = (room: Room) => {
    if (room.status === 'unavailable') {
      alert('This room is currently out of order.');
      RoomService.updateRoomStatus(room.roomNumber, 'available');
      navigate('/dashboard');
      return;
    }

    // alert(JSON.stringify(room));
    if (room.status === 'booked' || room.status === 'room_transferred' && room.guest) {
      onViewGuestDetailsOpen?.(room.guest);
    } else if (room.status === 'available') {
      if (typeof storeOpenGuestForm === 'function') {
        storeOpenGuestForm(room.roomNumber, selectedDate);
      }
    }
  };

  const handleRoomStatusChange = async (roomNumber: string, newStatus: string) => {
    try {
      // Update the status locally in the rooms state
      // Call RoomService to update the status in the backend
      await RoomService.updateRoomStatus(roomNumber, newStatus);

      // Update the status locally in the rooms state
      // setRooms((prevRooms) =>
      //   prevRooms.map((room) =>
      //     room.roomNumber === roomNumber
      //   ? { ...room, status: newStatus as Room['status'], isOccupied: newStatus === 'booked' }
      //   : room
      //   )
      // );

      // Optionally notify parent
      if (onRoomStatusChange) {
        onRoomStatusChange(roomNumber, newStatus);
      }
    } catch (error) {
      console.error('Error updating room status:', error);
    }
  };

  const handleCheckout = async (roomNumber: string) => {
    try {
      // Update room status to cleaning after checkout
      await handleRoomStatusChange(roomNumber, 'cleaning');
      // Close the modal and refresh the room grid
      //setIsGuestDetailsOpen(false);
      //setSelectedGuest(null);
      generateRooms(); // Refresh the room data
    } catch (error) {
      console.error('Error during checkout:', error);
    }
  };

  // const closeGuestDetails = () => {
  //   setIsGuestDetailsOpen(false);
  //   setSelectedGuest(null);
  // };

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
      case 'room_transferred':
        return 'bg-blue-100 border-blue-300 hover:bg-blue-200 text-white';
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
      case 'room_transferred':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getRoomStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'booked':
        return 'Booked';
      case 'checked-out':
        return 'Cleaning';
      case 'unavailable':
        return 'Out of Order';
      case 'room_transferred':
        return 'Room Transferred';
      case 'cleaning':
        return 'Cleaning';
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
      case 'room_transferred':
        return 'View Details';
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
              {floorRooms.map((room) => {
                return (
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
                          } else if (room.status === 'booked' || room.status === 'room_transferred') {
                            handleRoomClick(room);
                          } else if (room.status === 'cleaning' || room.status === 'unavailable' || room.status === 'checked-out') {
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
                          Mark Out of Order
                        </Button>
                      )}
                    </div>
                    {/* Show room type name and price */}
                    <div className="mt-4 flex flex-col items-center">
                      <span className="text-xs text-gray-500">
                        Type: <span className="font-semibold text-gray-700">{room.type}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        Price: <span className="font-semibold text-gray-700">₹{room.price}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RoomGrid;
