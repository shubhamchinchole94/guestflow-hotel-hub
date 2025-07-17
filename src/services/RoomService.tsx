// src/services/RoomService.ts
import axios from 'axios';

const ROOM_SERVICE_URL = process.env.REACT_APP_DASHBOARD_SERVICE_URL || "http://localhost:9092";
const ROOM_SERVICE_BASE_URL = ROOM_SERVICE_URL + "/api";

const HEADERS = {
  'Content-Type': 'application/json',
};

class RoomService {

  createRoom(roomData: any) {
    return axios.post(`${ROOM_SERVICE_BASE_URL}/rooms`, roomData, {
      headers: HEADERS,
    });
  }

  getAllRooms() {
    return axios.get(`${ROOM_SERVICE_BASE_URL}/rooms`, {
      headers: HEADERS,
    });
  }

  getRoomById(id: string) {
    return axios.get(`${ROOM_SERVICE_BASE_URL}/rooms/${id}`, {
      headers: HEADERS,
    });
  }

  updateRoom(id: string, roomData: any) {
    return axios.put(`${ROOM_SERVICE_BASE_URL}/rooms/${id}`, roomData, {
      headers: HEADERS,
    });
  }

  deleteRoom(id: string) {
    return axios.delete(`${ROOM_SERVICE_BASE_URL}/rooms/${id}`, {
      headers: HEADERS,
    });
  }

  updateRoomStatus(roomNumber: string, status: string) {
    return axios.put(`${ROOM_SERVICE_BASE_URL}/rooms/update-status/${roomNumber}/${status}`, null, {
      headers: HEADERS,
    });
  }
}

export default new RoomService();
