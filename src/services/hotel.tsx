// src/services/HotelService.ts
import axios from 'axios';

const HOTEL_SERVICE_URL = process.env.REACT_APP_HOTEL_SERVICE_URL || "http://localhost:9092";
const HOTEL_SERVICE_BASE_URL = `${HOTEL_SERVICE_URL}/v1/api`;

const HEADERS = {
  'Content-Type': 'application/json',
};

class HotelService {
  
 saveOrUpdateHotel(formData: FormData) {
  return axios.post(`${HOTEL_SERVICE_BASE_URL}/hotel`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

  getHotelConfig() {
    return axios.get(`${HOTEL_SERVICE_BASE_URL}/hotel`, {
      headers: HEADERS,
    });
  }
}

export default new HotelService();
