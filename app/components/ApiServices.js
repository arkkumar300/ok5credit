// src/services/ApiService.jsj

import axios from 'axios';

const ApiService = axios.create({
  // baseURL: 'http://192.168.29.244:3000/9023/api/', // Change for production/testing
  baseURL: 'https://aquaservices.esotericprojects.tech/9023/api/', // Change for production/testing
});

// Automatically set the right Content-Type
ApiService.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  } else {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

export default ApiService;
