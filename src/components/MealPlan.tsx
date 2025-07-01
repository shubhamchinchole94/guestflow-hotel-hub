
import React from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface MealPlanProps {
  mealPlan: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  hotelConfig: any;
}

const MealPlan: React.FC<MealPlanProps> = ({ mealPlan, setFormData, hotelConfig }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Meal Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="form-group">
          <Label className="text-sm font-medium mb-3 block">Available Meal Plans</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hotelConfig.enabledMealPlans?.breakfast && hotelConfig.mealPrices?.breakfast && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="breakfast"
                  checked={mealPlan.breakfast}
                  onCheckedChange={(checked) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      mealPlan: { ...prev.mealPlan, breakfast: !!checked },
                    }))
                  }
                />
                <Label htmlFor="breakfast" className="text-sm font-medium">
                  Breakfast (₹{hotelConfig.mealPrices.breakfast})
                </Label>
              </div>
            )}
            {hotelConfig.enabledMealPlans?.lunch && hotelConfig.mealPrices?.lunch && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lunch"
                  checked={mealPlan.lunch}
                  onCheckedChange={(checked) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      mealPlan: { ...prev.mealPlan, lunch: !!checked },
                    }))
                  }
                />
                <Label htmlFor="lunch" className="text-sm font-medium">
                  Lunch (₹{hotelConfig.mealPrices.lunch})
                </Label>
              </div>
            )}
            {hotelConfig.enabledMealPlans?.dinner && hotelConfig.mealPrices?.dinner && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dinner"
                  checked={mealPlan.dinner}
                  onCheckedChange={(checked) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      mealPlan: { ...prev.mealPlan, dinner: !!checked },
                    }))
                  }
                />
                <Label htmlFor="dinner" className="text-sm font-medium">
                  Dinner (₹{hotelConfig.mealPrices.dinner})
                </Label>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MealPlan;
