// 🎯 CENTRAL IP CONFIGURATION 🎯
// Change IP address here ONLY - will update everywhere

export const IP_ADDRESS = '192.168.1.6'; // Change this IP only here!

export const getApiUrl = (path: string = '') => {
  return `http://${IP_ADDRESS}:3000${path}`;
};

