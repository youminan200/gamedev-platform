// Web app target URL configuration
// In production, point to your Vercel or Netlify deployed URL
// e.g. https://devground.vercel.app or https://devground.netlify.app
export const WEB_APP_URL = 
  process.env.EXPO_PUBLIC_WEB_URL || 
  'https://devground.vercel.app'; // Default fallback, replace with your live URL or local IP (e.g. http://10.0.2.2:8081 for android emulator)
