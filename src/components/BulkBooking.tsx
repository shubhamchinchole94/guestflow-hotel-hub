
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BulkBookingProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

const BulkBooking = ({ isOpen, onClose, selectedDate }: BulkBookingProps) => {
  const [formData, setFormData] = useState({
    guestName: '',
    mobile: '',
    email: '',
    numberOfRooms: 1,
    checkInDate: '',
    checkOutDate: '',
    farePerRoom: 1000,
    advancePayment: 0,
    companyId: '',
    remarks: ''
  });
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        checkInDate: format(selectedDate, 'yyyy-MM-dd'),
        checkOutDate: format(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
      }));
      loadAvailableRooms();
      loadCompanies();
    }
  }, [isOpen, selectedDate]);

  const loadAvailableRooms = () => {
    const hotelConfig = JSON.parse(localStorage.getItem('hotelConfig') || '{}');
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const roomStatuses = JSON.parse(localStorage.getItem('roomStatuses') || '{}');
    
    const allRooms: string[] = [];
    if (hotelConfig.totalFloors && hotelConfig.roomsPerFloor) {
      for (let floor = 1; floor <= hotelConfig.totalFloors; floor++) {
        for (let room = 1; room <= hotelConfig.roomsPerFloor; room++) {
          const roomNumber = `${floor}0${room}`;
          allRooms.push(roomNumber);
        }
      }
    }

    // Filter out occupied and out-of-order rooms
    const available = allRooms.filter(roomNumber => {
      const isOccupied = bookings.some((booking: any) => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        return booking.roomNumber === roomNumber && 
               selectedDate >= checkIn && 
               selectedDate <= checkOut;
      });
      
      const status = roomStatuses[roomNumber];
      return !isOccupied && status !== 'out-of-order';
    });

    setAvailableRooms(available);
  };

  const loadCompanies = () => {
    const savedCompanies = localStorage.getItem('companies');
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    }
  };

  const handleRoomSelection = (roomNumber: string, checked: boolean) => {
    if (checked) {
      if (selectedRooms.length < formData.numberOfRooms) {
        setSelectedRooms(prev => [...prev, roomNumber]);
      } else {
        toast({
          title: "Room Limit Reached",
          description: `You can only select ${formData.numberOfRooms} rooms`,
          variant: "destructive"
        });
      }
    } else {
      setSelectedRooms(prev => prev.filter(room => room !== roomNumber));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRooms.length !== formData.numberOfRooms) {
      toast({
        title: "Room Selection Error",
        description: `Please select exactly ${formData.numberOfRooms} rooms`,
        variant: "destructive"
      });
      return;
    }

    const selectedCompany = companies.find(c => c.id === formData.companyId);
    let totalAmount = formData.farePerRoom * formData.numberOfRooms;
    
    if (selectedCompany) {
      const discount = (totalAmount * selectedCompany.roomPriceDiscount) / 100;
      totalAmount = totalAmount - discount;
    }

    const bulkBooking = {
      id: Date.now(),
      type: 'bulk',
      guestName: formData.guestName,
      mobile: formData.mobile,
      email: formData.email,
      rooms: selectedRooms,
      numberOfRooms: formData.numberOfRooms,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      farePerRoom: formData.farePerRoom,
      totalAmount,
      advancePayment: formData.advancePayment,
      remainingPayment: totalAmount - formData.advancePayment,
      companyDetails: selectedCompany,
      remarks: formData.remarks,
      createdAt: new Date().toISOString()
    };

    // Create individual bookings for each room
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    selectedRooms.forEach((roomNumber, index) => {
      const roomBooking = {
        id: Date.now() + index,
        roomNumber,
        primaryGuest: {
          firstName: formData.guestName.split(' ')[0] || formData.guestName,
          lastName: formData.guestName.split(' ').slice(1).join(' ') || '',
          mobile: formData.mobile,
          email: formData.email,
          address: 'Bulk booking - details to be updated',
          identityProof: 'bulk',
          identityNumber: 'BULK' + Date.now()
        },
        familyMembers: [],
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        checkInTime: '14:00',
        checkOutTime: '12:00',
        farePerNight: formData.farePerRoom,
        advancePayment: Math.floor(formData.advancePayment / formData.numberOfRooms),
        remainingPayment: Math.floor((totalAmount - formData.advancePayment) / formData.numberOfRooms),
        companyDetails: selectedCompany,
        isBulkBooking: true,
        bulkBookingId: bulkBooking.id,
        remarks: formData.remarks,
        totalGuests: 1,
        createdAt: new Date().toISOString()
      };
      
      bookings.push(roomBooking);
    });

    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    // Save bulk booking record
    const bulkBookings = JSON.parse(localStorage.getItem('bulkBookings') || '[]');
    bulkBookings.push(bulkBooking);
    localStorage.setItem('bulkBookings', JSON.stringify(bulkBookings));

    toast({
      title: "Bulk Booking Successful",
      description: `${formData.numberOfRooms} rooms booked successfully`
    });

    onClose();
    window.dispatchEvent(new CustomEvent('refreshDashboard'));
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      guestName: '',
      mobile: '',
      email: '',
      numberOfRooms: 1,
      checkInDate: '',
      checkOutDate: '',
      farePerRoom: 1000,
      advancePayment: 0,
      companyId: '',
      remarks: ''
    });
    setSelectedRooms([]);
  };

  const totalAmount = formData.farePerRoom * formData.numberOfRooms;
  const selectedCompany = companies.find(c => c.id === formData.companyId);
  const discountAmount = selectedCompany ? (totalAmount * selectedCompany.roomPriceDiscount) / 100 : 0;
  const finalAmount = totalAmount - discountAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Room Booking</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Guest Name</Label>
                  <Input
                    value={formData.guestName}
                    onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    maxLength={10}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email (Optional)</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Company (Optional)</Label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">Walk-in Guest</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.companyName} - {company.roomPriceDiscount}% discount
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Number of Rooms</Label>
                  <Input
                    type="number"
                    min="1"
                    max={availableRooms.length}
                    value={formData.numberOfRooms}
                    onChange={(e) => {
                      const newCount = parseInt(e.target.value);
                      setFormData(prev => ({ ...prev, numberOfRooms: newCount }));
                      setSelectedRooms(prev => prev.slice(0, newCount));
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-in Date</Label>
                  <Input
                    type="date"
                    value={formData.checkInDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkInDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-out Date</Label>
                  <Input
                    type="date"
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkOutDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fare per Room</Label>
                  <Input
                    type="number"
                    value={formData.farePerRoom}
                    onChange={(e) => setFormData(prev => ({ ...prev, farePerRoom: parseInt(e.target.value) }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Advance Payment</Label>
                  <Input
                    type="number"
                    value={formData.advancePayment}
                    onChange={(e) => setFormData(prev => ({ ...prev, advancePayment: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max={finalAmount}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Any special requirements or notes"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Rooms ({selectedRooms.length}/{formData.numberOfRooms})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                {availableRooms.map((roomNumber) => (
                  <div key={roomNumber} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={roomNumber}
                      checked={selectedRooms.includes(roomNumber)}
                      onChange={(e) => handleRoomSelection(roomNumber, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={roomNumber} className="text-sm">
                      Room {roomNumber}
                    </Label>
                  </div>
                ))}
              </div>
              {availableRooms.length === 0 && (
                <p className="text-center text-gray-500 py-4">No rooms available for the selected date</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Rooms ({formData.numberOfRooms} × ₹{formData.farePerRoom}):</span>
                  <span>₹{totalAmount}</span>
                </div>
                {selectedCompany && (
                  <div className="flex justify-between text-green-600">
                    <span>Company Discount ({selectedCompany.roomPriceDiscount}%):</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>₹{finalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advance Payment:</span>
                  <span>₹{formData.advancePayment}</span>
                </div>
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Remaining Payment:</span>
                  <span>₹{finalAmount - formData.advancePayment}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={selectedRooms.length !== formData.numberOfRooms}
            >
              Confirm Bulk Booking
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BulkBooking;
