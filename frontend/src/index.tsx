import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Auth0Provider } from "@auth0/auth0-react";
import App from './App';

ReactDOM.render(
  <Auth0Provider
  domain="curriculum-utility.us.auth0.com"
  clientId="TDRUQjuEGlkrjmagU60qEODsqG2lwVzR"
  redirectUri={window.location.origin}
  audience="https://curriculum-utility"
  scope="openid profile email"
  >
    <App />
  </Auth0Provider>,
  document.getElementById("root")
);
