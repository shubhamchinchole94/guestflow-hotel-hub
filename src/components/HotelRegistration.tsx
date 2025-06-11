import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, X, Upload } from 'lucide-react';

const HotelRegistration = () => {
  const [hotelConfig, setHotelConfig] = useState({
    hotelName: '',
    hotelLogo: '',
    totalFloors: 2,
    roomsPerFloor: 4,
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
      setHotelConfig(JSON.parse(savedConfig));
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
  const addRoomType = () => {
    setHotelConfig({
      ...hotelConfig,
      roomTypes: [...hotelConfig.roomTypes, {
        name: '',
        price: 0
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
  return <div className="space-y-6">
      <h2 className="text-3xl font-bold">Hotel Registration</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Hotel Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
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
              <div className="flex flex-col">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
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
              <div className="flex flex-col">
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
                {hotelConfig.roomTypes.map((roomType, index) => <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg relative">
                    {hotelConfig.roomTypes.length > 1 && <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => removeRoomType(index)}>
                        <X className="h-4 w-4" />
                      </Button>}
                    <div className="flex flex-col">
                      <Label htmlFor={`roomType-${index}`}>Room Type Name</Label>
                      <Input id={`roomType-${index}`} value={roomType.name} onChange={e => updateRoomType(index, 'name', e.target.value)} required />
                    </div>
                    <div className="flex flex-col">
                      <Label htmlFor={`roomPrice-${index}`}>Price per Night (₹)</Label>
                      <Input id={`roomPrice-${index}`} type="number" min="0" value={roomType.price} onChange={e => updateRoomType(index, 'price', parseInt(e.target.value))} required />
                    </div>
                  </div>)}
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
    </div>;
};
export default HotelRegistration;
