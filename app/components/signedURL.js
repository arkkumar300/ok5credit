import ApiService from './ApiServices';

const getSignedUrl = async (filePath) => {
  if (!filePath) return null;
  let path = filePath;

  // If it's a full URL, try to extract the object path from known buckets
  if (
    typeof filePath === 'string' &&
    (filePath.startsWith('http://') || filePath.startsWith('https://'))
  ) {
    try {
      const url = new URL(filePath);
      // GCS: https://storage.googleapis.com/<bucket>/<objectPath>
      const segments = url.pathname.replace(/^\/+/, '').split('/');
      if (url.hostname === 'storage.googleapis.com' && segments.length > 1) {
        path = segments.slice(1).join('/'); // drop bucket name
      } else {
        return filePath;
      }
    } catch {
      return filePath;
    }
  }
  console.log("path::",path)
  try {
    const response = await ApiService.get('/upload/signed-read', {
      params: { path },
    });

    return response?.data?.data?.url || null;
  } catch (err) {
    console.error('Signed URL fetch error:', err);
    return null;
  }
};

export default getSignedUrl;