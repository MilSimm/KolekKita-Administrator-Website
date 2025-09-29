import { createServer } from "http";
import { storage } from "./storage.js";
import { insertJunkShopSchema } from "../shared/schema.js";

export async function registerRoutes(app) {
  // Junk Shop API routes
  app.get("/api/junk-shops", async (req, res) => {
    try {
      const junkShops = await storage.getAllJunkShops();
      res.json(junkShops);
    } catch (error) {
      console.error("Error fetching junk shops:", error);
      res.status(500).json({ error: "Failed to fetch junk shops" });
    }
  });

  app.get("/api/junk-shops/status/:status", async (req, res) => {
    try {
      const { status } = req.params;
      const junkShops = await storage.getJunkShopsByStatus(status);
      res.json(junkShops);
    } catch (error) {
      console.error("Error fetching junk shops by status:", error);
      res.status(500).json({ error: "Failed to fetch junk shops" });
    }
  });

  app.get("/api/junk-shops/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const junkShop = await storage.getJunkShop(id);
      if (!junkShop) {
        return res.status(404).json({ error: "Junk shop not found" });
      }
      res.json(junkShop);
    } catch (error) {
      console.error("Error fetching junk shop:", error);
      res.status(500).json({ error: "Failed to fetch junk shop" });
    }
  });

  app.post("/api/junk-shops", async (req, res) => {
    try {
      const validatedData = insertJunkShopSchema.parse(req.body);
      const junkShop = await storage.createJunkShop(validatedData);
      res.status(201).json(junkShop);
    } catch (error) {
      console.error("Error creating junk shop:", error);
      res.status(400).json({ error: "Failed to create junk shop" });
    }
  });

  app.patch("/api/junk-shops/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const junkShop = await storage.updateJunkShop(id, req.body);
      res.json(junkShop);
    } catch (error) {
      console.error("Error updating junk shop:", error);
      res.status(400).json({ error: "Failed to update junk shop" });
    }
  });

  app.post("/api/junk-shops/:id/verification", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, verifiedBy } = req.body;
      const junkShop = await storage.updateJunkShopVerification(id, status, notes, verifiedBy);
      res.json(junkShop);
    } catch (error) {
      console.error("Error updating verification:", error);
      res.status(400).json({ error: "Failed to update verification" });
    }
  });

  // User API routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
