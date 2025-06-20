// src/services/CompanyService.ts
import axios from 'axios';

//const API_BASE_URL = "http://localhost:9091/v1/api";

const COMPANY_SERVICE_URL = process.env.REACT_APP_LOGIN_SERVICE_URL || "http://localhost:9091"
const COMPANY_SERVICE_BASE_URL = COMPANY_SERVICE_URL + "/v1/api";


const HEADERS = {
  'Content-Type': 'application/json',
};

class CompanyService {

  createCompany(companyData: any) {
    return axios.post(`${COMPANY_SERVICE_BASE_URL}/company`, companyData, {
      headers: HEADERS,
    });
  }

  deleteCompany(id: string) {
    return axios.delete(`${COMPANY_SERVICE_BASE_URL}/company/${id}`, {
      headers: HEADERS,
    });
  }

  getAllCompanies() {
    return axios.get(`${COMPANY_SERVICE_BASE_URL}/companies`, {
      headers: HEADERS,
    });

  }

  updateCompany(id: string, companyData: any) {
    return axios.put(`${COMPANY_SERVICE_BASE_URL}/company/${id}`, companyData, {
      headers: HEADERS,
    });
  }
}

export default new CompanyService();
