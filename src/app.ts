import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
