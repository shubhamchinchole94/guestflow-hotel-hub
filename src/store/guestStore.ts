
import { create } from 'zustand';

interface GuestStore {
  isGuestFormOpen: boolean;
  isGuestDetailsOpen: boolean;
  selectedRoom: string | null;
  selectedDate: Date | null;
  selectedGuest: any | null;
  openGuestForm: (roomNumber: string, date: Date) => void;
  closeGuestForm: () => void;
}

export const useGuestStore = create<GuestStore>((set) => ({
  isGuestFormOpen: false,
  isGuestDetailsOpen: false,
  selectedRoom: null,
  selectedDate: null,
  selectedGuest: null,
  openGuestForm: (roomNumber, date) => set({ 
    isGuestFormOpen: true, 
    selectedRoom: roomNumber, 
    selectedDate: date 
  }),
  closeGuestForm: () => set({ 
    isGuestFormOpen: false, 
    selectedRoom: null, 
    selectedDate: null 
  })
}));
