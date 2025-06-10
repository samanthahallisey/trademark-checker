import axios from 'axios';

export async function checkTrademark(name) {
  const query = `"${name}"[BI] AND 043[IC]`; // Basic Index + Class 43
  const url = `https://developer.uspto.gov/ibd-api/v1/application/publications?searchText=${encodeURIComponent(query)}&rows=10&start=0`;

  try {
    const res = await axios.get(url);
    const results = res.data?.response?.docs || [];

    const isTaken = results.some(doc => {
      return doc.status === 'LIVE' || doc.status === 'PENDING';
    });

    return {
      name,
      isAvailable: !isTaken,
      matches: results.length
    };

  } catch (err) {
    console.error(`Trademark check failed:`, err.message);
    return {
      name,
      isAvailable: false,
      error: true
    };
  }
}
