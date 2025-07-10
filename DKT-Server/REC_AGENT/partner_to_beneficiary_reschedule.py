import os
import requests
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime

# Load environment variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "dkt")
SHIPROCKET_EMAIL = os.getenv("SHIPROCKET_EMAIL")
SHIPROCKET_PASSWORD = os.getenv("SHIPROCKET_PASSWORD")

# MongoDB setup
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Shiprocket API helpers
def get_shiprocket_token():
    url = "https://apiv2.shiprocket.in/v1/external/auth/login"
    payload = {"email": SHIPROCKET_EMAIL, "password": SHIPROCKET_PASSWORD}
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()["token"]

def get_shipment_status(shipment_id, token):
    url = f"https://apiv2.shiprocket.in/v1/external/courier/track?shipment_id={shipment_id}"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

# def get_shiprocket_token():
#     # Return a fake token for testing
#     return "mock_token"

# def get_shipment_status(shipment_id, token):
#     # Return a fake status for testing
#     # Simulate a failed delivery
#     return {
#         "tracking_data": {
#             "shipment_status": "Failed"
#         }
#     }
    
def is_delivery_failed(shiprocket_status):
    failed_statuses = ["Undelivered", "RTO", "Failed", "Cancelled"]
    # Adjust this based on Shiprocket's actual status field
    current_status = shiprocket_status.get("tracking_data", {}).get("shipment_status", "")
    return current_status in failed_statuses

# def is_delivery_failed(shiprocket_status):
#     return True  # Force failure for testing

def notify_users(beneficiary, partner, admin, message):
    # Replace with actual email/SMS logic as needed
    print(f"Notify Beneficiary ({beneficiary}): {message}")
    print(f"Notify Partner ({partner}): {message}")
    print(f"Notify Admin ({admin}): {message}")

def reschedule_beneficiary_request(old_request_id, partner_id):
    old_request = db.beneficiaryrequests.find_one({"_id": ObjectId(old_request_id)})
    if not old_request:
        print("Original request not found.")
        return None
    new_request = old_request.copy()
    new_request["_id"] = ObjectId()  # New ID
    new_request["status"] = "Pending"
    new_request["assignedDetails"] = {
        "assetIds": [],
        "status": "Pending",
        "date": datetime.utcnow()
    }
    db.beneficiaryrequests.insert_one(new_request)
    print(f"Rescheduled new request with ID: {new_request['_id']}")
    return new_request["_id"]

def check_and_handle_failed_deliveries():
    token = get_shiprocket_token()
    # Find all in-progress deliveries
    deliveries = db.assetsdeleveries.find({"shippingDetails.status": "In-progress"})
    for delivery in deliveries:
        shipment_id = delivery.get("shippingDetails", {}).get("shipment_id")
        if not shipment_id:
            continue
        try:
            status = get_shipment_status(shipment_id, token)
        except Exception as e:
            print(f"Error fetching status for shipment {shipment_id}: {e}")
            continue
        if is_delivery_failed(status):
            # Get related info
            beneficiary_request_id = delivery.get("beneficeryRequestId")
            partner_id = delivery.get("partnerId")
            beneficiary = db.beneficiaryrequests.find_one({"_id": beneficiary_request_id})
            partner = db.partners.find_one({"_id": partner_id})
            admin = {"email": "admin@example.com"}  # Replace with actual admin logic

            # Notify all
            notify_users(
                beneficiary.get("email", "unknown") if beneficiary else "unknown",
                partner.get("email", "unknown") if partner else "unknown",
                admin.get("email", "unknown"),
                f"Delivery failed for shipment {shipment_id}."
            )
            # Optionally, reschedule (could be triggered by admin via chatbot)
            # new_request_id = reschedule_beneficiary_request(beneficiary_request_id, partner_id)

def chatbot_check_delivery_status(shipment_id):
    token = get_shiprocket_token()
    status = get_shipment_status(shipment_id, token)
    if is_delivery_failed(status):
        return "Delivery failed. Please contact admin to reschedule."
    else:
        return f"Current status: {status.get('tracking_data', {}).get('shipment_status', 'Unknown')}"

if __name__ == "__main__":
    print("Checking for failed partner-to-beneficiary deliveries...")
    check_and_handle_failed_deliveries()
    print("Done.") 
    
    