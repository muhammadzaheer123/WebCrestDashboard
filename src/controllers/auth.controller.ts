import User from "../models/user.model";
import type { Request, Response } from "express";

export async function getAllUsers(req: Request, res: Response) {
  try {
    // password is select:false already, but keeping explicit select is fine
    const users = await User.find().select("-password");
    return res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    // ✅ middleware sets req.userId and req.user.id
    const userId = req.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (err) {
    console.error("Error fetching current user:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // whitelist fields (avoid updating role/password accidentally)
    const { name, email } = req.body as { name?: string; email?: string };

    const update: Record<string, any> = {};
    if (typeof name === "string") update.name = name.trim();
    if (typeof email === "string") update.email = email.toLowerCase().trim();

    const updated = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      projection: { password: 0 }, // ✅ correct way (instead of select in options)
    });

    if (!updated) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "User updated successfully", user: updated });
  } catch (err) {
    // duplicate email safety
    if ((err as any)?.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }
    console.error("Error updating user:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
