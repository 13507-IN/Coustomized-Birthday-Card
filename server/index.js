require("dotenv").config();
const express = require("express");
const cors = require("cors");
const ImageKit = require("imagekit");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());


const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/auth", (_req, res) => {
  if (
    !process.env.IMAGEKIT_PUBLIC_KEY ||
    !process.env.IMAGEKIT_PRIVATE_KEY ||
    !process.env.IMAGEKIT_URL_ENDPOINT
  ) {
    return res.status(500).json({
      message:
        "Missing ImageKit environment variables. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT.",
    });
  }

  const auth = imagekit.getAuthenticationParameters();
  return res.json(auth);
});

app.listen(port, () => {
  console.log(`ImageKit auth server running on port ${port}`);
});
