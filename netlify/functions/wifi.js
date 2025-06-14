import fetch from 'node-fetch';

export const handler = async (event) => {
  const { lat, lng, type, key } = event.queryStringParameters;

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${key}`;

  const res = await fetch(url);
  const data = await res.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
