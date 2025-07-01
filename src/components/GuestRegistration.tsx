
import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useGuestStore } from '@/store/guestStore';
import GuestRegistrationService from '@/services/GuestRegistrationService';
import GuestRegistrationForm from './GuestRegistrationForm';
import GuestDetailsView from './GuestDetailsView';
import BillModal from './BillModal';

const GuestRegistration = () => {
  const {
    isGuestFormOpen,
    isGuestDetailsOpen,
    selectedRoom,
    selectedDate,
    selectedGuest,
    closeGuestForm,
    closeGuestDetails,
  } = useGuestStore();

  const [companies, setCompanies] = useState<any[]>([]);
  const [hotelConfig, setHotelConfig] = useState<any>({});
  const [showBill, setShowBill] = useState(false);
  const [billData, setBillData] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setCompanies([{ id: '1', companyName: 'Default Company', roomPriceDiscount: 10, gstPercentage: 12 }]);
        setHotelConfig({
          extraBedPrice: 500,
          mealPrices: { breakfast: 200, lunch: 300, dinner: 400 },
          enabledMealPlans: { breakfast: true, lunch: true, dinner: true },
          hotelName: 'Sample Hotel',
          address: '123 Hotel St, City',
          phone: '123-456-7890',
          email: 'info@hotel.com',
          gstNumber: 'GST123456',
        });
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };
    fetchConfig();
  }, []);

  const generateBill = (bookingData: any) => {
    const selectedCompany = companies.find((c) => c.id === bookingData.companyId);
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
        generateBill(booking);
        await GuestRegistrationService.deleteRegistration(bookingId);

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
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <GuestRegistrationForm
        isOpen={isGuestFormOpen}
        onClose={closeGuestForm}
        selectedRoom={selectedRoom}
        selectedDate={selectedDate}
        companies={companies}
        hotelConfig={hotelConfig}
      />

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

export default GuestRegistration;
