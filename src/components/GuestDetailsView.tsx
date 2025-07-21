
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import GuestRegistrationService from '@/services/GuestRegistrationService';
import RoomService from '@/services/RoomService';

interface GuestDetailsViewProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGuest: any;
  onCheckOut: (bookingId: string) => void;
}

const updateGuestStatus = async (id: string, status: string) => {
  try {
    const response = await GuestRegistrationService.updateStatusOfGuest(id, status);
    await RoomService.updateRoomStatus(response.data.roomNumber, "cleaning");
    console.log("Guest status updated:", response.data);
    toast({
      title: "Success",
      description: "Guest checked out successfully.",
    });
    return response.data;
  } catch (error) {
    console.error("Failed to update guest status:", error);
    throw error;
  }
};


const GuestDetailsView: React.FC<GuestDetailsViewProps> = ({
  isOpen,
  onClose,
  selectedGuest,
  onCheckOut,
}) => {
  if (!selectedGuest) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guest Details - Room {selectedGuest?.roomNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Check-in Date & Time</Label>
                  <p className="font-medium">
                    {selectedGuest.checkInDate} at {selectedGuest.checkInTime}
                  </p>
                </div>
                <div>
                  <Label>Check-out Date & Time</Label>
                  <p className="font-medium">
                    {selectedGuest.checkOutDate} at {selectedGuest.checkOutTime}
                  </p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="font-medium">
                    ₹{selectedGuest.billing?.grandTotal || selectedGuest.farePerNight}
                  </p>
                </div>
                <div>
                  <Label>Remaining Payment</Label>
                  <p className="font-medium text-red-600">₹{selectedGuest.remainingPayment}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Primary Guest</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="font-medium">
                    {selectedGuest.primaryGuest.firstName} {selectedGuest.primaryGuest.middleName}{' '}
                    {selectedGuest.primaryGuest.lastName}
                  </p>
                </div>
                <div>
                  <Label>Mobile</Label>
                  <p className="font-medium">{selectedGuest.primaryGuest.mobile}</p>
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <p className="font-medium">{selectedGuest.primaryGuest.dob}</p>
                </div>
                <div>
                  <Label>Identity Proof</Label>
                  <p className="font-medium capitalize">
                    {selectedGuest.primaryGuest.identityProof}
                  </p>
                </div>
                <div>
                  <Label>Identity Proof Number</Label>
                  <p className="font-medium font-mono">
                    {selectedGuest.primaryGuest.identityNumber || 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Label>Address</Label>
                <p className="font-medium">{selectedGuest.primaryGuest.address}</p>
              </div>
            </CardContent>
          </Card>

          {selectedGuest.familyMembers && selectedGuest.familyMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Family Members ({selectedGuest.familyMembers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedGuest.familyMembers.map((member: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Name</Label>
                        <p className="font-medium">
                          {member.firstName} {member.middleName} {member.lastName}
                        </p>
                      </div>
                      <div>
                        <Label>Mobile</Label>
                        <p className="font-medium">{member.mobile}</p>
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <p className="font-medium">{member.dob}</p>
                      </div>
                      <div>
                        <Label>Identity Proof</Label>
                        <p className="font-medium capitalize">{member.identityProof}</p>
                      </div>
                      <div>
                        <Label>Identity Proof Number</Label>
                        <p className="font-medium font-mono">
                          {member.identityNumber || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center space-x-4 pt-6">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {selectedGuest.status !== "inactive" && (
              <button
                className="bg-black hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded"
                onClick={async () => {
                  try {
                    await updateGuestStatus(selectedGuest.id, "inactive");
                  } catch (err) {
                    // Optional: show toast or error feedback
                  }
                }}
              >
                Check Out & Generate Bill
              </button>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestDetailsView;
