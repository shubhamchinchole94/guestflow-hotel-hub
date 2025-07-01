
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface AdditionalServicesProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  hotelConfig: any;
}

const AdditionalServices: React.FC<AdditionalServicesProps> = ({
  formData,
  setFormData,
  hotelConfig,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Additional Services</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Extra Bed */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="extraBed"
            checked={formData.extraBed}
            onCheckedChange={(checked) =>
              setFormData((prev: any) => ({ ...prev, extraBed: !!checked }))
            }
          />
          <Label htmlFor="extraBed" className="text-sm font-medium">
            Extra Bed (₹{formData.extraBedPrice})
          </Label>
        </div>

        {/* Wake Up Call */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <Label>Wake Up Call Required</Label>
            <select
              value={formData.wakeUpCall}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, wakeUpCall: e.target.value }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">No Wake Up Call</option>
              <option value="yes">Yes, Set Wake Up Call</option>
            </select>
          </div>
          {formData.wakeUpCall === 'yes' && (
            <div className="form-group">
              <Label>Wake Up Time</Label>
              <Input
                type="time"
                value={formData.wakeUpCallTime}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    wakeUpCallTime: e.target.value,
                  }))
                }
                required
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdditionalServices;
