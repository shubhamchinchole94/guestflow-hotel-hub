import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useGuestStore } from '@/store/guestStore';
import { format } from 'date-fns';
import { Upload, Eye } from 'lucide-react';
import GuestRegistrationService from '@/services/GuestRegistrationService';
import CompanyService from '@/services/company';
import PrimaryGuestDetails from './PrimaryGuestDetails';
import FamilyMembers from './FamilyMembers';
import AdditionalServices from './AdditionalServices';
import MealPlan from './MealPlan';
import BillingSummary from './BillingSummary';
import GuestDetailsView from './GuestDetailsView';
import BillModal from './BillModal';
import RoomService from '@/services/RoomService';

interface GuestRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoom: string | null;
  selectedDate: Date | null;
  companies: any[];
  hotelConfig: any;
}

const GuestRegistrationForm: React.FC<GuestRegistrationFormProps> = ({
  isOpen,
  onClose,
  selectedRoom,
  selectedDate,
  companies,
  hotelConfig,
}) => {
  const {
    isGuestDetailsOpen,
    selectedGuest,
    closeGuestDetails,
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
      identityFile: null as File | null,
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
      dinner: false,
    },
    wakeUpCall: '',
    wakeUpCallTime: '',
    roomNumber: selectedRoom || '',
    totalGuests: 1,
    status: 'booked',
  });

  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ [key: string]: string }>({});
  const [showBill, setShowBill] = useState(false);
  const [billData, setBillData] = useState<any>(null);
  const [fetchedCompanies, setFetchedCompanies] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
      fetchHotelConfig();
    }
  }, [isOpen]);

  const fetchCompanies = async () => {
    try {
      const response = await CompanyService.getAllCompanies();
      setFetchedCompanies(response.data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setFetchedCompanies([]);
    }
  };

  const fetchHotelConfig = async () => {
    // Implement hotel config service call when available
    // For now, use the passed hotelConfig prop
  };

  useEffect(() => {
    if (isOpen && selectedDate && selectedRoom) {
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

      setFormData((prev) => ({
        ...prev,
        checkInDate,
        checkInTime,
        checkOutDate,
        checkOutTime,
        farePerNight: roomInfo?.price || 1000,
        extraBedPrice: hotelConfig.extraBedPrice || 0,
        roomNumber: selectedRoom,
        totalGuests: 1 + prev.familyMembers.length,
        status: 'booked',
      }));
    }
  }, [isOpen, selectedDate, selectedRoom, formData.stayDuration, hotelConfig]);

  useEffect(() => {
    const totalGuests = 1 + formData.familyMembers.length;
    setFormData((prev) => ({
      ...prev,
      totalGuests,
    }));
  }, [formData.familyMembers.length]);

  useEffect(() => {
    const extraBedCost = formData.extraBed ? formData.extraBedPrice : 0;
    const mealCosts = calculateMealCosts();
    const totalFare = formData.farePerNight + extraBedCost + mealCosts;

    let finalFare = totalFare;
    let appliedDiscount = 0;

    if (formData.companyId) {
      const selectedCompany = fetchedCompanies.find((c) => c.id === formData.companyId);
      if (selectedCompany) {
        appliedDiscount = (totalFare * selectedCompany.roomPriceDiscount) / 100;
        finalFare = totalFare - appliedDiscount;
      }
    }

    const remaining = finalFare - formData.advancePayment;
    setFormData((prev) => ({
      ...prev,
      remainingPayment: Math.max(0, remaining),
    }));
  }, [
    formData.farePerNight,
    formData.advancePayment,
    formData.extraBed,
    formData.extraBedPrice,
    formData.mealPlan,
    formData.companyId,
    fetchedCompanies,
    hotelConfig,
  ]);

  const calculateMealCosts = () => {
    let total = 0;
    if (
      formData.mealPlan.breakfast &&
      hotelConfig.mealPrices?.breakfast &&
      hotelConfig.enabledMealPlans?.breakfast
    ) {
      total += hotelConfig.mealPrices.breakfast;
    }
    if (
      formData.mealPlan.lunch &&
      hotelConfig.mealPrices?.lunch &&
      hotelConfig.enabledMealPlans?.lunch
    ) {
      total += hotelConfig.mealPrices.lunch;
    }
    if (
      formData.mealPlan.dinner &&
      hotelConfig.mealPrices?.dinner &&
      hotelConfig.enabledMealPlans?.dinner
    ) {
      total += hotelConfig.mealPrices.dinner;
    }
    return total;
  };

  const getRoomInfo = (roomNumber: string) => {
    return { price: 1000, type: 'Regular' };
  };

  const checkExistingGuest = async (mobile: string) => {
    try {
      const response = await GuestRegistrationService.getAllRegistrations();
      const bookings = response.data;
      const existingBooking = bookings.find(
        (booking: any) => booking.primaryGuest.mobile === mobile
      );
      if (existingBooking) {
        setFormData((prev) => ({
          ...prev,
          primaryGuest: {
            ...prev.primaryGuest,
            ...existingBooking.primaryGuest,
            mobile,
          },
        }));
        toast({
          title: 'Returning Guest',
          description: 'Guest details loaded from previous booking',
        });
      }
    } catch (error) {
      console.error('Error checking existing guest:', error);
    }
  };

  const handleMobileChange = (mobile: string) => {
    setFormData((prev) => ({
      ...prev,
      primaryGuest: { ...prev.primaryGuest, mobile },
    }));
    if (mobile.length === 10) {
      checkExistingGuest(mobile);
    }
  };

  const handleFileUpload = (
    file: File,
    isPrimary: boolean = true,
    memberIndex?: number
  ) => {
    if (isPrimary) {
      setFormData((prev) => ({
        ...prev,
        primaryGuest: { ...prev.primaryGuest, identityFile: file },
      }));
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview((prev) => ({
          ...prev,
          primary: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else if (memberIndex !== undefined) {
      const updatedMembers = [...formData.familyMembers];
      updatedMembers[memberIndex] = { ...updatedMembers[memberIndex], identityFile: file };
      setFormData((prev) => ({ ...prev, familyMembers: updatedMembers }));
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview((prev) => ({
          ...prev,
          [`member-${memberIndex}`]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
    toast({
      title: 'File Uploaded',
      description: `${file.name} uploaded successfully`,
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    isPrimary: boolean = true,
    memberIndex?: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], isPrimary, memberIndex);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCompany = fetchedCompanies.find((c) => c.id === formData.companyId);
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
      id: Date.now().toString(),
      roomNumber: selectedRoom,
      ...formData,
      totalGuests: 1 + formData.familyMembers.length,
      status: formData.status || 'booked',
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
        grandTotal: finalFare + (finalFare * gstRate) / 100,
      },
    };

    try {
      const formDataToSend = new FormData();
      formDataToSend.append(
  'form',
  new Blob([JSON.stringify(booking)], { type: 'application/json' })
);


      if (formData.primaryGuest.identityFile) {
        formDataToSend.append('primaryIdentityFile', formData.primaryGuest.identityFile);
      }

      formData.familyMembers.forEach((member, index) => {
        if (member.identityFile) {
          formDataToSend.append(`familyMemberIdentityFile_${index}`, member.identityFile);
        }
      });

      if (formData.wakeUpCall === 'yes' && formData.wakeUpCallTime) {
        formDataToSend.append(
          'wakeUpCall',
          JSON.stringify({
            roomNumber: selectedRoom,
            time: formData.wakeUpCallTime,
            date: formData.checkInDate,
            guestName: `${formData.primaryGuest.firstName} ${formData.primaryGuest.lastName}`,
            bookingId: booking.id,
          })
        );
      }
      await GuestRegistrationService.createRegistration(formDataToSend);
      await RoomService.updateRoomStatus(selectedRoom, 'booked');
      toast({
        title: 'Booking Confirmed',
        description: `Room ${selectedRoom} booked successfully`,
      });

      onClose();
      resetForm();
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (error) {
      console.error('Error creating registration:', error);
      toast({
        title: 'Booking Failed',
        description: 'An error occurred while confirming the booking',
      });
    }
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
        identityFile: null,
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
        dinner: false,
      },
      wakeUpCall: '',
      wakeUpCallTime: '',
      roomNumber: '',
      totalGuests: 1,
      status: 'active',
    });
    setImagePreview({});
  };

  const generateBill = (bookingData: any) => {
    const selectedCompany = fetchedCompanies.find((c) => c.id === bookingData.companyId);
    const extraBedCost = bookingData.extraBed ? bookingData.extraBedPrice : 0;
    const mealCosts =
      (bookingData.mealPlan?.breakfast ? hotelConfig.mealPrices?.breakfast || 0 : 0) +
      (bookingData.mealPlan?.lunch ? hotelConfig.mealPrices?.lunch || 0 : 0) +
      (bookingData.mealPlan?.dinner ? hotelConfig.mealPrices?.dinner || 0 : 0);

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
      remainingPayment: finalFare + gstAmount - bookingData.advancePayment,
      companyName: selectedCompany?.companyName || 'Walk-in Guest',
      generatedAt: new Date().toISOString(),
    };

    setBillData(bill);
    setShowBill(true);
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      const response = await GuestRegistrationService.getRegistrationById(bookingId);
      const booking = response.data;

      if (booking) {
        // Update status to inactive
        const updatedBooking = { ...booking, status: 'inactive' };
        const formData = new FormData();
        formData.append('booking', JSON.stringify(updatedBooking));
        
        await GuestRegistrationService.updateRegistration(bookingId, formData);
        
        generateBill(booking);

        toast({
          title: 'Check-out Successful',
          description: 'Guest has been checked out. Room is now in cleaning mode.',
        });
      }

      closeGuestDetails();
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (error) {
      console.error('Error during check-out:', error);
      toast({
        title: 'Check-out Failed',
        description: 'An error occurred during check-out',
      });
    }
  };

  const FileUploadArea = ({
    isPrimary = true,
    memberIndex,
  }: {
    isPrimary?: boolean;
    memberIndex?: number;
  }) => {
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
          onClick={() =>
            document.getElementById(`file-${isPrimary ? 'primary' : memberIndex}`)?.click()
          }
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
          <p className="text-sm text-gray-600">Drag and drop identity proof or click to browse</p>
          <p className="text-xs text-gray-400">Supports PDF, JPG, PNG files</p>
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
                  newWindow.document.write(
                    `<img src="${imagePreview[previewKey]}" style="max-width: 100%; max-height: 100%;" />`
                  );
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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Guest Registration - Room {selectedRoom}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company / Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="form-group">
                  <Label>Select Company (Optional)</Label>
                  <select
                    value={formData.companyId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, companyId: e.target.value }))
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 z-50"
                  >
                    <option value="">Walk-in Guest</option>
                    {fetchedCompanies && fetchedCompanies.length > 0 ? (
                      fetchedCompanies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.companyName} - {company.roomPriceDiscount}% discount
                        </option>
                      ))
                    ) : (
                      <option disabled>No companies available</option>
                    )}
                  </select>
                </div>
              </CardContent>
            </Card>

            <PrimaryGuestDetails
              primaryGuest={formData.primaryGuest}
              setFormData={setFormData}
              imagePreview={imagePreview}
              handleMobileChange={handleMobileChange}
              handleFileUpload={handleFileUpload}
              handleDrag={handleDrag}
              handleDrop={handleDrop}
              dragActive={dragActive}
            />

            <FamilyMembers
              familyMembers={formData.familyMembers}
              setFormData={setFormData}
              FileUploadArea={FileUploadArea}
            />

            <AdditionalServices
              formData={formData}
              setFormData={setFormData}
              hotelConfig={hotelConfig}
            />

            <MealPlan
              mealPlan={formData.mealPlan}
              setFormData={setFormData}
              hotelConfig={hotelConfig}
            />

            <BillingSummary
              formData={formData}
              setFormData={setFormData}
              companies={fetchedCompanies}
              hotelConfig={hotelConfig}
              calculateMealCosts={calculateMealCosts}
            />

            <div className="flex justify-center space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Confirm Booking</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <GuestDetailsView
        isOpen={isGuestDetailsOpen}
        onClose={closeGuestDetails}
        selectedGuest={selectedGuest}
        onCheckOut={handleCheckOut}
      />

      <BillModal
        isOpen={showBill}
        onClose={() => setShowBill(false)}
        billData={billData}
        hotelConfig={hotelConfig}
      />
    </>
  );
};

export default GuestRegistrationForm;
