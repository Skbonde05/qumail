export async function decryptAES({ encryptedBody, iv, key }) {
  const res = await fetch(
    `${process.env.REACT_APP_KM_URL}/decrypt`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encryptedData: encryptedBody,
        iv,
        key,
      }),
    }
  );

  const data = await res.json();
  return data.decrypted;
}
