import axios from 'axios';

async function test() {
  try {
    console.log("Testing health check...");
    const res = await axios.get('http://localhost:3000/api/health');
    console.log("Health check response:", JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.error("Health check failed:", err.message);
    if (err.response) {
      console.error("Response data:", JSON.stringify(err.response.data, null, 2));
    }
  }
}

test();
