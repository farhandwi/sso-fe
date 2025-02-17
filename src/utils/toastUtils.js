import { toast } from 'react-toastify';

const defaultToastConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "dark",
};

export const showErrorToast = (message) => {
  toast.error(message, defaultToastConfig);
};

export const showSuccessToast = (message) => {
  toast.success(message, defaultToastConfig);
};

export const showInfoToast = (message) => {
  toast.info(message, defaultToastConfig);
};