
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BulkBookingProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

const BulkBooking = ({ isOpen, onClose, selectedDate }: BulkBookingProps) => {
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [hotelConfig, setHotelConfig] = useState<any>({});
  
  const [formData, setFormData] = useState({
    primaryGuest: {
      firstName: '',
      middleName: '',
      lastName: '',
      dob: '',
      mobile: '',
      address: '',
      identityProof: '',
      identityNumber: ''
    },
    checkInTime: '',
    checkOutTime: '',
    checkInDate: '',
    checkOutDate: '',
    stayDuration: '12hr',
    farePerNight: 1000,
    advancePayment: 0,
    companyId: '',
    extraBed: false,
    mealPlan: {
      breakfast: false,
      lunch: false,
      dinner: false
    },
    wakeUpCall: '',
    wakeUpCallTime: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadAvailableRooms();
      loadCompanies();
      loadHotelConfig();
      initializeDates();
    }
  }, [isOpen, selectedDate]);

  const loadAvailableRooms = () => {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const roomStatuses = JSON.parse(localStorage.getItem('roomStatuses') || '{}');
    const hotelConfig = JSON.parse(localStorage.getItem('hotelConfig') || '{}');
    
    const allRooms: string[] = [];
    if (hotelConfig.totalFloors && hotelConfig.roomsPerFloor) {
      for (let floor = 1; floor <= hotelConfig.totalFloors; floor++) {
        for (let room = 1; room <= hotelConfig.roomsPerFloor; room++) {
          const roomNumber = `${floor}0${room}`;
          allRooms.push(roomNumber);
        }
      }
    }
    
    const available = allRooms.filter(roomNumber => {
      const isOccupied = bookings.some((booking: any) => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        return booking.roomNumber === roomNumber && 
               selectedDate >= checkIn && selectedDate <= checkOut;
      });
      const status = roomStatuses[roomNumber];
      return !isOccupied && status !== 'out-of-order' && status !== 'cleaning';
    });
    
    setAvailableRooms(available);
  };

  const loadCompanies = () => {
    const savedCompanies = localStorage.getItem('companies');
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    }
  };

  const loadHotelConfig = () => {
    const savedConfig = localStorage.getItem('hotelConfig');
    if (savedConfig) {
      setHotelConfig(JSON.parse(savedConfig));
    }
  };

  const initializeDates = () => {
    const checkInDate = format(selectedDate, 'yyyy-MM-dd');
    const checkInTime = format(new Date(), 'HH:mm');
    let checkOutDate = checkInDate;
    let checkOutTime = checkInTime;

    if (formData.stayDuration === '12hr') {
      checkOutTime = '12:00';
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      checkOutDate = format(nextDay, 'yyyy-MM-dd');
    } else {
      const checkOutDateTime = new Date(selectedDate);
      checkOutDateTime.setHours(checkOutDateTime.getHours() + 24);
      checkOutDate = format(checkOutDateTime, 'yyyy-MM-dd');
      checkOutTime = checkInTime;
    }
    
    setFormData(prev => ({
      ...prev,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime
    }));
  };

  const toggleRoomSelection = (roomNumber: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomNumber) 
        ? prev.filter(r => r !== roomNumber)
        : [...prev, roomNumber]
    );
  };

  const calculateMealCosts = () => {
    let total = 0;
    if (formData.mealPlan.breakfast && hotelConfig.mealPrices?.breakfast) {
      total += hotelConfig.mealPrices.breakfast;
    }
    if (formData.mealPlan.lunch && hotelConfig.mealPrices?.lunch) {
      total += hotelConfig.mealPrices.lunch;
    }
    if (formData.mealPlan.dinner && hotelConfig.mealPrices?.dinner) {
      total += hotelConfig.mealPrices.dinner;
    }
    return total;
  };

  const calculateTotalAmount = () => {
    const extraBedCost = formData.extraBed ? (hotelConfig.extraBedPrice || 0) : 0;
    const mealCosts = calculateMealCosts();
    const baseAmount = (formData.farePerNight + extraBedCost + mealCosts) * selectedRooms.length;
    
    // Apply company discount if selected
    let finalAmount = baseAmount;
    if (formData.companyId) {
      const selectedCompany = companies.find(c => c.id === formData.companyId);
      if (selectedCompany) {
        const discount = (baseAmount * selectedCompany.roomPriceDiscount) / 100;
        finalAmount = baseAmount - discount;
      }
    }
    
    return { baseAmount, finalAmount };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRooms.length === 0) {
      toast({
        title: "No Rooms Selected",
        description: "Please select at least one room for booking",
        variant: "destructive"
      });
      return;
    }

    const selectedCompany = companies.find(c => c.id === formData.companyId);
    const { finalAmount } = calculateTotalAmount();
    
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    selectedRooms.forEach(roomNumber => {
      const booking = {
        id: Date.now() + Math.random(),
        roomNumber,
        ...formData,
        totalGuests: 1,
        remainingPayment: Math.max(0, finalAmount / selectedRooms.length - formData.advancePayment),
        createdAt: new Date().toISOString(),
        companyDetails: selectedCompany,
        billing: {
          baseFare: formData.farePerNight,
          extraBedCost: formData.extraBed ? (hotelConfig.extraBedPrice || 0) : 0,
          mealCosts: calculateMealCosts(),
          totalBeforeDiscount: formData.farePerNight + (formData.extraBed ? (hotelConfig.extraBedPrice || 0) : 0) + calculateMealCosts(),
          discountAmount: selectedCompany ? ((formData.farePerNight + (formData.extraBed ? (hotelConfig.extraBedPrice || 0) : 0) + calculateMealCosts()) * selectedCompany.roomPriceDiscount) / 100 : 0,
          discountPercentage: selectedCompany?.roomPriceDiscount || 0,
          finalFare: finalAmount / selectedRooms.length,
          gstRate: selectedCompany?.gstPercentage || 0,
          gstAmount: selectedCompany ? ((finalAmount / selectedRooms.length) * selectedCompany.gstPercentage) / 100 : 0,
          grandTotal: selectedCompany ? (finalAmount / selectedRooms.length) + (((finalAmount / selectedRooms.length) * selectedCompany.gstPercentage) / 100) : finalAmount / selectedRooms.length
        },
        isBulkBooking: true,
        bulkBookingRooms: selectedRooms
      };
      
      bookings.push(booking);
    });
    
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    toast({
      title: "Bulk Booking Confirmed",
      description: `${selectedRooms.length} rooms booked successfully for ${formData.primaryGuest.firstName} ${formData.primaryGuest.lastName}`
    });
    
    onClose();
    resetForm();
    window.dispatchEvent(new CustomEvent('refreshDashboard'));
  };

  const resetForm = () => {
    setSelectedRooms([]);
    setFormData({
      primaryGuest: {
        firstName: '',
        middleName: '',
        lastName: '',
        dob: '',
        mobile: '',
        address: '',
        identityProof: '',
        identityNumber: ''
      },
      checkInTime: '',
      checkOutTime: '',
      checkInDate: '',
      checkOutDate: '',
      stayDuration: '12hr',
      farePerNight: 1000,
      advancePayment: 0,
      companyId: '',
      extraBed: false,
      mealPlan: {
        breakfast: false,
        lunch: false,
        dinner: false
      },
      wakeUpCall: '',
      wakeUpCallTime: '',
      notes: ''
    });
  };

  const { baseAmount, finalAmount } = calculateTotalAmount();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Room Booking - {format(selectedDate, 'EEEE, MMMM d, yyyy')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Rooms ({selectedRooms.length} selected)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {availableRooms.map(roomNumber => (
                  <div
                    key={roomNumber}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRooms.includes(roomNumber)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                    onClick={() => toggleRoomSelection(roomNumber)}
                  >
                    <div className="text-center">
                      <div className="font-bold">Room {roomNumber}</div>
                      <div className="text-xs">₹{formData.farePerNight}/night</div>
                    </div>
                  </div>
                ))}
              </div>
              {availableRooms.length === 0 && (
                <p className="text-center text-gray-500 py-4">No rooms available for selected date</p>
              )}
            </CardContent>
          </Card>

          {/* Company Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Company / Marketplace</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Select Company (Optional)</Label>
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

          {/* Primary Guest Details */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Guest Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={formData.primaryGuest.firstName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      primaryGuest: { ...prev.primaryGuest, firstName: e.target.value }
                    }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input
                    value={formData.primaryGuest.middleName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      primaryGuest: { ...prev.primaryGuest, middleName: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={formData.primaryGuest.lastName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      primaryGuest: { ...prev.primaryGuest, lastName: e.target.value }
                    }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.primaryGuest.dob}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      primaryGuest: { ...prev.primaryGuest, dob: e.target.value }
                    }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input
                    value={formData.primaryGuest.mobile}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      primaryGuest: { ...prev.primaryGuest, mobile: e.target.value }
                    }))}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={formData.primaryGuest.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    primaryGuest: { ...prev.primaryGuest, address: e.target.value }
                  }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Identity Proof Type</Label>
                  <select
                    value={formData.primaryGuest.identityProof}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      primaryGuest: { ...prev.primaryGuest, identityProof: e.target.value }
                    }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  >
                    <option value="">Select Identity Proof</option>
                    <option value="aadhar">Aadhar Card</option>
                    <option value="pan">PAN Card</option>
                    <option value="passport">Passport</option>
                    <option value="voter">Voter ID</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Identity Proof Number</Label>
                  <Input
                    value={formData.primaryGuest.identityNumber}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      primaryGuest: { ...prev.primaryGuest, identityNumber: e.target.value }
                    }))}
                    placeholder="Enter ID number"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Services */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Extra Bed */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="extraBed"
                  checked={formData.extraBed}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, extraBed: !!checked }))}
                />
                <Label htmlFor="extraBed" className="text-sm font-medium">
                  Extra Bed (₹{hotelConfig.extraBedPrice || 0} per room)
                </Label>
              </div>

              {/* Meal Plan */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Meal Plan</Label>
                <div className="flex flex-col space-y-3">
                  {hotelConfig.mealPrices && (
                    <>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="breakfast"
                          checked={formData.mealPlan.breakfast}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            mealPlan: { ...prev.mealPlan, breakfast: !!checked }
                          }))}
                        />
                        <Label htmlFor="breakfast" className="text-sm font-medium">
                          Breakfast (₹{hotelConfig.mealPrices.breakfast} per room)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="lunch"
                          checked={formData.mealPlan.lunch}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            mealPlan: { ...prev.mealPlan, lunch: !!checked }
                          }))}
                        />
                        <Label htmlFor="lunch" className="text-sm font-medium">
                          Lunch (₹{hotelConfig.mealPrices.lunch} per room)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="dinner"
                          checked={formData.mealPlan.dinner}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            mealPlan: { ...prev.mealPlan, dinner: !!checked }
                          }))}
                        />
                        <Label htmlFor="dinner" className="text-sm font-medium">
                          Dinner (₹{hotelConfig.mealPrices.dinner} per room)
                        </Label>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Wake Up Call */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Wake Up Call Required</Label>
                  <select
                    value={formData.wakeUpCall}
                    onChange={(e) => setFormData(prev => ({ ...prev, wakeUpCall: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">No Wake Up Call</option>
                    <option value="yes">Yes, Set Wake Up Call</option>
                  </select>
                </div>
                {formData.wakeUpCall === 'yes' && (
                  <div className="space-y-2">
                    <Label>Wake Up Time</Label>
                    <Input
                      type="time"
                      value={formData.wakeUpCallTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, wakeUpCallTime: e.target.value }))}
                      required
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stay Duration & Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Stay Duration & Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration Type</Label>
                  <select
                    value={formData.stayDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, stayDuration: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="12hr">12 Hours (Check-out at 12:00 PM next day)</option>
                    <option value="24hr">24 Hours (From check-in time)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Base Room Fare (per room)</Label>
                  <Input
                    type="number"
                    value={formData.farePerNight}
                    onChange={(e) => setFormData(prev => ({ ...prev, farePerNight: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              {/* Billing Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h4 className="font-semibold mb-2">Billing Summary ({selectedRooms.length} rooms)</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span>₹{baseAmount}</span>
                  </div>
                  {formData.companyId && (
                    <div className="flex justify-between text-green-600">
                      <span>Company Discount:</span>
                      <span>-₹{baseAmount - finalAmount}</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>₹{finalAmount}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label>Advance Payment (₹)</Label>
                <Input
                  type="number"
                  value={formData.advancePayment}
                  onChange={(e) => setFormData(prev => ({ ...prev, advancePayment: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes / Special Requests</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special requirements or notes..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center space-x-4 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={selectedRooms.length === 0}>
              Confirm Bulk Booking ({selectedRooms.length} rooms)
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BulkBooking;
