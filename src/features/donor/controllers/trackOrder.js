import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import axios from "axios";


let shipRocketToken = null;
let shipRocketTokenExpiry = null;

// Fetch ShipRocket Token
const fetchShipRocketToken = async () => {
  try {
    // Check if the token exists and is not expired
    if (shipRocketToken && shipRocketTokenExpiry > Date.now()) {
      console.log("Using existing valid ShipRocket token");
      return shipRocketToken;
    }

    console.log("Fetching a new ShipRocket token");
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.status === 200) {
      const { token, expires_in } = response.data;

      shipRocketToken = token;
      shipRocketTokenExpiry = Date.now() + expires_in * 1000; // Convert expires_in seconds to milliseconds

      return shipRocketToken;
    } else {
      throw new Error("Failed to authenticate with ShipRocket");
    }
  } catch (error) {
    console.error("Error fetching ShipRocket token:", error.message);
    throw new Error("ShipRocket authentication failed");
  }
};

export const trackOrder = async (req, res) => {
    try {
        const { order_id, channel_id } = req.query;
        
        if (!order_id || !channel_id) {
          return res.status(400).json({ success: false, message: "Missing order_id or channel_id" });
        }
    
        // Get ShipRocket Token (assuming you have a function to fetch it)
        const tokenn = await fetchShipRocketToken();
        console.log(shipRocketToken)
        const response = await axios.get(
          `https://apiv2.shiprocket.in/v1/external/courier/track?order_id=${order_id}&channel_id=${channel_id}`,
          {
            headers: {
              Authorization: `Bearer ${shipRocketToken}`,
              "Content-Type": "application/json",
            },
          }
        );
    
        res.json(response.data); // Send the tracking data to the frontend
      } catch (error) {
        console.error("Error fetching ShipRocket tracking data:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch tracking details from ShipRocket",
        });
      }
  };