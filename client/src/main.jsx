import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="269949070967-onm9jp8kfh936b8kmmg2c06i3rm5l1ia.apps.googleusercontent.com">
    
    <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
