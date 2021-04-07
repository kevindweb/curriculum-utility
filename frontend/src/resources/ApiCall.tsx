import * as React from 'react';
import { useState } from 'react';
import { GetTokenSilentlyOptions } from '@auth0/auth0-spa-js';

function generateAPIState(): {
  data: any,
  setData: React.Dispatch<React.SetStateAction<{}>>,
  loading: boolean,
  setLoading: React.Dispatch<React.SetStateAction<{}>>,
  requested: boolean,
  setRequested: React.Dispatch<React.SetStateAction<{}>>
} {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  return {
    data,
    setData,
    loading,
    setLoading,
    requested,
    setRequested,
  };
};

const loadQuery = async (apiCall: any, getAccessTokenSilently: (options?: GetTokenSilentlyOptions) => Promise<string>) => {
  var [url, jsonData] = apiCall();

  const accessToken = await getAccessTokenSilently({
    audience: 'https://curriculum-utility'
  });

  jsonData.headers = {
    Authorization: `Bearer ${accessToken}`,
  }

  const response = await fetch(url, jsonData);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
};

const loadApiData = async (apiCall: any, setLoading: any, setData: any, handleErr: any, getAccessToken: any) => {
  setLoading(true);

  try {
    var [url, data] = apiCall();

    const accessToken = await getAccessToken({
      audience: 'https://curriculum-utility'
    });

    data.headers = {
      Authorization: `Bearer ${accessToken}`,
    }

    const res = await fetch(url, data);
    const json = await res.json();
    setData(json);
  } catch (err) {
    // Handle the error
    handleErr(err);
  } finally {
    setLoading(false);
  }
};

const prefetchScheduler = async (queryClient: any, getAccessTokenSilently: (options?: GetTokenSilentlyOptions) => Promise<string>) => {
  await queryClient.prefetchQuery('schedule', () =>
    loadQuery(() => {
      return [window.__BACKEND_IP__ + "/getSchedule", {}];
    }, getAccessTokenSilently));
}

const prefetchExcel = async (queryClient: any, getAccessTokenSilently: (options?: GetTokenSilentlyOptions) => Promise<string>) => {
  await queryClient.prefetchQuery('transcript', () =>
    loadQuery(() => {
      return [window.__BACKEND_IP__ + "/getTransfromAlex", {}];
    }, getAccessTokenSilently));
}

export { generateAPIState, loadApiData, loadQuery, prefetchExcel };
