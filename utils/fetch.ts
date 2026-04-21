
/**
 * A wrapper around the native fetch API with built-in retry logic and timeout.
 */
export const safeFetch = async (
  url: string, 
  options: RequestInit = {}, 
  retries: number = 3, 
  backoff: number = 1000,
  timeoutMs: number = 30000
): Promise<Response> => {
  // Handle relative paths
  let finalUrl = url;
  if (url.startsWith('/') && !url.startsWith('//')) {
    // In the browser, relative URLs work fine and are safer for same-origin
    if (typeof window !== 'undefined') {
      finalUrl = url;
    } else {
      let baseUrl = process.env.APP_URL || '';
      if (baseUrl === 'undefined' || baseUrl === 'null') baseUrl = '';
      finalUrl = `${baseUrl.replace(/\/$/, '')}${url}`;
    }
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log(`Fetch Attempt: ${finalUrl}`);
    const response = await fetch(finalUrl, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(id);
    console.log(`Fetch Success: ${finalUrl} (Status: ${response.status})`);

    // Retry on server errors (5xx) or rate limits (429)
    if (!response.ok && retries > 0 && (response.status >= 500 || response.status === 429)) {
      console.warn(`Fetch failed with status ${response.status}. Retrying in ${backoff}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return safeFetch(url, options, retries - 1, backoff * 2, timeoutMs);
    }

    return response;
  } catch (error: any) {
    clearTimeout(id);
    console.error(`Fetch Error: ${finalUrl}`, error);
    
    const msg = (error.message || String(error || '')).toLowerCase();
    const isTimeout = error.name === 'AbortError' || msg.includes('timeout');
    const isNetworkError = msg.includes('failed to fetch') || 
                          msg.includes('network error') || 
                          msg.includes('load failed') ||
                          error.name === 'TypeError';

    if (retries > 0 && (isTimeout || isNetworkError)) {
      console.warn(`Fetch failed (${error.name || 'Error'}: ${error.message}). Retrying in ${backoff}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return safeFetch(url, options, retries - 1, backoff * 2, timeoutMs);
    }

    throw error;
  }
};
