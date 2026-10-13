import "dotenv/config";

async function testOAuth() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OAuth failed:", data.error);
      console.error("Details:", data.error_description);
      return;
    }

    console.log("OAuth succeeded!");
    console.log("Token type:", data.token_type);
    console.log("Expires in:", data.expires_in, "seconds");
  } catch (error) {
    console.error("Request failed:", error.message);
  }
}

testOAuth();
