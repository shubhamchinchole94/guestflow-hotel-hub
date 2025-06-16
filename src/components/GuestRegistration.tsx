import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useGuestStore } from '@/store/guestStore';
import { format } from 'date-fns';
import { Upload, X, Plus, Minus, Eye } from 'lucide-react';

const GuestRegistration = () => {
  const {
    isGuestFormOpen,
    isGuestDetailsOpen,
    selectedRoom,
    selectedDate,
    selectedGuest,
    closeGuestForm,
    closeGuestDetails
  } = useGuestStore();
  
  const [formData, setFormData] = useState({
    primaryGuest: {
      firstName: '',
      middleName: '',
      lastName: '',
      dob: '',
      mobile: '',
      address: '',
      identityProof: '',
      identityNumber: '',
      identityFile: null as File | null
    },
    familyMembers: [] as any[],
    checkInTime: '',
    checkOutTime: '',
    checkInDate: '',
    checkOutDate: '',
    stayDuration: '12hr',
    farePerNight: 0,
    advancePayment: 0,
    remainingPayment: 0,
    companyId: '',
    extraBed: false,
    extraBedPrice: 0,
    mealPlan: {
      breakfast: false,
      lunch: false,
      dinner: false
    },
    wakeUpCall: '',
    wakeUpCallTime: ''
  });

  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<{
    [key: string]: string;
  }>({});
  const [companies, setCompanies] = useState<any[]>([]);
  const [hotelConfig, setHotelConfig] = useState<any>({});
  const [showBill, setShowBill] = useState(false);
  const [billData, setBillData] = useState<any>(null);

  useEffect(() => {
    const savedCompanies = localStorage.getItem('companies');
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    }
    
    const savedConfig = localStorage.getItem('hotelConfig');
    if (savedConfig) {
      setHotelConfig(JSON.parse(savedConfig));
    }
  }, []);

  useEffect(() => {
    if (isGuestFormOpen && selectedDate && selectedRoom) {
      const roomInfo = getRoomInfo(selectedRoom);
      const checkInDate = format(selectedDate, 'yyyy-MM-dd');
      const checkInTime = format(new Date(), 'HH:mm');
      let checkOutDate = checkInDate;
      let checkOutTime = checkInTime;

      if (formData.stayDuration === '12hr') {
        checkOutTime = '12:00';
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        checkOutDate = format(nextDay, 'yyyy-MM-dd');
      } else {
        const checkOutDateTime = new Date(selectedDate);
        checkOutDateTime.setHours(checkOutDateTime.getHours() + 24);
        checkOutDate = format(checkOutDateTime, 'yyyy-MM-dd');
        checkOutTime = checkInTime;
      }
      
      setFormData(prev => ({
        ...prev,
        checkInDate,
        checkInTime,
        checkOutDate,
        checkOutTime,
        farePerNight: roomInfo?.price || 1000,
        extraBedPrice: hotelConfig.extraBedPrice || 0
      }));
    }
  }, [isGuestFormOpen, selectedDate, selectedRoom, formData.stayDuration, hotelConfig]);

  useEffect(() => {
    // Calculate remaining payment
    const extraBedCost = formData.extraBed ? formData.extraBedPrice : 0;
    const mealCosts = calculateMealCosts();
    const totalFare = formData.farePerNight + extraBedCost + mealCosts;
    
    // Apply company discount if selected
    let finalFare = totalFare;
    let appliedDiscount = 0;
    let gstRate = 0;
    
    if (formData.companyId) {
      const selectedCompany = companies.find(c => c.id === formData.companyId);
      if (selectedCompany) {
        appliedDiscount = (totalFare * selectedCompany.roomPriceDiscount) / 100;
        finalFare = totalFare - appliedDiscount;
        gstRate = selectedCompany.gstPercentage;
      }
    }
    
    const remaining = finalFare - formData.advancePayment;
    setFormData(prev => ({
      ...prev,
      remainingPayment: Math.max(0, remaining)
    }));
  }, [formData.farePerNight, formData.advancePayment, formData.extraBed, formData.extraBedPrice, formData.mealPlan, formData.companyId, companies, hotelConfig]);

  const calculateMealCosts = () => {
    let total = 0;
    if (formData.mealPlan.breakfast && hotelConfig.mealPrices?.breakfast) {
      total += hotelConfig.mealPrices.breakfast;
    }
    if (formData.mealPlan.lunch && hotelConfig.mealPrices?.lunch) {
      total += hotelConfig.mealPrices.lunch;
    }
    if (formData.mealPlan.dinner && hotelConfig.mealPrices?.dinner) {
      total += hotelConfig.mealPrices.dinner;
    }
    return total;
  };

  const getRoomInfo = (roomNumber: string) => {
    const hotelConfig = JSON.parse(localStorage.getItem('hotelConfig') || '{}');
    if (!hotelConfig.roomTypes) return {
      price: 1000,
      type: 'Regular'
    };

    const roomNum = parseInt(roomNumber.slice(-1));
    const typeIndex = (roomNum - 1) % hotelConfig.roomTypes.length;
    return hotelConfig.roomTypes[typeIndex];
  };

  const checkExistingGuest = async (mobile: string) => {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const existingBooking = bookings.find((booking: any) => booking.primaryGuest.mobile === mobile);
    if (existingBooking) {
      setFormData(prev => ({
        ...prev,
        primaryGuest: {
          ...prev.primaryGuest,
          ...existingBooking.primaryGuest,
          mobile
        }
      }));
      toast({
        title: "Returning Guest",
        description: "Guest details loaded from previous booking"
      });
    }
  };

  const handleMobileChange = (mobile: string) => {
    setFormData(prev => ({
      ...prev,
      primaryGuest: {
        ...prev.primaryGuest,
        mobile
      }
    }));
    if (mobile.length === 10) {
      checkExistingGuest(mobile);
    }
  };

  const addFamilyMember = () => {
    setFormData(prev => ({
      ...prev,
      familyMembers: [...prev.familyMembers, {
        firstName: '',
        middleName: '',
        lastName: '',
        dob: '',
        mobile: '',
        address: '',
        identityProof: '',
        identityNumber: '',
        identityFile: null
      }]
    }));
  };

  const removeFamilyMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }));
  };

  const updateFamilyMember = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.map((member, i) => i === index ? {
        ...member,
        [field]: value
      } : member)
    }));
  };

  const handleFileUpload = (file: File, isPrimary: boolean = true, memberIndex?: number) => {
    if (isPrimary) {
      setFormData(prev => ({
        ...prev,
        primaryGuest: {
          ...prev.primaryGuest,
          identityFile: file
        }
      }));
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(prev => ({
          ...prev,
          primary: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    } else if (memberIndex !== undefined) {
      updateFamilyMember(memberIndex, 'identityFile', file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(prev => ({
          ...prev,
          [`member-${memberIndex}`]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
    toast({
      title: "File Uploaded",
      description: `${file.name} uploaded successfully`
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, isPrimary: boolean = true, memberIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], isPrimary, memberIndex);
    }
  };

  const generateBill = (bookingData: any) => {
    const selectedCompany = companies.find(c => c.id === bookingData.companyId);
    const extraBedCost = bookingData.extraBed ? bookingData.extraBedPrice : 0;
    const mealCosts = (bookingData.mealPlan?.breakfast ? (hotelConfig.mealPrices?.breakfast || 0) : 0) +
                      (bookingData.mealPlan?.lunch ? (hotelConfig.mealPrices?.lunch || 0) : 0) +
                      (bookingData.mealPlan?.dinner ? (hotelConfig.mealPrices?.dinner || 0) : 0);
    
    const totalFare = bookingData.farePerNight + extraBedCost + mealCosts;
    
    let finalFare = totalFare;
    let appliedDiscount = 0;
    let gstRate = 0;
    let gstAmount = 0;
    
    if (selectedCompany) {
      appliedDiscount = (totalFare * selectedCompany.roomPriceDiscount) / 100;
      finalFare = totalFare - appliedDiscount;
      gstRate = selectedCompany.gstPercentage;
      gstAmount = (finalFare * gstRate) / 100;
    }

    const bill = {
      bookingId: bookingData.id,
      guestName: `${bookingData.primaryGuest.firstName} ${bookingData.primaryGuest.lastName}`,
      roomNumber: bookingData.roomNumber,
      checkInDate: bookingData.checkInDate,
      checkInTime: bookingData.checkInTime,
      checkOutDate: bookingData.checkOutDate,
      checkOutTime: bookingData.checkOutTime,
      baseFare: bookingData.farePerNight,
      extraBedCost,
      mealCosts,
      totalBeforeDiscount: totalFare,
      discountAmount: appliedDiscount,
      discountPercentage: selectedCompany?.roomPriceDiscount || 0,
      finalFare,
      gstRate,
      gstAmount,
      grandTotal: finalFare + gstAmount,
      advancePayment: bookingData.advancePayment,
      remainingPayment: (finalFare + gstAmount) - bookingData.advancePayment,
      companyName: selectedCompany?.companyName || 'Walk-in Guest',
      generatedAt: new Date().toISOString()
    };

    setBillData(bill);
    setShowBill(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCompany = companies.find(c => c.id === formData.companyId);
    const extraBedCost = formData.extraBed ? formData.extraBedPrice : 0;
    const mealCosts = calculateMealCosts();
    const totalFare = formData.farePerNight + extraBedCost + mealCosts;
    
    let finalFare = totalFare;
    let appliedDiscount = 0;
    let gstRate = 0;
    
    if (selectedCompany) {
      appliedDiscount = (totalFare * selectedCompany.roomPriceDiscount) / 100;
      finalFare = totalFare - appliedDiscount;
      gstRate = selectedCompany.gstPercentage;
    }

    const booking = {
      id: Date.now(),
      roomNumber: selectedRoom,
      ...formData,
      totalGuests: 1 + formData.familyMembers.length,
      createdAt: new Date().toISOString(),
      companyDetails: selectedCompany,
      billing: {
        baseFare: formData.farePerNight,
        extraBedCost,
        mealCosts,
        totalBeforeDiscount: totalFare,
        discountAmount: appliedDiscount,
        discountPercentage: selectedCompany?.roomPriceDiscount || 0,
        finalFare,
        gstRate,
        gstAmount: (finalFare * gstRate) / 100,
        grandTotal: finalFare + (finalFare * gstRate) / 100
      }
    };

    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    toast({
      title: "Booking Confirmed",
      description: `Room ${selectedRoom} booked successfully`
    });
    
    closeGuestForm();
    resetForm();
    window.dispatchEvent(new CustomEvent('refreshDashboard'));
  };

  const resetForm = () => {
    setFormData({
      primaryGuest: {
        firstName: '',
        middleName: '',
        lastName: '',
        dob: '',
        mobile: '',
        address: '',
        identityProof: '',
        identityNumber: '',
        identityFile: null
      },
      familyMembers: [],
      checkInTime: '',
      checkOutTime: '',
      checkInDate: '',
      checkOutDate: '',
      stayDuration: '12hr',
      farePerNight: 0,
      advancePayment: 0,
      remainingPayment: 0,
      companyId: '',
      extraBed: false,
      extraBedPrice: 0,
      mealPlan: {
        breakfast: false,
        lunch: false,
        dinner: false
      },
      wakeUpCall: '',
      wakeUpCallTime: ''
    });
    setImagePreview({});
  };

  const handleCheckOut = (bookingId: number) => {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const booking = bookings.find((b: any) => b.id === bookingId);
    
    if (booking) {
      // Generate bill first
      generateBill(booking);
      
      // Set room to cleaning status
      const roomStatuses = JSON.parse(localStorage.getItem('roomStatuses') || '{}');
      roomStatuses[booking.roomNumber] = 'cleaning';
      localStorage.setItem('roomStatuses', JSON.stringify(roomStatuses));
      
      // Remove booking
      const updatedBookings = bookings.filter((b: any) => b.id !== bookingId);
      localStorage.setItem('bookings', JSON.stringify(updatedBookings));
      
      toast({
        title: "Check-out Successful",
        description: "Guest has been checked out. Room is now in cleaning mode."
      });
    }
    
    closeGuestDetails();
    window.dispatchEvent(new CustomEvent('refreshDashboard'));
  };

  const FileUploadArea = ({ isPrimary = true, memberIndex }: { isPrimary?: boolean; memberIndex?: number; }) => {
    const previewKey = isPrimary ? 'primary' : `member-${memberIndex}`;
    const hasPreview = imagePreview[previewKey];
    
    return (
      <div className="space-y-2">
        <div 
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => handleDrop(e, isPrimary, memberIndex)}
          onClick={() => document.getElementById(`file-${isPrimary ? 'primary' : memberIndex}`)?.click()}
        >
          <input
            id={`file-${isPrimary ? 'primary' : memberIndex}`}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0], isPrimary, memberIndex);
              }
            }}
          />
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">
            Drag and drop identity proof or click to browse
          </p>
          <p className="text-xs text-gray-400">
            Supports PDF, JPG, PNG files
          </p>
        </div>
        
        {hasPreview && (
          <div className="relative">
            <img 
              src={imagePreview[previewKey]} 
              alt="Identity proof preview" 
              className="w-full h-32 object-cover rounded-lg border" 
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                const newWindow = window.open();
                if (newWindow) {
                  newWindow.document.write(`<img src="${imagePreview[previewKey]}" style="max-width: 100%; max-height: 100%;" />`);
                }
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Guest Registration Form */}
      <Dialog open={isGuestFormOpen} onOpenChange={closeGuestForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Guest Registration - Room {selectedRoom}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company / Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Select Company (Optional)</Label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">Walk-in Guest</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.companyName} - {company.roomPriceDiscount}% discount
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Primary Guest Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Primary Guest Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={formData.primaryGuest.firstName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryGuest: { ...prev.primaryGuest, firstName: e.target.value }
                      }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Middle Name</Label>
                    <Input
                      value={formData.primaryGuest.middleName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryGuest: { ...prev.primaryGuest, middleName: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={formData.primaryGuest.lastName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryGuest: { ...prev.primaryGuest, lastName: e.target.value }
                      }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={formData.primaryGuest.dob}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryGuest: { ...prev.primaryGuest, dob: e.target.value }
                      }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    <Input
                      value={formData.primaryGuest.mobile}
                      onChange={(e) => handleMobileChange(e.target.value)}
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={formData.primaryGuest.address}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      primaryGuest: { ...prev.primaryGuest, address: e.target.value }
                    }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Identity Proof Type</Label>
                    <select
                      value={formData.primaryGuest.identityProof}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryGuest: { ...prev.primaryGuest, identityProof: e.target.value }
                      }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      required
                    >
                      <option value="">Select Identity Proof</option>
                      <option value="aadhar">Aadhar Card</option>
                      <option value="pan">PAN Card</option>
                      <option value="passport">Passport</option>
                      <option value="voter">Voter ID</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Identity Proof Number</Label>
                    <Input
                      value={formData.primaryGuest.identityNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryGuest: { ...prev.primaryGuest, identityNumber: e.target.value }
                      }))}
                      placeholder="Enter ID number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Upload Identity Proof</Label>
                    <FileUploadArea isPrimary={true} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Family Members */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Family Members</CardTitle>
                  <Button type="button" onClick={addFamilyMember} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Family Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {formData.familyMembers.map((member, index) => (
                  <div key={index} className="border rounded-lg p-4 mb-4 relative">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeFamilyMember(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>First Name</Label>
                          <Input
                            value={member.firstName}
                            onChange={(e) => updateFamilyMember(index, 'firstName', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Middle Name</Label>
                          <Input
                            value={member.middleName}
                            onChange={(e) => updateFamilyMember(index, 'middleName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Last Name</Label>
                          <Input
                            value={member.lastName}
                            onChange={(e) => updateFamilyMember(index, 'lastName', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date of Birth</Label>
                          <Input
                            type="date"
                            value={member.dob}
                            onChange={(e) => updateFamilyMember(index, 'dob', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mobile Number</Label>
                          <Input
                            value={member.mobile}
                            onChange={(e) => updateFamilyMember(index, 'mobile', e.target.value)}
                            maxLength={10}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Identity Proof Type</Label>
                          <select
                            value={member.identityProof}
                            onChange={(e) => updateFamilyMember(index, 'identityProof', e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                            required
                          >
                            <option value="">Select Identity Proof</option>
                            <option value="aadhar">Aadhar Card</option>
                            <option value="pan">PAN Card</option>
                            <option value="passport">Passport</option>
                            <option value="voter">Voter ID</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Identity Proof Number</Label>
                          <Input
                            value={member.identityNumber || ''}
                            onChange={(e) => updateFamilyMember(index, 'identityNumber', e.target.value)}
                            placeholder="Enter ID number"
                            required
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Upload Identity Proof</Label>
                          <FileUploadArea isPrimary={false} memberIndex={index} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Additional Services */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Extra Bed */}
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="extraBed"
                    checked={formData.extraBed}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, extraBed: !!checked }))}
                  />
                  <Label htmlFor="extraBed" className="text-sm font-medium">
                    Extra Bed (₹{formData.extraBedPrice})
                  </Label>
                </div>

                {/* Meal Plan */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Meal Plan</Label>
                  <div className="flex flex-col space-y-3">
                    {hotelConfig.mealPrices && (
                      <>
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="breakfast"
                            checked={formData.mealPlan.breakfast}
                            onCheckedChange={(checked) => setFormData(prev => ({
                              ...prev,
                              mealPlan: { ...prev.mealPlan, breakfast: !!checked }
                            }))}
                          />
                          <Label htmlFor="breakfast" className="text-sm font-medium">
                            Breakfast (₹{hotelConfig.mealPrices.breakfast})
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="lunch"
                            checked={formData.mealPlan.lunch}
                            onCheckedChange={(checked) => setFormData(prev => ({
                              ...prev,
                              mealPlan: { ...prev.mealPlan, lunch: !!checked }
                            }))}
                          />
                          <Label htmlFor="lunch" className="text-sm font-medium">
                            Lunch (₹{hotelConfig.mealPrices.lunch})
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="dinner"
                            checked={formData.mealPlan.dinner}
                            onCheckedChange={(checked) => setFormData(prev => ({
                              ...prev,
                              mealPlan: { ...prev.mealPlan, dinner: !!checked }
                            }))}
                          />
                          <Label htmlFor="dinner" className="text-sm font-medium">
                            Dinner (₹{hotelConfig.mealPrices.dinner})
                          </Label>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Wake Up Call */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Wake Up Call Required</Label>
                    <select
                      value={formData.wakeUpCall}
                      onChange={(e) => setFormData(prev => ({ ...prev, wakeUpCall: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="">No Wake Up Call</option>
                      <option value="yes">Yes, Set Wake Up Call</option>
                    </select>
                  </div>
                  {formData.wakeUpCall === 'yes' && (
                    <div className="space-y-2">
                      <Label>Wake Up Time</Label>
                      <Input
                        type="time"
                        value={formData.wakeUpCallTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, wakeUpCallTime: e.target.value }))}
                        required
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stay Duration & Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stay Duration & Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration Type</Label>
                    <select
                      value={formData.stayDuration}
                      onChange={(e) => setFormData(prev => ({ ...prev, stayDuration: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="12hr">12 Hours (Check-out at 12:00 PM next day)</option>
                      <option value="24hr">24 Hours (From check-in time)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Base Room Fare</Label>
                    <Input
                      type="number"
                      value={formData.farePerNight}
                      onChange={(e) => setFormData(prev => ({ ...prev, farePerNight: parseInt(e.target.value) }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Check-in Date</Label>
                    <Input
                      type="date"
                      value={formData.checkInDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkInDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Check-in Time</Label>
                    <Input
                      type="time"
                      value={formData.checkInTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Check-out Date</Label>
                    <Input
                      type="date"
                      value={formData.checkOutDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkOutDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Check-out Time</Label>
                    <Input
                      type="time"
                      value={formData.checkOutTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkOutTime: e.target.value }))}
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
                        <span>-₹{((formData.farePerNight + (formData.extraBed ? formData.extraBedPrice : 0) + calculateMealCosts()) * (companies.find(c => c.id === formData.companyId)?.roomPriceDiscount || 0)) / 100}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount:</span>
                      <span>₹{formData.farePerNight + (formData.extraBed ? formData.extraBedPrice : 0) + calculateMealCosts() - ((formData.farePerNight + (formData.extraBed ? formData.extraBedPrice : 0) + calculateMealCosts()) * (companies.find(c => c.id === formData.companyId)?.roomPriceDiscount || 0)) / 100}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Advance Payment (₹)</Label>
                    <Input
                      type="number"
                      value={formData.advancePayment}
                      onChange={(e) => setFormData(prev => ({ ...prev, advancePayment: parseInt(e.target.value) || 0 }))}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
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

            <div className="flex justify-center space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={closeGuestForm}>
                Cancel
              </Button>
              <Button type="submit">
                Confirm Booking
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Guest Details View */}
      <Dialog open={isGuestDetailsOpen} onOpenChange={closeGuestDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Guest Details - Room {selectedGuest?.roomNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedGuest && <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Check-in Date & Time</Label>
                      <p className="font-medium">
                        {selectedGuest.checkInDate} at {selectedGuest.checkInTime}
                      </p>
                    </div>
                    <div>
                      <Label>Check-out Date & Time</Label>
                      <p className="font-medium">
                        {selectedGuest.checkOutDate} at {selectedGuest.checkOutTime}
                      </p>
                    </div>
                    <div>
                      <Label>Total Amount</Label>
                      <p className="font-medium">₹{selectedGuest.billing?.grandTotal || selectedGuest.farePerNight}</p>
                    </div>
                    <div>
                      <Label>Remaining Payment</Label>
                      <p className="font-medium text-red-600">₹{selectedGuest.remainingPayment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Primary Guest</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <p className="font-medium">
                        {selectedGuest.primaryGuest.firstName} {selectedGuest.primaryGuest.middleName} {selectedGuest.primaryGuest.lastName}
                      </p>
                    </div>
                    <div>
                      <Label>Mobile</Label>
                      <p className="font-medium">{selectedGuest.primaryGuest.mobile}</p>
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <p className="font-medium">{selectedGuest.primaryGuest.dob}</p>
                    </div>
                    <div>
                      <Label>Identity Proof</Label>
                      <p className="font-medium capitalize">{selectedGuest.primaryGuest.identityProof}</p>
                    </div>
                    <div>
                      <Label>Identity Proof Number</Label>
                      <p className="font-medium font-mono">{selectedGuest.primaryGuest.identityNumber || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Address</Label>
                    <p className="font-medium">{selectedGuest.primaryGuest.address}</p>
                  </div>
                </CardContent>
              </Card>

              {selectedGuest.familyMembers && selectedGuest.familyMembers.length > 0 && <Card>
                  <CardHeader>
                    <CardTitle>Family Members ({selectedGuest.familyMembers.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedGuest.familyMembers.map((member: any, index: number) => <div key={index} className="border rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Name</Label>
                            <p className="font-medium">
                              {member.firstName} {member.middleName} {member.lastName}
                            </p>
                          </div>
                          <div>
                            <Label>Mobile</Label>
                            <p className="font-medium">{member.mobile}</p>
                          </div>
                          <div>
                            <Label>Date of Birth</Label>
                            <p className="font-medium">{member.dob}</p>
                          </div>
                          <div>
                            <Label>Identity Proof</Label>
                            <p className="font-medium capitalize">{member.identityProof}</p>
                          </div>
                          <div>
                            <Label>Identity Proof Number</Label>
                            <p className="font-medium font-mono">{member.identityNumber || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>)}
                  </CardContent>
                </Card>}

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={closeGuestDetails}>
                  Close
                </Button>
                <Button variant="destructive" onClick={() => handleCheckOut(selectedGuest.id)}>
                  Check Out & Generate Bill
                </Button>
              </div>
            </div>}
        </DialogContent>
      </Dialog>

      {/* Bill Modal */}
      <Dialog open={showBill} onOpenChange={setShowBill}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Guest Bill</DialogTitle>
          </DialogHeader>
          
          {billData && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">Hotel Bill</h2>
                <p className="text-sm text-gray-600">Bill ID: #{billData.bookingId}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-sm">{billData.checkInDate} {billData.checkInTime}</p>
                </div>
                <div>
                  <Label>Check-out</Label>
                  <p className="text-sm">{billData.checkOutDate} {billData.checkOutTime}</p>
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
                    <span>₹{billData.baseFare}</span>
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
                    <span>₹{billData.totalBeforeDiscount}</span>
                  </div>
                  {billData.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({billData.discountPercentage}%):</span>
                      <span>-₹{billData.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Amount after discount:</span>
                    <span>₹{billData.finalFare}</span>
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
                    <span>₹{billData.grandTotal}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Advance Paid:</span>
                    <span>₹{billData.advancePayment}</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-600">
                    <span>Amount Due:</span>
                    <span>₹{billData.remainingPayment}</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 border-t pt-2">
                Generated on: {new Date(billData.generatedAt).toLocaleString()}
              </div>

              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => setShowBill(false)}>
                  Close
                </Button>
                <Button onClick={() => window.print()}>
                  Print Bill
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GuestRegistration;
