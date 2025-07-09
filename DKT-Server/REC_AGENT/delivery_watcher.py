import time
import pymongo
from bson import ObjectId
from dotenv import load_dotenv
import os
from REC_AGENT.chatbot_logic import handle_commitment_vs_delivery_check

# Load environment variables from .env file
load_dotenv()

# MongoDB connection settings (from .env)
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "dkt")  # Default to 'dkt' if not set

# Track processed delivery IDs locally
PROCESSED_IDS_FILE = "REC_AGENT/processed_deliveries.txt"

def load_processed_ids():
    try:
        with open(PROCESSED_IDS_FILE, "r") as f:
            return set(line.strip() for line in f)
    except FileNotFoundError:
        return set()

def save_processed_id(delivery_id):
    with open(PROCESSED_IDS_FILE, "a") as f:
        f.write(f"{delivery_id}\n")

def get_committed_quantity_from_asset_delivery(delivery):
    """
    Get committed quantity from asset delivery by counting the length of assetId array.
    This is the correct way as per the current data model where assetId is an array of product ObjectIds.
    """
    if not delivery or 'assetId' not in delivery:
        return 0
    return len(delivery['assetId'])

def get_committed_quantity_from_requested_products(db, delivery):
    """
    Alternative method: Get committed quantity from requestedProductModel entries.
    This counts products that are assigned to the partner for this delivery.
    """
    if not delivery or 'assetId' not in delivery or 'partnerId' not in delivery:
        return 0
    
    # Find all requestedProductModel entries for this delivery
    requested_products = db["requestedproducts"].find({
        "partnerId": delivery["partnerId"],
        "productId": {"$in": delivery["assetId"]},
        "status": {"$in": ["Assigned", "Delivered"]}
    })
    
    # Count the number of products (not using quantity field)
    return requested_products.count()

def get_partner_name(db, partner_id):
    partner = db["partners"].find_one({"_id": partner_id})
    return partner.get("partnerName", "Partner") if partner else "Partner"

def get_donor_name(db, delivery):
    """
    Get donor name from the products in the delivery.
    Since assetId contains product ObjectIds, we need to find the donor through the products.
    """
    if not delivery or 'assetId' not in delivery:
        return "Donor"
    
    # Get the first product to find the donor
    if delivery['assetId']:
        product = db["products"].find_one({"_id": delivery['assetId'][0]})
        if product and 'donorId' in product:
            donor = db["donors"].find_one({"_id": product['donorId']})
            return donor.get("companyName", "Donor") if donor else "Donor"
    
    return "Donor"

def get_admin_contact(db):
    """
    Get admin contact information for alerts.
    """
    # You might want to store admin contact in a separate collection or config
    # For now, returning a default admin contact
    return {
        "name": "Admin",
        "email": "admin@dkt.com"  # This should be configurable
    }

def send_alert_to_admin_and_donor(db, delivery, committed_quantity, received_quantity, partner_name, donor_name):
    """
    Send alert to admin and donor about quantity mismatch.
    """
    tracking_id = delivery.get("shippingDetails", {}).get("order_id", str(delivery["_id"]))
    
    alert_message = (
        f"🚨 **COMMITMENT vs DELIVERY MISMATCH ALERT** 🚨\n\n"
        f"**Delivery Details:**\n"
        f"• Tracking ID: {tracking_id}\n"
        f"• Partner: {partner_name}\n"
        f"• Donor: {donor_name}\n"
        f"• Committed Quantity: {committed_quantity}\n"
        f"• Received Quantity: {received_quantity}\n"
        f"• Mismatch: {abs(committed_quantity - received_quantity)} units\n\n"
        f"**Action Required:**\n"
        f"Please investigate this discrepancy and take appropriate action."
    )
    
    print(f"[ALERT] {alert_message}")
    
    # TODO: Integrate with your notification system (email, SMS, etc.)
    # For now, just logging the alert
    return alert_message

def update_delivery_with_mismatch(db, delivery_id, committed_quantity, received_quantity):
    """
    Update delivery record with mismatch information.
    """
    try:
        from datetime import datetime
        db["assetsdeleveries"].update_one(
            {"_id": delivery_id},
            {
                "$set": {
                    "deliveryVerification": {
                        "verified": False,
                        "committedQuantity": committed_quantity,
                        "receivedQuantity": received_quantity,
                        "mismatch": abs(committed_quantity - received_quantity),
                        "verifiedAt": datetime.now(),
                        "status": "Mismatch Detected"
                    }
                }
            }
        )
        print(f"[INFO] Updated delivery {delivery_id} with mismatch information")
    except Exception as e:
        print(f"[ERROR] Failed to update delivery {delivery_id}: {e}")

def update_delivery_as_verified(db, delivery_id):
    """
    Update delivery record as verified.
    """
    try:
        from datetime import datetime
        db["assetsdeleveries"].update_one(
            {"_id": delivery_id},
            {
                "$set": {
                    "deliveryVerification": {
                        "verified": True,
                        "verifiedAt": datetime.now(),
                        "status": "Verified"
                    }
                }
            }
        )
        print(f"[INFO] Updated delivery {delivery_id} as verified")
    except Exception as e:
        print(f"[ERROR] Failed to update delivery {delivery_id}: {e}")

def main():
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    processed_ids = load_processed_ids()
    print("[Watcher] Starting delivery watcher with commitment vs delivery check...")
    
    while True:
        try:
            # Find all delivered asset deliveries not yet processed
            deliveries = db["assetsdeleveries"].find({
                "status": "Delivered",
                "deliveryVerification": {"$exists": False}  # Only process unverified deliveries
            })
            
            for delivery in deliveries:
                delivery_id = str(delivery["_id"])
                if delivery_id in processed_ids:
                    continue
                
                print(f"[INFO] Processing delivery {delivery_id}")
                
                # Get partner and donor names
                partner_name = get_partner_name(db, delivery["partnerId"])
                donor_name = get_donor_name(db, delivery)
                
                # Handle the commitment vs delivery check
                tracking_id = delivery.get("shippingDetails", {}).get("order_id", str(delivery["_id"]))
                committed_quantity = get_committed_quantity_from_asset_delivery(delivery)
                
                if committed_quantity > 0:
                    result = handle_commitment_vs_delivery_check(partner_name, tracking_id, committed_quantity)
                    
                    # Handle the result
                    if result and result.get("status") == "mismatch":
                        # Send alert to admin and donor
                        send_alert_to_admin_and_donor(
                            db, delivery, committed_quantity, result["received_quantity"], partner_name, donor_name
                        )
                        # Update delivery status or create a mismatch record
                        update_delivery_with_mismatch(db, delivery["_id"], committed_quantity, result["received_quantity"])
                    elif result and result.get("status") == "verified":
                        # Update delivery status to verified
                        update_delivery_as_verified(db, delivery["_id"])
                else:
                    print(f"[WARNING] No committed quantity found for delivery {tracking_id}")
                
                # Mark as processed
                save_processed_id(delivery_id)
                processed_ids.add(delivery_id)
                
        except Exception as e:
            print(f"[ERROR] Error in delivery watcher: {e}")
        
        time.sleep(30)  # Poll every 30 seconds

if __name__ == "__main__":
    main() 
    
    