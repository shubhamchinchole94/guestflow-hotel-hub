import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Printer, Download } from 'lucide-react';

interface BillGenerationProps {
  isOpen: boolean;
  onClose: () => void;
}

const BillGeneration = ({ isOpen, onClose }: BillGenerationProps) => {
  const [billData, setBillData] = useState<any>(null);
  const [hotelConfig, setHotelConfig] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      const currentBill = localStorage.getItem('currentBill');
      const config = localStorage.getItem('hotelConfig');
      
      if (currentBill) {
        setBillData(JSON.parse(currentBill));
      }
      if (config) {
        setHotelConfig(JSON.parse(config));
      }
    }
  }, [isOpen]);

  const calculateTotal = () => {
    if (!billData) return 0;
    
    let total = billData.farePerNight;
    
    // Add extra bed cost
    if (billData.extraBed && billData.extraBedPrice) {
      total += billData.extraBedPrice;
    }
    
    // Add meal costs
    if (billData.mealPlan) {
      if (billData.mealPlan.breakfast && hotelConfig.mealPrices?.breakfast) {
        total += hotelConfig.mealPrices.breakfast;
      }
      if (billData.mealPlan.lunch && hotelConfig.mealPrices?.lunch) {
        total += hotelConfig.mealPrices.lunch;
      }
      if (billData.mealPlan.dinner && hotelConfig.mealPrices?.dinner) {
        total += hotelConfig.mealPrices.dinner;
      }
    }
    
    return total;
  };

  const calculateDiscount = () => {
    if (!billData?.companyDetails) return 0;
    const total = calculateTotal();
    return (total * billData.companyDetails.roomPriceDiscount) / 100;
  };

  const calculateSubtotal = () => {
    return calculateTotal() - calculateDiscount();
  };

  const calculateGST = () => {
    if (!billData?.companyDetails) return 0;
    const subtotal = calculateSubtotal();
    return (subtotal * billData.companyDetails.gstPercentage) / 100;
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateGST();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const billContent = document.getElementById('bill-content');
    if (billContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Hotel Bill - ${billData?.roomNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .bill-header { text-align: center; margin-bottom: 20px; }
                .bill-details { margin: 20px 0; }
                .bill-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .bill-table th, .bill-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .bill-table th { background-color: #f2f2f2; }
                .total-row { font-weight: bold; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${billContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleSaveBill = () => {
    if (!billData) return;
    
    const bills = JSON.parse(localStorage.getItem('bills') || '[]');
    const bill = {
      id: Date.now(),
      bookingId: billData.id,
      roomNumber: billData.roomNumber,
      guestName: `${billData.primaryGuest.firstName} ${billData.primaryGuest.lastName}`,
      checkInDate: billData.checkInDate,
      checkOutDate: billData.checkOutDate,
      checkOutTime: new Date().toISOString(),
      billing: {
        baseFare: billData.farePerNight,
        extraBed: billData.extraBed ? billData.extraBedPrice : 0,
        mealCosts: billData.mealPlan ? Object.keys(billData.mealPlan).reduce((sum, meal) => {
          if (billData.mealPlan[meal] && hotelConfig.mealPrices?.[meal]) {
            return sum + hotelConfig.mealPrices[meal];
          }
          return sum;
        }, 0) : 0,
        total: calculateTotal(),
        discount: calculateDiscount(),
        subtotal: calculateSubtotal(),
        gst: calculateGST(),
        grandTotal: calculateGrandTotal(),
        advancePaid: billData.advancePayment,
        balanceDue: calculateGrandTotal() - billData.advancePayment
      },
      companyDetails: billData.companyDetails,
      generatedAt: new Date().toISOString()
    };
    
    bills.push(bill);
    localStorage.setItem('bills', JSON.stringify(bills));
    
    // Clear current bill
    localStorage.removeItem('currentBill');
    
    toast({
      title: "Bill Generated",
      description: "Bill has been saved successfully"
    });
    
    onClose();
  };

  if (!billData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Bill Data</DialogTitle>
          </DialogHeader>
          <p>No bill data available to generate.</p>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guest Bill - Room {billData.roomNumber}</DialogTitle>
        </DialogHeader>

        <div id="bill-content" className="space-y-6 p-4">
          {/* Hotel Header */}
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold">{hotelConfig.hotelName || 'Hotel Name'}</h1>
            <p className="text-sm text-gray-600">{hotelConfig.hotelAddress || 'Hotel Address'}</p>
            <p className="text-sm text-gray-600">
              Phone: {hotelConfig.hotelPhone || 'N/A'} | Email: {hotelConfig.hotelEmail || 'N/A'}
            </p>
          </div>

          {/* Bill Header */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Bill To:</h3>
              <p className="font-medium">
                {billData.primaryGuest.firstName} {billData.primaryGuest.lastName}
              </p>
              <p className="text-sm">{billData.primaryGuest.mobile}</p>
              <p className="text-sm">{billData.primaryGuest.address}</p>
              {billData.companyDetails && (
                <p className="text-sm font-medium text-blue-600">
                  Company: {billData.companyDetails.companyName}
                </p>
              )}
            </div>
            <div className="text-right">
              <h3 className="font-semibold mb-2">Bill Details:</h3>
              <p className="text-sm">Room Number: <span className="font-medium">{billData.roomNumber}</span></p>
              <p className="text-sm">Check-in: <span className="font-medium">{format(new Date(billData.checkInDate), 'dd/MM/yyyy')}</span></p>
              <p className="text-sm">Check-out: <span className="font-medium">{format(new Date(), 'dd/MM/yyyy')}</span></p>
              <p className="text-sm">Bill Date: <span className="font-medium">{format(new Date(), 'dd/MM/yyyy HH:mm')}</span></p>
            </div>
          </div>

          {/* Bill Items */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Details</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Description</th>
                    <th className="border border-gray-300 p-2 text-right">Quantity</th>
                    <th className="border border-gray-300 p-2 text-right">Rate</th>
                    <th className="border border-gray-300 p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2">Room Charges</td>
                    <td className="border border-gray-300 p-2 text-right">1</td>
                    <td className="border border-gray-300 p-2 text-right">₹{billData.farePerNight}</td>
                    <td className="border border-gray-300 p-2 text-right">₹{billData.farePerNight}</td>
                  </tr>
                  
                  {billData.extraBed && (
                    <tr>
                      <td className="border border-gray-300 p-2">Extra Bed</td>
                      <td className="border border-gray-300 p-2 text-right">1</td>
                      <td className="border border-gray-300 p-2 text-right">₹{billData.extraBedPrice}</td>
                      <td className="border border-gray-300 p-2 text-right">₹{billData.extraBedPrice}</td>
                    </tr>
                  )}
                  
                  {billData.mealPlan && Object.keys(billData.mealPlan).map((meal) => {
                    if (!billData.mealPlan[meal] || !hotelConfig.mealPrices?.[meal]) return null;
                    return (
                      <tr key={meal}>
                        <td className="border border-gray-300 p-2 capitalize">{meal}</td>
                        <td className="border border-gray-300 p-2 text-right">1</td>
                        <td className="border border-gray-300 p-2 text-right">₹{hotelConfig.mealPrices[meal]}</td>
                        <td className="border border-gray-300 p-2 text-right">₹{hotelConfig.mealPrices[meal]}</td>
                      </tr>
                    );
                  })}
                  
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="border border-gray-300 p-2 text-right font-semibold">Subtotal:</td>
                    <td className="border border-gray-300 p-2 text-right font-semibold">₹{calculateTotal()}</td>
                  </tr>
                  
                  {billData.companyDetails && calculateDiscount() > 0 && (
                    <tr className="text-green-600">
                      <td colSpan={3} className="border border-gray-300 p-2 text-right">
                        Discount ({billData.companyDetails.roomPriceDiscount}%):
                      </td>
                      <td className="border border-gray-300 p-2 text-right">-₹{calculateDiscount()}</td>
                    </tr>
                  )}
                  
                  <tr>
                    <td colSpan={3} className="border border-gray-300 p-2 text-right">Amount after discount:</td>
                    <td className="border border-gray-300 p-2 text-right">₹{calculateSubtotal()}</td>
                  </tr>
                  
                  {billData.companyDetails && billData.companyDetails.gstPercentage > 0 && (
                    <tr>
                      <td colSpan={3} className="border border-gray-300 p-2 text-right">
                        GST ({billData.companyDetails.gstPercentage}%):
                      </td>
                      <td className="border border-gray-300 p-2 text-right">₹{calculateGST()}</td>
                    </tr>
                  )}
                  
                  <tr className="bg-blue-50 font-bold text-lg">
                    <td colSpan={3} className="border border-gray-300 p-2 text-right">Grand Total:</td>
                    <td className="border border-gray-300 p-2 text-right">₹{calculateGrandTotal()}</td>
                  </tr>
                  
                  <tr>
                    <td colSpan={3} className="border border-gray-300 p-2 text-right">Advance Paid:</td>
                    <td className="border border-gray-300 p-2 text-right">₹{billData.advancePayment}</td>
                  </tr>
                  
                  <tr className="bg-red-50 font-bold">
                    <td colSpan={3} className="border border-gray-300 p-2 text-right">Balance Due:</td>
                    <td className="border border-gray-300 p-2 text-right">₹{calculateGrandTotal() - billData.advancePayment}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p>Thank you for staying with us!</p>
            <p>Generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
          </div>
        </div>

        <div className="flex justify-center space-x-4 pt-4 border-t">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleSaveBill}>
            Save Bill
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillGeneration;
