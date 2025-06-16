
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Plus, Minus } from 'lucide-react';

const HotelRegistration = () => {
  const [hotelConfig, setHotelConfig] = useState({
    hotelName: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    hotelLogo: null as File | null,
    totalFloors: 2,
    roomsPerFloor: 4,
    roomTypes: [{ name: 'Regular', price: 1000 }],
    extraBedPrice: 500,
    mealPrices: {
      breakfast: 200,
      lunch: 300,
      dinner: 350
    },
    amenities: {
      wifi: false,
      parking: false,
      ac: false,
      restaurant: false,
      gym: false,
      spa: false,
      pool: false,
      laundry: false
    }
  });

  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    const savedConfig = localStorage.getItem('hotelConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setHotelConfig(prev => ({ ...prev, ...config }));
      if (config.logoUrl) {
        setLogoPreview(config.logoUrl);
      }
    }
  }, []);

  const handleLogoUpload = (file: File) => {
    setHotelConfig(prev => ({ ...prev, hotelLogo: file }));
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addRoomType = () => {
    setHotelConfig(prev => ({
      ...prev,
      roomTypes: [...prev.roomTypes, { name: '', price: 0 }]
    }));
  };

  const removeRoomType = (index: number) => {
    if (hotelConfig.roomTypes.length > 1) {
      setHotelConfig(prev => ({
        ...prev,
        roomTypes: prev.roomTypes.filter((_, i) => i !== index)
      }));
    }
  };

  const updateRoomType = (index: number, field: string, value: string | number) => {
    setHotelConfig(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.map((room, i) => i === index ? {
        ...room,
        [field]: value
      } : room)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const configToSave = {
      ...hotelConfig,
      logoUrl: logoPreview
    };
    
    localStorage.setItem('hotelConfig', JSON.stringify(configToSave));
    
    toast({
      title: "Hotel Configuration Saved",
      description: "Your hotel settings have been updated successfully"
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Hotel Configuration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hotelName">Hotel Name</Label>
                <Input
                  id="hotelName"
                  value={hotelConfig.hotelName}
                  onChange={e => setHotelConfig(prev => ({ ...prev, hotelName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={hotelConfig.phone}
                  onChange={e => setHotelConfig(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={hotelConfig.email}
                  onChange={e => setHotelConfig(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={hotelConfig.gstNumber}
                  onChange={e => setHotelConfig(prev => ({ ...prev, gstNumber: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={hotelConfig.address}
                onChange={e => setHotelConfig(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Hotel Logo and Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Hotel Logo & Property Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Hotel Logo Section */}
              <div className="space-y-4">
                <Label>Hotel Logo</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="logo-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleLogoUpload(e.target.files[0]);
                      }
                    }}
                  />
                  {logoPreview ? (
                    <div className="space-y-2">
                      <img 
                        src={logoPreview} 
                        alt="Hotel Logo" 
                        className="mx-auto h-24 w-24 object-contain rounded"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        Change Logo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        Upload Logo
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Property Details Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalFloors">Total Floors</Label>
                    <Input
                      id="totalFloors"
                      type="number"
                      min="1"
                      value={hotelConfig.totalFloors}
                      onChange={e => setHotelConfig(prev => ({ ...prev, totalFloors: parseInt(e.target.value) }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomsPerFloor">Rooms per Floor</Label>
                    <Input
                      id="roomsPerFloor"
                      type="number"
                      min="1"
                      value={hotelConfig.roomsPerFloor}
                      onChange={e => setHotelConfig(prev => ({ ...prev, roomsPerFloor: parseInt(e.target.value) }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="extraBedPrice">Extra Bed Price (₹)</Label>
                  <Input
                    id="extraBedPrice"
                    type="number"
                    min="0"
                    value={hotelConfig.extraBedPrice}
                    onChange={e => setHotelConfig(prev => ({ ...prev, extraBedPrice: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Types */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Room Types</CardTitle>
              <Button type="button" onClick={addRoomType} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Room Type
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hotelConfig.roomTypes.map((roomType, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <Input
                    placeholder="Room type name (e.g., Deluxe, Standard)"
                    value={roomType.name}
                    onChange={e => updateRoomType(index, 'name', e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Price per night"
                    value={roomType.price}
                    onChange={e => updateRoomType(index, 'price', parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                {hotelConfig.roomTypes.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeRoomType(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Meal Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Meal Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breakfastPrice">Breakfast Price (₹)</Label>
                <Input
                  id="breakfastPrice"
                  type="number"
                  min="0"
                  value={hotelConfig.mealPrices.breakfast}
                  onChange={e => setHotelConfig(prev => ({
                    ...prev,
                    mealPrices: { ...prev.mealPrices, breakfast: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunchPrice">Lunch Price (₹)</Label>
                <Input
                  id="lunchPrice"
                  type="number"
                  min="0"
                  value={hotelConfig.mealPrices.lunch}
                  onChange={e => setHotelConfig(prev => ({
                    ...prev,
                    mealPrices: { ...prev.mealPrices, lunch: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dinnerPrice">Dinner Price (₹)</Label>
                <Input
                  id="dinnerPrice"
                  type="number"
                  min="0"
                  value={hotelConfig.mealPrices.dinner}
                  onChange={e => setHotelConfig(prev => ({
                    ...prev,
                    mealPrices: { ...prev.mealPrices, dinner: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Hotel Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(hotelConfig.amenities).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) => setHotelConfig(prev => ({
                      ...prev,
                      amenities: { ...prev.amenities, [key]: !!checked }
                    }))}
                  />
                  <Label htmlFor={key} className="text-sm font-medium capitalize">
                    {key === 'wifi' ? 'Wi-Fi' : 
                     key === 'ac' ? 'Air Conditioning' : 
                     key.charAt(0).toUpperCase() + key.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button type="submit" size="lg">
            Save Hotel Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};

export default HotelRegistration;
