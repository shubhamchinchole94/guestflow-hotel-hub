
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
        return 'bg-green-100 border-green-300';
      case 'booked':
        return 'bg-red-100 border-red-300';
      case 'cleaning':
        return 'bg-yellow-100 border-yellow-300';
      case 'unavailable':
        return 'bg-orange-100 border-orange-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getRoomStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 text-white';
      case 'booked':
        return 'bg-red-500 text-white';
      case 'cleaning':
        return 'bg-yellow-500 text-white';
      case 'unavailable':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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

  const groupedRooms = rooms.reduce((acc: Record<number, Room[]>, room) => {
    if (!acc[room.floor]) {
      acc[room.floor] = [];
    }
    acc[room.floor].push(room);
    return acc;
  }, {});

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              Rooms Status - {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
            {onBulkBookingOpen && (
              <Button onClick={onBulkBookingOpen} size="sm" className="bg-gray-800 hover:bg-gray-700 text-white">
                <Users className="h-4 w-4 mr-2" />
                Bulk Booking
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {Object.entries(groupedRooms).map(([floor, floorRooms]) => (
              <div key={floor}>
                <h3 className="text-lg font-semibold mb-4">Floor {floor}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {floorRooms.map((room) => (
                    <div
                      key={room.roomNumber}
                      className={`relative bg-white border-2 rounded-lg overflow-hidden transition-all duration-200 ${getRoomStatusColor(room.status)} ${
                        hoveredRoom === room.roomNumber ? 'shadow-lg transform scale-105' : 'shadow-sm'
                      }`}
                      onMouseEnter={() => setHoveredRoom(room.roomNumber)}
                      onMouseLeave={() => setHoveredRoom(null)}
                    >
                      {/* Room Header */}
                      <div className="p-4 text-center">
                        <div className="text-lg font-bold mb-1">Room</div>
                        <div className="text-2xl font-bold text-gray-800 mb-2">
                          {room.roomNumber}
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          {room.type} - ₹{room.price}/night
                        </div>

                        {/* Status Badge */}
                        <div className="mb-4">
                          <Badge className={`${getRoomStatusBadgeColor(room.status)} px-3 py-1`}>
                            {getRoomStatusText(room.status)}
                          </Badge>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="bg-gray-800 p-3 space-y-2">
                        {room.status === 'available' ? (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                              onClick={() => handleRoomClick(room)}
                            >
                              Click to Book
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs bg-white text-gray-800 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRoomStatusChange(room.roomNumber, 'unavailable');
                                }}
                              >
                                Out of Order
                              </Button>
                              {onRoomTransferOpen && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs bg-white text-gray-800 hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRoomTransferOpen(room.roomNumber);
                                  }}
                                >
                                  Transfer Here
                                </Button>
                              )}
                            </div>
                          </>
                        ) : room.status === 'booked' && room.isOccupied ? (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                              onClick={() => handleRoomClick(room)}
                            >
                              Click to Book
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs bg-white text-gray-800 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRoomStatusChange(room.roomNumber, 'unavailable');
                                }}
                              >
                                Out of Order
                              </Button>
                              {onRoomTransferOpen && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs bg-white text-gray-800 hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRoomTransferOpen(room.roomNumber);
                                  }}
                                >
                                  Transfer Here
                                </Button>
                              )}
                            </div>
                          </>
                        ) : room.status === 'cleaning' ? (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRoomStatusChange(room.roomNumber, 'available');
                              }}
                            >
                              Click to Book
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs bg-white text-gray-800 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRoomStatusChange(room.roomNumber, 'unavailable');
                                }}
                              >
                                Out of Order
                              </Button>
                              {onRoomTransferOpen && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs bg-white text-gray-800 hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRoomTransferOpen(room.roomNumber);
                                  }}
                                >
                                  Transfer Here
                                </Button>
                              )}
                            </div>
                          </>
                        ) : room.status === 'unavailable' ? (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRoomStatusChange(room.roomNumber, 'available');
                              }}
                            >
                              Click to Book
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs bg-white text-gray-800 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRoomStatusChange(room.roomNumber, 'unavailable');
                                }}
                              >
                                Out of Order
                              </Button>
                              {onRoomTransferOpen && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs bg-white text-gray-800 hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRoomTransferOpen(room.roomNumber);
                                  }}
                                >
                                  Transfer Here
                                </Button>
                              )}
                            </div>
                          </>
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
