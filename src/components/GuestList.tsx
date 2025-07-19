
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useGuestStore } from '@/store/guestStore';
import { format } from 'date-fns';
import { Search, Eye, IdCard, FileText, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import GuestRegistrationService from '@/services/GuestRegistrationService';
import CompanyService from '@/services/company';
import BillModal from './BillModal';
import HotelService from '@/services/hotel';
import RoomService from '@/services/RoomService';

const GuestList = () => {
  const [guests, setGuests] = useState<any[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBill, setShowBill] = useState(false);
  const [billData, setBillData] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const { openGuestDetails } = useGuestStore();
  const [hotelConfig, setHotelConfig] = useState<any>(null);

  useEffect(() => {
    loadGuests();
    loadCompanies();
    getHotelConfig();
    
    // Listen for dashboard refresh events
    const handleRefresh = () => {
      loadGuests();
      loadCompanies();
    };
    window.addEventListener('refreshDashboard', handleRefresh);
    
    return () => window.removeEventListener('refreshDashboard', handleRefresh);
  }, []);

  useEffect(() => {
    filterGuests();
  }, [guests, searchTerm]);

  const loadGuests = async () => {
    try {
      const response = await GuestRegistrationService.getAllRegistrations();
      setGuests(response.data || []);
    } catch (error) {
      console.error('Error loading guests:', error);
      setGuests([]);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await CompanyService.getAllCompanies();
      setCompanies(response.data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
    }
  };

  const getHotelConfig = async () => {
    try {
      const response = await HotelService.getHotelConfig();
      setHotelConfig(response.data || {});
    } catch (error) {
      console.error('Error loading hotel config:', error);
      setHotelConfig(null);
    }
  };

  const filterGuests = () => {
    if (!searchTerm) {
      setFilteredGuests(guests);
      return;
    }

    const filtered = guests.filter(guest => 
      guest.primaryGuest.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.primaryGuest.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.primaryGuest.mobile.includes(searchTerm) ||
      guest.roomNumber.includes(searchTerm) ||
      (guest.primaryGuest.identityProof && guest.primaryGuest.identityProof.includes(searchTerm)) ||
      (guest.primaryGuest.identityNumber && guest.primaryGuest.identityNumber.includes(searchTerm))
    );
    setFilteredGuests(filtered);
  };

  const getGuestStatus = (guest: any) => {
    if (guest.status) {
      //return guest.status === 'booked' ? 'booked' : 'checked-out';
      return guest.status;
    }
    
    const checkIn = new Date(guest.checkInDate);
    const checkOut = new Date(guest.checkOutDate);
    const today = new Date();
    
    if (today < checkIn) return 'upcoming';
    if (today > checkOut) return 'checked-out';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
   
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case 'checked-out':
        return <Badge className="bg-gray-100 text-gray-800">Checked Out</Badge>;
      case 'room_transferred':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

 const generateBill = (guestData: any) => {

  const selectedCompany = companies.find((c: any) => c.id === guestData.companyId);

  const farePerNight = Number(guestData.farePerNight);
  const extraBedCost = guestData.extraBed ? Number(guestData.extraBedPrice) : 0;
  const mealCosts = 
    (guestData.mealPlan?.breakfast ? 200 : 0) +
    (guestData.mealPlan?.lunch ? 300 : 0) +
    (guestData.mealPlan?.dinner ? 400 : 0);

  const totalFare = farePerNight + extraBedCost + mealCosts;
  let finalFare = totalFare;
  let appliedDiscount = 0;
  let gstRate = 0;
  let gstAmount = 0;

  if (selectedCompany) {
    appliedDiscount = (totalFare * selectedCompany.roomPriceDiscount) / 100;
    finalFare = totalFare - appliedDiscount;
    gstRate = selectedCompany.gstPercentage;
    gstAmount = (finalFare * gstRate) / 100;
  }

  const advancePayment = Number(guestData.advancePayment || 0);

  const bill = {
    bookingId: guestData.id,
    guestName: `${guestData.primaryGuest.firstName} ${guestData.primaryGuest.lastName}`,
    roomNumber: guestData.roomNumber,
    checkInDate: guestData.checkInDate,
    checkInTime: guestData.checkInTime,
    checkOutDate: guestData.checkOutDate,
    checkOutTime: guestData.checkOutTime,
    baseFare: farePerNight,
    extraBedCost,
    mealCosts,
    totalBeforeDiscount: totalFare,
    discountAmount: appliedDiscount,
    discountPercentage: selectedCompany?.roomPriceDiscount || 0,
    finalFare,
    gstRate,
    gstAmount,
    grandTotal: finalFare + gstAmount,
    advancePayment,
    remainingPayment: (finalFare + gstAmount) - advancePayment,
    companyName: selectedCompany?.companyName || 'Walk-in Guest',
    generatedAt: new Date().toISOString()
  };
  console.log("current bill:", bill);
  setBillData(bill);
  setShowBill(true);
};


  const handleCheckOut = async (guestData: any) => {
    if (!window.confirm('Are you sure you want to check out this guest?')) {
      return;
    }

    try {
      // Update guest status to inactive
      const updatedGuest = { ...guestData, status: 'inactive' };
      const formData = new FormData();
      formData.append('form',new Blob([JSON.stringify(updatedGuest)], { type: 'application/json' }));
      await GuestRegistrationService.updateRegistration(updatedGuest.id, formData);
      await RoomService.updateRoomStatus(guestData.roomNumber, 'cleaning');
      // Generate bill first
      generateBill(guestData);

      toast({
        title: "checked-out Successful",
        description: "Guest has been checked out. Room is now in cleaning mode."
      });
      
      loadGuests();
       window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (error) {
      console.error('Error during checkout:', error);
      toast({
        title: "checked-out Failed",
        description: "An error occurred during check-out"
      });
    }
  };

  const handleRowClick = (guest: any) => {
    const status = getGuestStatus(guest);
    
    if (status === 'inactive') {
      generateBill(guest);
    } else {
      openGuestDetails(guest);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Guest List</h2>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Registered Guests</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, mobile, room, or ID proof..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Guest Name</th>
                  <th className="text-left py-3 px-2">Room</th>
                  {/* <th className="text-left py-3 px-2">Mobile</th>
                  <th className="text-left py-3 px-2">Identity Proof</th>
                  <th className="text-left py-3 px-2">ID Number</th> */}
                  <th className="text-left py-3 px-2">Check-in</th>
                  <th className="text-left py-3 px-2">Check-out</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Total Guests</th>
                  <th className="text-left py-3 px-2">Remaining Payment</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => {
                  const status = getGuestStatus(guest);
                  return (
                    <tr 
                      key={guest.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(guest)}
                    >
                      <td className="py-3 px-2">
                        {guest.primaryGuest.firstName} {guest.primaryGuest.lastName}
                      </td>
                      <td className="py-3 px-2">{guest.roomNumber}</td>
                      {/* <td className="py-3 px-2">{guest.primaryGuest.mobile}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-1">
                          <IdCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {guest.primaryGuest.identityProof || 'Not provided'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm font-mono">
                          {guest.primaryGuest.identityNumber || 'Not provided'}
                        </span>
                      </td> */}
                      <td className="py-3 px-2">
                        {format(new Date(guest.checkInDate), 'MMM dd, yyyy')} at {guest.checkInTime}
                      </td>
                      <td className="py-3 px-2">
                        {format(new Date(guest.checkOutDate), 'MMM dd, yyyy')} at {guest.checkOutTime}
                      </td>
                      <td className="py-3 px-2">
                        {getStatusBadge(status)}
                      </td>
                      <td className="py-3 px-2">{guest.totalGuests || 1}</td>
                      <td className="py-3 px-2 text-red-600 font-medium">₹{guest.remainingPayment || 0}</td>
                      <td className="py-3 px-2">
                        <div className="flex space-x-2">
                          {status === 'checked-out' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                generateBill(guest);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Bill
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openGuestDetails(guest);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {status !== 'inactive' && (
                                <Button 
                                  size="sm" 
                                  className="bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCheckOut(guest);
                                  }}
                                >
                                  <span className="mr-1 text-lg">₹</span>
                                  Check Out
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredGuests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No guests found matching your search.' : 'No guests registered yet.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* the Bill Modal */}
      <BillModal 
        isOpen={showBill}
        billData={billData}
        onClose={() => setShowBill(false)}
        hotelConfig={hotelConfig}
      />
    </div>
  );
};

export default GuestList;
