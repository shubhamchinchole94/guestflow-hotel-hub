import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, Plus, Hotel } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import hotel from '@/services/hotel';


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
    roomTypes: [{ name: 'Regular', price: 1000, totalRooms: 10 }],
    extraBedPrice: 500,
    mealPrices: {
      breakfast: 200,
      lunch: 300,
      dinner: 350
    },
    enabledMealPlans: {
      breakfast: true,
      lunch: true,
      dinner: true
    }
  });


  const [logoPreview, setLogoPreview] = useState<string>('');

  const handleLogoUpload = (file: File) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64DataUrl = reader.result as string; // this includes data:image/png;base64,...
    setLogoPreview(base64DataUrl);

    // Save this complete value to backend (and MongoDB)
    setHotelConfig(prev => ({ ...prev, logoUrl: base64DataUrl }));
  };
  reader.readAsDataURL(file); // This is important!
};


  const addRoomType = () => {
    setHotelConfig(prev => ({
      ...prev,
      roomTypes: [...prev.roomTypes, { name: '', price: 0, totalRooms: 0 }]
    }));
  };

  useEffect(() => {
  const fetchHotel = async () => {
    try {
      const res = await hotel.getHotelConfig();
      if (res.data && res.data.length > 0) {
        const config = res.data[0]; // Get the first (only) hotel

        // Fix logoUrl if it’s raw base64 (i.e. missing prefix)
        let logoPreview = "";
        if (config.logoUrl) {
          logoPreview = config.logoUrl.startsWith("data:image")
            ? config.logoUrl
            : `data:image/png;base64,${config.logoUrl}`;
        }

        // Set hotel config and preview
        setHotelConfig({
          ...config,
          hotelLogo: null, // File input must remain null
        });
        setLogoPreview(logoPreview);
      }
    } catch (error) {
      console.error("Failed to fetch hotel config", error);
    }
  };

  fetchHotel();
}, []);


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

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const formData = new FormData();

  formData.append('hotelData', new Blob([JSON.stringify({
    ...hotelConfig
  })], { type: 'application/json' }));

  if (hotelConfig.hotelLogo) {
    formData.append('logo', hotelConfig.hotelLogo);
  }

  try {
    await hotel.saveOrUpdateHotel(formData); // Send FormData

    toast({
      title: "Hotel Configuration Saved",
      description: "Your hotel settings have been successfully sent.",
    });
  } catch (error) {
    console.error("Error saving hotel config", error);
    toast({
      title: "Save Failed",
      description: "There was an error saving the configuration.",
      variant: "destructive",
    });
  }
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
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hotelName">Hotel Name</Label>
                <Input id="hotelName" value={hotelConfig.hotelName} onChange={e => setHotelConfig(prev => ({ ...prev, hotelName: e.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={hotelConfig.phone} onChange={e => setHotelConfig(prev => ({ ...prev, phone: e.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={hotelConfig.email} onChange={e => setHotelConfig(prev => ({ ...prev, email: e.target.value }))} required />
              </div>
          
            </div>
            
            <div className="grid grid-cols-2 gap-4">
<div>
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input id="gstNumber" value={hotelConfig.gstNumber} onChange={e => setHotelConfig(prev => ({ ...prev, gstNumber: e.target.value }))} />
              </div>
              <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={hotelConfig.address} onChange={e => setHotelConfig(prev => ({ ...prev, address: e.target.value }))} required />
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo & Details */}
        <Card>
          <CardHeader><CardTitle>Hotel Logo & Property Details</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label>Hotel Logo</Label>
              <div className="border-2 border-dashed border-gray-300 p-6 text-center rounded-lg">
                <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                {logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Logo" className="h-24 w-24 mx-auto object-contain rounded" />
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logo-upload')?.click()}>Change Logo</Button>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>Upload Logo</Button>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalFloors">Total Floors</Label>
                  <Input id="totalFloors" type="number" min="1" value={hotelConfig.totalFloors} onChange={e => setHotelConfig(prev => ({ ...prev, totalFloors: parseInt(e.target.value) }))} required />
                </div>
                <div>
                  <Label htmlFor="roomsPerFloor">Rooms per Floor</Label>
                  <Input id="roomsPerFloor" type="number" min="1" value={hotelConfig.roomsPerFloor} onChange={e => setHotelConfig(prev => ({ ...prev, roomsPerFloor: parseInt(e.target.value) }))} required />
                </div>
              </div>
              <div>
                <Label htmlFor="extraBedPrice">Extra Bed Price (₹)</Label>
                <Input id="extraBedPrice" type="number" min="0" value={hotelConfig.extraBedPrice} onChange={e => setHotelConfig(prev => ({ ...prev, extraBedPrice: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Types */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Room Types</CardTitle>
            <Button type="button" onClick={addRoomType} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Room Type
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {hotelConfig.roomTypes.map((room, index) => (
              <div key={index} className="flex gap-4 items-center">
                <Input placeholder="Room type name" value={room.name} onChange={e => updateRoomType(index, 'name', e.target.value)} required />
                <Input type="number" placeholder="Price" value={room.price} onChange={e => updateRoomType(index, 'price', parseInt(e.target.value) || 0)} required />
                 <Input type="number" placeholder="Total Rooms" value={room.totalRooms} onChange={e => updateRoomType(index, 'totalRooms', parseInt(e.target.value) || 0)} required />
                {hotelConfig.roomTypes.length > 1 && (
                  <Button type="button" size="sm" variant="destructive" onClick={() => removeRoomType(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Meal Plans */}
        <Card>
          <CardHeader><CardTitle>Meal Plans</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
                <div key={meal} className="flex gap-2 items-center">
                  <Checkbox
                    id={`enable-${meal}`}
                    checked={hotelConfig.enabledMealPlans[meal]}
                    onCheckedChange={checked => setHotelConfig(prev => ({
                      ...prev,
                      enabledMealPlans: { ...prev.enabledMealPlans, [meal]: !!checked }
                    }))}
                  />
                  <Label htmlFor={`enable-${meal}`}>Enable {meal.charAt(0).toUpperCase() + meal.slice(1)}</Label>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
                <div key={meal}>
                  <Label htmlFor={`${meal}Price`}>{meal.charAt(0).toUpperCase() + meal.slice(1)} Price (₹)</Label>
                  <Input
                    id={`${meal}Price`}
                    type="number"
                    min="0"
                    value={hotelConfig.mealPrices[meal]}
                    onChange={e => setHotelConfig(prev => ({
                      ...prev,
                      mealPrices: { ...prev.mealPrices, [meal]: parseInt(e.target.value) || 0 }
                    }))}
                    disabled={!hotelConfig.enabledMealPlans[meal]}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-right">
          <Button type="submit" size="lg">Save Hotel Configuration</Button>
        </div>
      </form>
    </div>
  );
};

export default HotelRegistration;
