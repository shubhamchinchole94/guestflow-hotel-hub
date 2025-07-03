
import axios from 'axios';

const DASHBOARD_SERVICE_URL = process.env.REACT_APP_DASHBOARD_SERVICE_URL || "http://localhost:9094";
const DASHBOARD_SERVICE_BASE_URL = `${DASHBOARD_SERVICE_URL}/v1/api`;

const HEADERS = {
  'Content-Type': 'application/json',
};

class DashboardService {
  
  getBookings() {
    return axios.get(`${DASHBOARD_SERVICE_BASE_URL}/bookings`, {
      headers: HEADERS,
    });
  }

  createBooking(bookingData: any) {
    return axios.post(`${DASHBOARD_SERVICE_BASE_URL}/bookings`, bookingData, {
      headers: HEADERS,
    });
  }

  updateBooking(id: string, bookingData: any) {
    return axios.put(`${DASHBOARD_SERVICE_BASE_URL}/bookings/${id}`, bookingData, {
      headers: HEADERS,
    });
  }

  deleteBooking(id: string) {
    return axios.delete(`${DASHBOARD_SERVICE_BASE_URL}/bookings/${id}`, {
      headers: HEADERS,
    });
  }

  getRoomStatuses() {
    return axios.get(`${DASHBOARD_SERVICE_BASE_URL}/room-statuses`, {
      headers: HEADERS,
    });
  }

  updateRoomStatus(roomNumber: string, status: string) {
    return axios.put(`${DASHBOARD_SERVICE_BASE_URL}/room-statuses/${roomNumber}`, 
      { status }, 
      { headers: HEADERS }
    );
  }

  getStats() {
    return axios.get(`${DASHBOARD_SERVICE_BASE_URL}/stats`, {
      headers: HEADERS,
    });
  }

  getRevenueData() {
    return axios.get(`${DASHBOARD_SERVICE_BASE_URL}/revenue`, {
      headers: HEADERS,
    });
  }

  getWakeUpCalls() {
    return axios.get(`${DASHBOARD_SERVICE_BASE_URL}/wake-up-calls`, {
      headers: HEADERS,
    });
  }

  createWakeUpCall(wakeUpCallData: any) {
    return axios.post(`${DASHBOARD_SERVICE_BASE_URL}/wake-up-calls`, wakeUpCallData, {
      headers: HEADERS,
    });
  }
}

export default new DashboardService();
