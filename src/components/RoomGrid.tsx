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
import GuestDetailsView from './GuestDetailsView';


interface RoomGridProps {

  selectedDate: Date;
  onBulkBookingOpen?: () => void;
  onRoomTransferOpen?: (roomNumber: string) => void;
  onRoomStatusChange?: (roomNumber: string, status: string) => void;
  openGuestForm?: (roomNumber: string, selectedDate: Date) => void;
  onGuestDetailsOpen?: (guest: any) => void;
  
  
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

const RoomGrid = ({ selectedDate, onBulkBookingOpen, onRoomTransferOpen, onRoomStatusChange, onGuestDetailsOpen }: RoomGridProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [wakeUpAlert, setWakeUpAlert] = useState<string>('');
  const { openGuestForm: storeOpenGuestForm } = useGuestStore();
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  const [isGuestDetailsOpen, setIsGuestDetailsOpen] = useState(false);


  
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
      console.log('Hotel Config Response:', hotelConfigResponse);
      console.log('Bookings Response:', bookingsResponse);
      console.log('Room Statuses Response:', roomStatusesResponse);
      const hotelConfig = hotelConfigResponse.data[0] || {};
      const bookings = bookingsResponse.data || [];
      const roomStatuses = roomStatusesResponse.data || {};
      const todayString = format(selectedDate, 'yyyy-MM-dd');

      // Calculate total rooms from roomTypes object if present
      let totalRooms = 0;
      if (hotelConfig.roomTypes && Array.isArray(hotelConfig.roomTypes)) {
        totalRooms = hotelConfig.roomTypes.reduce((sum: number, type: any) => sum + (type.totalRooms || 0), 0);
      }

      // If no totalFloors or roomsPerFloor, fallback to default
      if (hotelConfig.totalFloors || hotelConfig.roomsPerFloor) {

        const defaultRooms: Room[] = [];
        const totalFloors = hotelConfig.totalFloors;
        const roomsPerFloor = hotelConfig.roomsPerFloor;
        for (let floor = 1; floor <= totalFloors; floor++) {
          for (let room = 1; room <= roomsPerFloor; room++) {
            const roomNumber = `${floor}0${room}`;
            const status =
              Array.isArray(roomStatuses)
                ? (roomStatuses.find((r: any) => r.roomNumber === roomNumber)?.status || 'available')
                : (roomStatuses[roomNumber] || 'available');

            const typeIndex = ((floor - 1) * roomsPerFloor + (room - 1)) % (hotelConfig.roomTypes?.length || 1);
            const roomType = hotelConfig.roomTypes?.[typeIndex] || { name: 'Regular', price: 1000, status: status };

            defaultRooms.push({
              roomNumber,
              floor,
              type: roomType.name,
              price: roomType.price,
              isOccupied: false,
              guest: null,
              status: roomType.status || status,
            });
          }
        }
        setRooms(defaultRooms);
        return;
      }

      // If roomTypes is present, iterate all objects and show the data
      if (hotelConfig.roomTypes && Array.isArray(hotelConfig.roomTypes)) {
        let roomIndex = 1;
        const generatedRooms: Room[] = [];
        hotelConfig.roomTypes.forEach((type: any, typeIdx: number) => {
          for (let i = 0; i < (type.totalRooms || 0); i++) {
            // Calculate floor and room number based on index if needed
            const floor = Math.floor((roomIndex - 1) / hotelConfig.roomsPerFloor) + 1;
            const roomOnFloor = ((roomIndex - 1) % hotelConfig.roomsPerFloor) + 1;
            const roomNumber = `${floor}0${roomOnFloor}`;

            const roomBooking = bookings.find((booking: any) => {
              const checkIn = new Date(booking.checkInDate);
              const checkOut = new Date(booking.checkOutDate);
              return booking.roomNumber === roomNumber &&
                selectedDate >= checkIn &&
                selectedDate <= checkOut &&
                booking.status === 'active';
            });

            let status = roomStatuses[roomNumber] || 'available';
            if (roomBooking) {
              status = 'booked';
            }

            generatedRooms.push({
              roomNumber,
              floor,
              type: type.name || 'Regular',
              price: type.price || 1000,
              isOccupied: !!roomBooking,
              guest: roomBooking || null,
              status: status as any,
            });

            roomIndex++;
          }
        });
        setRooms(generatedRooms);
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
            status: 'booked',
            hasWakeUpCall: false
          });
        }
      }
      setRooms(defaultRooms);
    }
  };

  const handleRoomClick = (room: Room) => {
    console.log('handleRoomClick called', room);
    if (room.status === 'unavailable') {
     
      return; // Don't allow any action on unavailable rooms
    }
  if (room.status === 'booked' && room.guest) {
    if (typeof onGuestDetailsOpen === 'function') {
      onGuestDetailsOpen(room.guest);
    } else {
      setSelectedGuest(room.guest);
      setIsGuestDetailsOpen(true);
    }
    console.log('Opening GuestDetailsView for guest:', room.guest);
  } else if (room.status === 'available') {
    if (typeof storeOpenGuestForm === 'function') {
      storeOpenGuestForm(room.roomNumber, selectedDate);
    }
  }
  };

  const handleRoomStatusChange = async (roomNumber: string, newStatus: string) => {
    try {
      // Update the status locally in the rooms state
      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.roomNumber === roomNumber
            ? { ...room, status: newStatus as Room['status'], isOccupied: newStatus === 'booked' }
            : room
        )
      );

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
    } catch (error) {
      console.error('Error during checkout:', error);
    }
  };

  const closeGuestDetails = () => {
    setIsGuestDetailsOpen(false);
    setSelectedGuest(null);
  };

  const getRoomStatusColor = (status: string) => {
    console.log('getRoomStatusColor called with status:', status);
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
        return 'Booked';
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

  // Debug log for modal rendering
  console.log('Rendering GuestDetailsView', { isGuestDetailsOpen, selectedGuest });
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
          console.log('Rendering floor:', floor, 'with rooms:', floorRooms),
          <div key={floor} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Floor {floor}
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {floorRooms.map((room) => {
                // Find the room type details from hotelConfig.roomTypes
                // Fallback to room.type and room.price if not found
                const hotelConfigRoomType = rooms.length > 0 && rooms[0]?.type
                  ? rooms.find((r) => r.roomNumber === room.roomNumber)
                  : null;

                // If you have access to hotelConfig.roomTypes here, you can use it directly.
                // Since hotelConfig is not in scope, fallback to room.type and room.price.
                // If you want to show more details, consider lifting hotelConfig to a higher scope.

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
        {/* Guest Details Modal */}
        

      </CardContent>
      
      {/* Guest Details Modal */}
      {isGuestDetailsOpen && selectedGuest && (
        <GuestDetailsView
          isOpen={isGuestDetailsOpen}
          onClose={closeGuestDetails}
          selectedGuest={selectedGuest}
          onCheckOut={handleCheckout}
        />
      )}
    </Card>
  );
};

export default RoomGrid;
