// src/services/LoginService.ts
import axios from 'axios';


const LOGIN_SERVICE_URL = process.env.REACT_APP_LOGIN_SERVICE_URL || "http://localhost:9091"
const LOGIN_SERVICE_BASE_URL = LOGIN_SERVICE_URL + "/v1/api/login";

const HEADERS = {
  'Content-Type': 'application/json',
};

const LoginService = {
  login: async (credentials: any) => {
    const response = await axios.post(
      LOGIN_SERVICE_BASE_URL,
      credentials,
      { headers: HEADERS }
    );
    return response.data;
  },
};

export default LoginService;
