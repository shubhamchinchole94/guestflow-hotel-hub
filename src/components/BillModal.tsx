
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  billData: any;
  hotelConfig: any;
}

const BillModal: React.FC<BillModalProps> = ({ isOpen, onClose, billData, hotelConfig }) => {
  if (!billData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Guest Bill</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center border-b pb-4">
            <h2 className="text-xl font-bold">{hotelConfig.hotelName || 'Hotel Bill'}</h2>
            <p className="text-sm text-gray-600">Bill ID: #{billData.bookingId}</p>
            <p className="text-sm text-gray-600">{hotelConfig.address}</p>
            <p className="text-sm text-gray-600">
              Phone: {hotelConfig.phone} | Email: {hotelConfig.email}
            </p>
            {hotelConfig.gstNumber && (
              <p className="text-sm text-gray-600">GST: {hotelConfig.gstNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Guest Name</Label>
              <p className="font-medium">{billData.guestName}</p>
            </div>
            <div>
              <Label>Room Number</Label>
              <p className="font-medium">{billData.roomNumber}</p>
            </div>
            <div>
              <Label>Check-in</Label>
              <p className="text-sm">
                {billData.checkInDate} {billData.checkInTime}
              </p>
            </div>
            <div>
              <Label>Check-out</Label>
              <p className="text-sm">
                {billData.checkOutDate} {billData.checkOutTime}
              </p>
            </div>
            <div>
              <Label>Company</Label>
              <p className="text-sm">{billData.companyName}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Billing Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Room Charges:</span>
                <span>₹{billData.baseFare || 0}</span>
              </div>
              {billData.extraBedCost > 0 && (
                <div className="flex justify-between">
                  <span>Extra Bed:</span>
                  <span>₹{billData.extraBedCost}</span>
                </div>
              )}
              {billData.mealCosts > 0 && (
                <div className="flex justify-between">
                  <span>Meals:</span>
                  <span>₹{billData.mealCosts}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{billData.totalBeforeDiscount || (billData.baseFare + billData.extraBedCost + billData.mealCosts)}</span>
              </div>
              {billData.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({billData.discountPercentage}%):</span>
                  <span>-₹{billData.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Amount after discount:</span>
                <span>₹{billData.finalFare || (billData.totalBeforeDiscount - billData.discountAmount)}</span>
              </div>
              {billData.gstAmount > 0 && (
                <div className="flex justify-between">
                  <span>GST ({billData.gstRate}%):</span>
                  <span>₹{billData.gstAmount}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between font-bold">
                <span>Total Amount:</span>
                <span>₹{billData.grandTotal || (billData.finalFare + billData.gstAmount)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Advance Paid:</span>
                <span>₹{billData.advancePayment || 0}</span>
              </div>
              <div className="flex justify-between font-bold text-red-600">
                <span>Amount Due:</span>
                <span>₹{billData.remainingPayment || (billData.grandTotal - billData.advancePayment)}</span>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 border-t pt-2">
            Generated on: {new Date(billData.generatedAt).toLocaleString()}
          </div>

          <div className="flex justify-center space-x-4 pt-6">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => window.print()}>Print Bill</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillModal;
