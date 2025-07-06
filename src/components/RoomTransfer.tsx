
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import GuestRegistrationService from '@/services/GuestRegistrationService';
import hotel from '@/services/hotel';

interface RoomTransferProps {
  isOpen: boolean;
  onClose: () => void;
  targetRoomNumber?: string;
  onRefresh?: () => void;
}

const RoomTransfer = ({ isOpen, onClose, targetRoomNumber, onRefresh }: RoomTransferProps) => {
  const [occupiedRooms, setOccupiedRooms] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [newRoomNumber, setNewRoomNumber] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadRoomData();
      if (targetRoomNumber) {
        setNewRoomNumber(targetRoomNumber);
      }
    }
  }, [isOpen, targetRoomNumber]);

  const loadRoomData = async () => {
    try {
      // Get all bookings from the service
      const response = await GuestRegistrationService.getAllRegistrations();
      const bookings = response.data || [];

      // Get currently occupied rooms
      const occupied = bookings.filter((booking: any) => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const today = new Date();
        return today >= checkIn && today <= checkOut && booking.status === 'active';
      });

      setOccupiedRooms(occupied);

      const hotelConfigResponse = await hotel.getHotelConfig();
      const hotelConfig = (hotelConfigResponse).data[0];
      console.log('Hotel Config:', hotelConfig);
      const allRooms: string[] = [];
      if (hotelConfig && hotelConfig.totalFloors && hotelConfig.roomsPerFloor) {
        const totalFloors = Number(hotelConfig.totalFloors);
        const roomsPerFloor = Number(hotelConfig.roomsPerFloor);
        for (let floor = 1; floor <= totalFloors; floor++) {
          for (let room = 1; room <= roomsPerFloor; room++) {
            // Format room number as e.g. 201, 305, etc.
            const roomNumber = `${floor}${room.toString().padStart(2, '0')}`;
            allRooms.push(roomNumber);
          }
        }
      }

      const available = allRooms.filter(roomNumber => {
        const isOccupied = occupied.some((booking: any) => booking.roomNumber === roomNumber);
        return !isOccupied;
      });

      setAvailableRooms(available);
    } catch (error) {
      console.error('Error loading room data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load room data',
      });
    }
  };

  const handleTransfer = async () => {
    if (!selectedBooking || !newRoomNumber || !transferReason) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
      });
      return;
    }

    const selectedBookingData = occupiedRooms.find((b: any) => b.id.toString() === selectedBooking);

    if (!selectedBookingData) {
      toast({
        title: "Error",
        description: "Selected booking not found",
      });
      return;
    }

    // Check if new room is still available
    const isNewRoomAvailable = availableRooms.includes(newRoomNumber);
    if (!isNewRoomAvailable) {
      toast({
        title: "Room Not Available",
        description: "Selected room is no longer available",
      });
      return;
    }

    try {
      // Create transfer record
      const transferRecord = {
        id: Date.now(),
        originalBookingId: selectedBookingData.id,
        guestName: `${selectedBookingData.primaryGuest.firstName} ${selectedBookingData.primaryGuest.lastName}`,
        fromRoom: selectedBookingData.roomNumber,
        toRoom: newRoomNumber,
        transferReason,
        remarks,
        transferredAt: new Date().toISOString(),
        transferredBy: 'Admin' // This would come from user session
      };

      // Update booking with new room number
      const updatedBooking = {
        ...selectedBookingData,
        roomNumber: newRoomNumber,
        transferHistory: [...(selectedBookingData.transferHistory || []), transferRecord]
      };

      const formData = new FormData();
      formData.append('booking', JSON.stringify(updatedBooking));

      await GuestRegistrationService.updateRegistration(selectedBookingData.id, formData);

      toast({
        title: "Room Transfer Successful",
        description: `Guest moved from Room ${selectedBookingData.roomNumber} to Room ${newRoomNumber}`
      });

      // Reset form
      setSelectedBooking('');
      setNewRoomNumber('');
      setTransferReason('');
      setRemarks('');

      onClose();

      // Trigger refresh if callback is provided
      if (onRefresh) {
        onRefresh();
      }

      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (error) {
      console.error('Error during room transfer:', error);
      toast({
        title: "Transfer Failed",
        description: "An error occurred during room transfer",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Room Transfer</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Guest to Transfer</Label>
                <select
                  value={selectedBooking}
                  onChange={(e) => setSelectedBooking(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="">Select a guest</option>
                  {occupiedRooms.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      Room {booking.roomNumber} - {booking.primaryGuest.firstName} {booking.primaryGuest.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>New Room Number</Label>
                <select
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="">Select new room</option>
                  {availableRooms.map((roomNumber) => (
                    <option key={roomNumber} value={roomNumber}>
                      Room {roomNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Transfer Reason</Label>
                <select
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="">Select reason</option>
                  <option value="technical_issue">Technical Issue</option>
                  <option value="maintenance">Room Maintenance</option>
                  <option value="guest_request">Guest Request</option>
                  <option value="room_upgrade">Room Upgrade</option>
                  <option value="noise_complaint">Noise Complaint</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Remarks / Additional Details</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter any additional details about the transfer..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {selectedBooking && (
            <Card>
              <CardHeader>
                <CardTitle>Current Guest Details</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const booking = occupiedRooms.find(b => b.id.toString() === selectedBooking);
                  if (!booking) return null;

                  return (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Guest Name</Label>
                        <p className="font-medium">
                          {booking.primaryGuest.firstName} {booking.primaryGuest.lastName}
                        </p>
                      </div>
                      <div>
                        <Label>Current Room</Label>
                        <p className="font-medium">{booking.roomNumber}</p>
                      </div>
                      <div>
                        <Label>Mobile</Label>
                        <p className="font-medium">{booking.primaryGuest.mobile}</p>
                      </div>
                      <div>
                        <Label>Check-in Date</Label>
                        <p className="font-medium">{booking.checkInDate}</p>
                      </div>
                      <div>
                        <Label>Total Guests</Label>
                        <p className="font-medium">{booking.totalGuests}</p>
                      </div>
                      <div>
                        <Label>Remaining Payment</Label>
                        <p className="font-medium text-red-600">₹{booking.remainingPayment}</p>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!selectedBooking || !newRoomNumber || !transferReason}
            >
              Transfer Room
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomTransfer;
