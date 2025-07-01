
import React, { useState, useEffect } from 'react';
import { useGuestStore } from '@/store/guestStore';
import GuestRegistrationForm from './GuestRegistrationForm';

const GuestRegistration = () => {
  const {
    isGuestFormOpen,
    selectedRoom,
    selectedDate,
    closeGuestForm,
  } = useGuestStore();

  const [companies, setCompanies] = useState<any[]>([]);
  const [hotelConfig, setHotelConfig] = useState<any>({});

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

  return (
    <GuestRegistrationForm
      isOpen={isGuestFormOpen}
      onClose={closeGuestForm}
      selectedRoom={selectedRoom}
      selectedDate={selectedDate}
      companies={companies}
      hotelConfig={hotelConfig}
    />
  );
};

export default GuestRegistration;
