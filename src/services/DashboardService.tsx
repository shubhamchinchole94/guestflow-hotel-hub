
import axios from 'axios';

const DASHBOARD_SERVICE_URL = process.env.REACT_APP_DASHBOARD_SERVICE_URL || "http://localhost:9093";
const DASHBOARD_SERVICE_BASE_URL = `${DASHBOARD_SERVICE_URL}/v1/api`;

const HEADERS = {
  'Content-Type': 'application/json',
};

class DashboardService {

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
}

export default new DashboardService();
