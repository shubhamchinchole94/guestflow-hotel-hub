
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useGuestStore } from '@/store/guestStore';
import { format } from 'date-fns';
import { Search, Eye } from 'lucide-react';

const GuestList = () => {
  const [guests, setGuests] = useState<any[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { openGuestDetails } = useGuestStore();

  useEffect(() => {
    loadGuests();
    
    const handleRefresh = () => loadGuests();
    window.addEventListener('refreshDashboard', handleRefresh);
    
    return () => window.removeEventListener('refreshDashboard', handleRefresh);
  }, []);

  useEffect(() => {
    filterGuests();
  }, [guests, searchTerm]);

  const loadGuests = () => {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    setGuests(bookings);
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
      (guest.primaryGuest.identityProofNumber && guest.primaryGuest.identityProofNumber.includes(searchTerm))
    );
    setFilteredGuests(filtered);
  };

  const getGuestStatus = (guest: any) => {
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
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold">Guest List</h2>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>All Registered Guests</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, mobile, room, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Guest Name</th>
                  <th className="text-left py-3 px-2">Room</th>
                  <th className="text-left py-3 px-2">Mobile</th>
                  <th className="text-left py-3 px-2">ID Proof</th>
                  <th className="text-left py-3 px-2">Check-in</th>
                  <th className="text-left py-3 px-2">Check-out</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Total Guests</th>
                  <th className="text-left py-3 px-2">Remaining Payment</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-2">
                      {guest.primaryGuest.firstName} {guest.primaryGuest.lastName}
                    </td>
                    <td className="py-4 px-2">{guest.roomNumber}</td>
                    <td className="py-4 px-2">{guest.primaryGuest.mobile}</td>
                    <td className="py-4 px-2 text-sm">
                      {guest.primaryGuest.identityProofNumber || 'N/A'}
                    </td>
                    <td className="py-4 px-2 text-sm">
                      {format(new Date(guest.checkInDate), 'MMM dd, yyyy')} at {guest.checkInTime}
                    </td>
                    <td className="py-4 px-2 text-sm">
                      {format(new Date(guest.checkOutDate), 'MMM dd, yyyy')} at {guest.checkOutTime}
                    </td>
                    <td className="py-4 px-2">
                      {getStatusBadge(getGuestStatus(guest))}
                    </td>
                    <td className="py-4 px-2">{guest.totalGuests}</td>
                    <td className="py-4 px-2 text-red-600 font-medium">₹{guest.remainingPayment}</td>
                    <td className="py-4 px-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openGuestDetails(guest)}
                        className="hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
};

export default GuestList;
