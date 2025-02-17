import { useMemo } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';

const useAxiosJWT = ({ token, expire, setToken, setExpire, APIEndpoint }) => {
  return useMemo(() => {
    const instance = axios.create();

    instance.interceptors.request.use(
      async (config) => {
        if (token) {
          const currentDate = new Date();
          if (expire && expire * 1000 < currentDate.getTime()) {
            const response = await axios.get(`${APIEndpoint}/token`, {
              withCredentials: true
            });
            config.headers.Authorization = `Bearer ${response.data.data.token}`;
            setToken(response.data.data.token);
            const decoded = jwtDecode(response.data.data.token);
            setExpire(decoded.exp);
          } else {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        toast.error(error.response?.data?.message || 'Request error');
        return Promise.reject(error);
      }
    );

    return instance;
  }, [token, expire, APIEndpoint, setToken, setExpire]);
};

export default useAxiosJWT;