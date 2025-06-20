// src/services/UserService.ts
import axios from 'axios';

//const API_BASE_URL = 'http://localhost:9091/v1/api';

const USER_SERVICE_URL = process.env.REACT_APP_LOGIN_SERVICE_URL || "http://localhost:9091"
const USER_SERVICE_BASE_URL = USER_SERVICE_URL + "/v1/api";


const HEADERS = {
  'Content-Type': 'application/json',
  // You can add Authorization token here if needed:
  // 'Authorization': `Bearer ${localStorage.getItem('token')}`
};

const UserService = {
  createUser: async (userData: { username: string; password: string; role: string }) => {
    const response = await axios.post(`${USER_SERVICE_BASE_URL}/user`, userData, {
      headers: HEADERS,
    });
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await axios.delete(`${USER_SERVICE_BASE_URL}/${id}`, {
      headers: HEADERS,
    });
    return response.data;
  },

  getAllUsers: async () => {
    const response = await axios.get(`${USER_SERVICE_BASE_URL}/users`, {
      headers: HEADERS,
    });
    return response.data;
  }
};

export default UserService;
