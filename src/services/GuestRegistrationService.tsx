import axios from 'axios';

const GUEST_REGISTRATION_SERVICE_URL =
  process.env.REACT_APP_GUEST_SERVICE_URL || 'http://localhost:9093';

const GUEST_REGISTRATION_BASE_URL = `${GUEST_REGISTRATION_SERVICE_URL}/api/guest-registration`;
const ROOM_TRANSFER_BASE_URL = `${GUEST_REGISTRATION_SERVICE_URL}/api/room-transfers`;

const HEADERS = {
  'Content-Type': 'application/json',
};

class GuestRegistrationService {
  // -------------------------------
  // Guest Registration Operations
  // -------------------------------

  createRegistration(formData: FormData) {
    return axios.post(GUEST_REGISTRATION_BASE_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  updateRegistration(id: string, formData: FormData) {
  return axios.put(`${GUEST_REGISTRATION_BASE_URL}/${id}`, formData);
}


  getAllRegistrations() {
    return axios.get(GUEST_REGISTRATION_BASE_URL, {
      headers: HEADERS,
    });
  }

  getRegistrationById(id: string) {
    return axios.get(`${GUEST_REGISTRATION_BASE_URL}/${id}`, {
      headers: HEADERS,
    });
  }

  deleteRegistration(id: string) {
    return axios.delete(`${GUEST_REGISTRATION_BASE_URL}/${id}`, {
      headers: HEADERS,
    });
  }

  updateStatusOfGuest(id: string, status: string) {
    return axios.put(
      `${GUEST_REGISTRATION_BASE_URL}/update-status/${id}/${status}`,
      { status },
      { headers: HEADERS }
    );
  }

  // -------------------------------
  // Room Transfer Operations
  // -------------------------------

  // Create a new room transfer record
  createRoomTransfer(transferData: any) {
    return axios.post(ROOM_TRANSFER_BASE_URL, transferData, {
      headers: HEADERS,
    });
  }

  // Get all room transfers
  getAllRoomTransfers() {
    return axios.get(ROOM_TRANSFER_BASE_URL, {
      headers: HEADERS,
    });
  }

  // Get room transfer by ID
  getRoomTransferById(id: string) {
    return axios.get(`${ROOM_TRANSFER_BASE_URL}/${id}`, {
      headers: HEADERS,
    });
  }

  // Get room transfers for a specific booking
  getRoomTransfersByBookingId(bookingId: string) {
    return axios.get(`${ROOM_TRANSFER_BASE_URL}/booking/${bookingId}`, {
      headers: HEADERS,
    });
  }

  // Update a room transfer record
  updateRoomTransfer(id: string, updatedTransfer: any) {
    return axios.put(`${ROOM_TRANSFER_BASE_URL}/${id}`, updatedTransfer, {
      headers: HEADERS,
    });
  }

  // Delete a room transfer record
  deleteRoomTransfer(id: string) {
    return axios.delete(`${ROOM_TRANSFER_BASE_URL}/${id}`, {
      headers: HEADERS,
    });
  }
}

export default new GuestRegistrationService();
