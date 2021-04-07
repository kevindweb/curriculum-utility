import { GetTokenSilentlyOptions } from '@auth0/auth0-spa-js';

const getTree = async (getAccessTokenSilently: (options?: GetTokenSilentlyOptions) => Promise<string>) => {
  const accessToken = await getAccessTokenSilently({
    audience: 'https://curriculum-utility'
  });

  const response = await fetch(`${window.__BACKEND_IP__}/tree`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw response;
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
};

const setRequirementSemester = async (jsonBody: { curriculumReqID: number, semester: number }, getAccessTokenSilently: (options?: GetTokenSilentlyOptions) => Promise<string>) => {
  const accessToken = await getAccessTokenSilently({
    audience: 'https://curriculum-utility'
  });

  const response = await fetch(`${window.__BACKEND_IP__}/changeReqSemester`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(jsonBody)
  });
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
};

const setElectiveCourse = async (jsonBody: { curriculumReqID: number, course: { subject: string, num: string } }, getAccessTokenSilently: (options?: GetTokenSilentlyOptions) => Promise<string>) => {
  const accessToken = await getAccessTokenSilently({
    audience: 'https://curriculum-utility'
  });

  const response = await fetch(`${window.__BACKEND_IP__}/setElectiveCourse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(jsonBody)
  });
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

export {
  getTree,
  setRequirementSemester,
  setElectiveCourse
};
