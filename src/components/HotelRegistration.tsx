
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const HotelRegistration = () => {
  const [hotelConfig, setHotelConfig] = useState({
    hotelName: '',
    totalFloors: 2,
    roomsPerFloor: 4,
    roomTypes: [
      { name: 'Regular', price: 1000 },
      { name: 'Deluxe', price: 2000 },
      { name: 'Royal', price: 3000 }
    ]
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('hotelConfig');
    if (savedConfig) {
      setHotelConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('hotelConfig', JSON.stringify(hotelConfig));
    toast({
      title: "Success",
      description: "Hotel configuration saved successfully"
    });
  };

  const updateRoomType = (index: number, field: 'name' | 'price', value: string | number) => {
    const updatedRoomTypes = [...hotelConfig.roomTypes];
    updatedRoomTypes[index] = { ...updatedRoomTypes[index], [field]: value };
    setHotelConfig({ ...hotelConfig, roomTypes: updatedRoomTypes });
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
            <div>
              <Label htmlFor="hotelName">Hotel Name</Label>
              <Input
                id="hotelName"
                value={hotelConfig.hotelName}
                onChange={(e) => setHotelConfig({...hotelConfig, hotelName: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalFloors">Total Floors</Label>
                <Input
                  id="totalFloors"
                  type="number"
                  min="1"
                  value={hotelConfig.totalFloors}
                  onChange={(e) => setHotelConfig({...hotelConfig, totalFloors: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="roomsPerFloor">Rooms Per Floor</Label>
                <Input
                  id="roomsPerFloor"
                  type="number"
                  min="1"
                  value={hotelConfig.roomsPerFloor}
                  onChange={(e) => setHotelConfig({...hotelConfig, roomsPerFloor: parseInt(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-lg font-semibold">Room Types & Pricing</Label>
              <div className="space-y-4 mt-4">
                {hotelConfig.roomTypes.map((roomType, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label htmlFor={`roomType-${index}`}>Room Type Name</Label>
                      <Input
                        id={`roomType-${index}`}
                        value={roomType.name}
                        onChange={(e) => updateRoomType(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`roomPrice-${index}`}>Price per Night (₹)</Label>
                      <Input
                        id={`roomPrice-${index}`}
                        type="number"
                        min="0"
                        value={roomType.price}
                        onChange={(e) => updateRoomType(index, 'price', parseInt(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full">
              Save Hotel Configuration
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default HotelRegistration;
