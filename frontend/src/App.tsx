import * as React from 'react';
import { useState } from 'react';
import RouterTabExample from './RouterTabExample';
import { makeStyles, CircularProgress } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools'
import './App.css';
import { getTree } from './api/tree-api';

const useStyles = makeStyles({
  root: {
    width: '100%',
    height: '100%',
  },
  loading: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
});

const theme = createMuiTheme({
  palette: {
    type: 'light',
    primary: {
      main: '#033C5A',
      light: '#35637b',
      dark: '#022a3e',
    },
    secondary: {
      main: '#AA9868',
      light: '#bbac86',
      dark: '#766a48'
    }
  }
});


// window.__BACKEND_IP__ = "http://localhost:8081";
window.__BACKEND_IP__ = "https://kdeems-senior-design-5mz6n.ondigitalocean.app";
// window.__BACKEND_IP__ = "http://100.26.170.118:8081";
// window.__BACKEND_IP__ = "https://34.233.135.224:8081";
const queryClient = new QueryClient()

export default function App() {
  const classes = useStyles();

  const { isAuthenticated, isLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <div className={classes.loading}>
          <CircularProgress size={100} />
        </div>
      </ThemeProvider>
    )
  }

  if (!isAuthenticated) {
    loginWithRedirect();
    return;
  }

  // Prefetch data so it is already loaded when a tab is opened
  // queryClient.prefetchQuery('tree', () => getTree(getAccessTokenSilently));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <React.Fragment>
          <CssBaseline />
          <div className={classes.root}>
            <Router>
              <RouterTabExample />
            </Router>
          </div>
        </React.Fragment>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  )
}
