
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Plus, X, Upload } from 'lucide-react';

const HotelRegistration = () => {
  const [hotelConfig, setHotelConfig] = useState({
    hotelName: '',
    hotelLogo: '',
    totalFloors: 2,
    roomsPerFloor: 4,
    extraBedPrice: 500,
    mealPlans: [
      { name: 'Breakfast', price: 200, enabled: true },
      { name: 'Lunch', price: 300, enabled: true },
      { name: 'Dinner', price: 400, enabled: true }
    ],
    roomTypes: [{
      name: 'Regular',
      price: 1000
    }, {
      name: 'Deluxe',
      price: 2000
    }, {
      name: 'Royal',
      price: 3000
    }]
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('hotelConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      // Ensure meal plans exist with defaults
      if (!parsed.mealPlans) {
        parsed.mealPlans = [
          { name: 'Breakfast', price: 200, enabled: true },
          { name: 'Lunch', price: 300, enabled: true },
          { name: 'Dinner', price: 400, enabled: true }
        ];
      }
      if (!parsed.extraBedPrice) {
        parsed.extraBedPrice = 500;
      }
      setHotelConfig(parsed);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('hotelConfig', JSON.stringify(hotelConfig));

    // Trigger dashboard refresh
    window.dispatchEvent(new Event('refreshDashboard'));
    toast({
      title: "Success",
      description: "Hotel configuration saved successfully"
    });
  };

  const updateRoomType = (index: number, field: 'name' | 'price', value: string | number) => {
    const updatedRoomTypes = [...hotelConfig.roomTypes];
    updatedRoomTypes[index] = {
      ...updatedRoomTypes[index],
      [field]: value
    };
    setHotelConfig({
      ...hotelConfig,
      roomTypes: updatedRoomTypes
    });
  };

  const updateMealPlan = (index: number, field: 'name' | 'price' | 'enabled', value: string | number | boolean) => {
    const updatedMealPlans = [...hotelConfig.mealPlans];
    updatedMealPlans[index] = {
      ...updatedMealPlans[index],
      [field]: value
    };
    setHotelConfig({
      ...hotelConfig,
      mealPlans: updatedMealPlans
    });
  };

  const addRoomType = () => {
    setHotelConfig({
      ...hotelConfig,
      roomTypes: [...hotelConfig.roomTypes, {
        name: '',
        price: 0
      }]
    });
  };

  const addMealPlan = () => {
    setHotelConfig({
      ...hotelConfig,
      mealPlans: [...hotelConfig.mealPlans, {
        name: '',
        price: 0,
        enabled: true
      }]
    });
  };

  const removeRoomType = (index: number) => {
    if (hotelConfig.roomTypes.length > 1) {
      const updatedRoomTypes = hotelConfig.roomTypes.filter((_, i) => i !== index);
      setHotelConfig({
        ...hotelConfig,
        roomTypes: updatedRoomTypes
      });
    }
  };

  const removeMealPlan = (index: number) => {
    if (hotelConfig.mealPlans.length > 1) {
      const updatedMealPlans = hotelConfig.mealPlans.filter((_, i) => i !== index);
      setHotelConfig({
        ...hotelConfig,
        mealPlans: updatedMealPlans
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setHotelConfig({
          ...hotelConfig,
          hotelLogo: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Hotel Registration</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Hotel Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="hotelName">Hotel Name</Label>
                <Input 
                  id="hotelName" 
                  value={hotelConfig.hotelName} 
                  onChange={e => setHotelConfig({
                    ...hotelConfig,
                    hotelName: e.target.value
                  })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hotelLogo">Hotel Logo</Label>
                <Input 
                  id="hotelLogo" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                />
                {hotelConfig.hotelLogo && (
                  <div className="mt-2">
                    <img 
                      src={hotelConfig.hotelLogo} 
                      alt="Hotel logo preview" 
                      className="h-16 w-16 object-contain border rounded" 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="totalFloors">Total Floors</Label>
                <Input 
                  id="totalFloors" 
                  type="number" 
                  min="1" 
                  value={hotelConfig.totalFloors} 
                  onChange={e => setHotelConfig({
                    ...hotelConfig,
                    totalFloors: parseInt(e.target.value)
                  })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomsPerFloor">Rooms Per Floor</Label>
                <Input 
                  id="roomsPerFloor" 
                  type="number" 
                  min="1" 
                  value={hotelConfig.roomsPerFloor} 
                  onChange={e => setHotelConfig({
                    ...hotelConfig,
                    roomsPerFloor: parseInt(e.target.value)
                  })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extraBedPrice">Extra Bed Price (₹)</Label>
                <Input 
                  id="extraBedPrice" 
                  type="number" 
                  min="0" 
                  value={hotelConfig.extraBedPrice} 
                  onChange={e => setHotelConfig({
                    ...hotelConfig,
                    extraBedPrice: parseInt(e.target.value) || 0
                  })} 
                  required 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Room Types & Pricing</Label>
                <Button type="button" onClick={addRoomType} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room Type
                </Button>
              </div>
              <div className="space-y-4">
                {hotelConfig.roomTypes.map((roomType, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg relative">
                    {hotelConfig.roomTypes.length > 1 && (
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2" 
                        onClick={() => removeRoomType(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor={`roomType-${index}`}>Room Type Name</Label>
                      <Input 
                        id={`roomType-${index}`} 
                        value={roomType.name} 
                        onChange={e => updateRoomType(index, 'name', e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`roomPrice-${index}`}>Price per Night (₹)</Label>
                      <Input 
                        id={`roomPrice-${index}`} 
                        type="number" 
                        min="0" 
                        value={roomType.price} 
                        onChange={e => updateRoomType(index, 'price', parseInt(e.target.value))} 
                        required 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Meal Plans & Pricing</Label>
                <Button type="button" onClick={addMealPlan} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Meal Plan
                </Button>
              </div>
              <div className="space-y-4">
                {hotelConfig.mealPlans.map((mealPlan, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg relative">
                    {hotelConfig.mealPlans.length > 1 && (
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2" 
                        onClick={() => removeMealPlan(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor={`mealPlan-${index}`}>Meal Plan Name</Label>
                      <Input 
                        id={`mealPlan-${index}`} 
                        value={mealPlan.name} 
                        onChange={e => updateMealPlan(index, 'name', e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`mealPrice-${index}`}>Price (₹)</Label>
                      <Input 
                        id={`mealPrice-${index}`} 
                        type="number" 
                        min="0" 
                        value={mealPlan.price} 
                        onChange={e => updateMealPlan(index, 'price', parseInt(e.target.value))} 
                        required 
                      />
                    </div>
                    <div className="space-y-2 flex items-center">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`mealEnabled-${index}`}
                          checked={mealPlan.enabled}
                          onCheckedChange={(checked) => updateMealPlan(index, 'enabled', checked)}
                        />
                        <Label htmlFor={`mealEnabled-${index}`}>Enable for booking</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <Button type="submit" className="w-full max-w-md">
                Save Hotel Configuration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default HotelRegistration;
