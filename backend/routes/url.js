import express from "express";
import Url from "../models/Url.js";
import { nanoid } from "nanoid";

const router = express.Router();

router.post("/shorten", async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    let formattedUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }

    let shortId;
    let exists = true;

    while (exists) {
      shortId = nanoid(7);
      exists = await Url.findOne({ shortId });
    }

    const url = await Url.create({
      shortId,
      originalUrl: formattedUrl,
    });

    console.log("Created URL:", formattedUrl);

    res.json({
      shortId: url.shortId,
      shortUrl: `${process.env.BASE_URL}/${url.shortId}`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/stats/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;

    const url = await Url.findOne({ shortId });

    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    res.json({
      shortId: url.shortId,
      originalUrl: url.originalUrl,
      clicks: url.clicks,
      createdAt: url.createdAt,
    });
  } catch (error) {
    console.log("Stats Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;

    const url = await Url.findOne({ shortId });

    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    console.log("Redirecting to:", url.originalUrl);

    url.clicks += 1;
    await url.save();

    return res.redirect(302, url.originalUrl);
  } catch (error) {
    console.log("Redirect Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;