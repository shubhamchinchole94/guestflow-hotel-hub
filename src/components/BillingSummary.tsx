
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BillingSummaryProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  companies: any[];
  hotelConfig: any;
  calculateMealCosts: () => number;
}

const BillingSummary: React.FC<BillingSummaryProps> = ({
  formData,
  setFormData,
  companies,
  hotelConfig,
  calculateMealCosts,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Stay Duration & Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <Label>Duration Type</Label>
            <select
              value={formData.stayDuration}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, stayDuration: e.target.value }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="12hr">12 Hours (Check-out at 12:00 PM next day)</option>
              <option value="24hr">24 Hours (From check-in time)</option>
            </select>
          </div>
          <div className="form-group">
            <Label>Base Room Fare</Label>
            <Input
              type="number"
              value={formData.farePerNight}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  farePerNight: parseInt(e.target.value),
                }))
              }
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="form-group">
            <Label>Check-in Date</Label>
            <Input
              type="date"
              value={formData.checkInDate}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, checkInDate: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <Label>Check-in Time</Label>
            <Input
              type="time"
              value={formData.checkInTime}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, checkInTime: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <Label>Check-out Date</Label>
            <Input
              type="date"
              value={formData.checkOutDate}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, checkOutDate: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <Label>Check-out Time</Label>
            <Input
              type="time"
              value={formData.checkOutTime}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, checkOutTime: e.target.value }))
              }
              required
            />
          </div>
        </div>

        {/* Billing Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mt-4">
          <h4 className="font-semibold mb-2">Billing Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Room Fare:</span>
              <span>₹{formData.farePerNight}</span>
            </div>
            {formData.extraBed && (
              <div className="flex justify-between">
                <span>Extra Bed:</span>
                <span>₹{formData.extraBedPrice}</span>
              </div>
            )}
            {(formData.mealPlan.breakfast || formData.mealPlan.lunch || formData.mealPlan.dinner) && (
              <div className="flex justify-between">
                <span>Meals:</span>
                <span>₹{calculateMealCosts()}</span>
              </div>
            )}
            {formData.companyId && (
              <div className="flex justify-between text-green-600">
                <span>Company Discount:</span>
                <span>
                  -₹
                  {(
                    (formData.farePerNight +
                      (formData.extraBed ? formData.extraBedPrice : 0) +
                      calculateMealCosts()) *
                    (companies.find((c) => c.id === formData.companyId)?.roomPriceDiscount || 0)
                  ) / 100}
                </span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total Amount:</span>
              <span>
                ₹
                {formData.farePerNight +
                  (formData.extraBed ? formData.extraBedPrice : 0) +
                  calculateMealCosts() -
                  ((
                    (formData.farePerNight +
                      (formData.extraBed ? formData.extraBedPrice : 0) +
                      calculateMealCosts()) *
                    (companies.find((c) => c.id === formData.companyId)?.roomPriceDiscount || 0)
                  ) / 100)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="form-group">
            <Label>Advance Payment (₹)</Label>
            <Input
              type="number"
              value={formData.advancePayment}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  advancePayment: parseInt(e.target.value) || 0,
                }))
              }
              min="0"
            />
          </div>
          <div className="form-group">
            <Label>Remaining Payment (₹)</Label>
            <Input
              type="number"
              value={formData.remainingPayment}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingSummary;
