import axios from 'axios';

const GUEST_REGISTRATION_SERVICE_URL =
  process.env.REACT_APP_GUEST_SERVICE_URL || 'http://localhost:9093';

const GUEST_REGISTRATION_BASE_URL = `${GUEST_REGISTRATION_SERVICE_URL}/api/guest-registration`;

const HEADERS = {
  'Content-Type': 'application/json',
};

class GuestRegistrationService {
  // Create new registration with file
  createRegistration(formData: FormData) {
    return axios.post(GUEST_REGISTRATION_BASE_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Update registration with file
  updateRegistration(id: string, formData: FormData) {
    return axios.put(`${GUEST_REGISTRATION_BASE_URL}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Get all guest registrations
  getAllRegistrations() {
    return axios.get(GUEST_REGISTRATION_BASE_URL, {
      headers: HEADERS,
    });
  }

  // Get single guest registration by ID
  getRegistrationById(id: string) {
    return axios.get(`${GUEST_REGISTRATION_BASE_URL}/${id}`, {
      headers: HEADERS,
    });
  }

  // Delete guest registration
  deleteRegistration(id: string) {
    return axios.delete(`${GUEST_REGISTRATION_BASE_URL}/${id}`, {
      headers: HEADERS,
    });
  }

  updateStatusOfGuest(id: string, status: string) {
  return axios.put(
    `${GUEST_REGISTRATION_BASE_URL}/update-status/${id}/${status}`,
    { status }, // Payload body
    { headers: HEADERS } // Axios config
  );
}


}

export default new GuestRegistrationService();
