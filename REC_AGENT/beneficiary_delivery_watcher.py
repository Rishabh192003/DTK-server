import time
import pymongo
from dotenv import load_dotenv
import os
from chatbot_logic import handle_beneficiary_delivery_check, send_chatbot_message

# Load environment variables from .env file
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "dkt")

PROCESSED_IDS_FILE = "REC_AGENT/processed_beneficiary_deliveries.txt"

def load_processed_ids():
    if not os.path.exists(PROCESSED_IDS_FILE):
        os.makedirs(os.path.dirname(PROCESSED_IDS_FILE), exist_ok=True)
        with open(PROCESSED_IDS_FILE, "w") as f:
            pass
    try:
        with open(PROCESSED_IDS_FILE, "r") as f:
            return set(line.strip() for line in f)
    except FileNotFoundError:
        return set()

def save_processed_id(request_id):
    os.makedirs(os.path.dirname(PROCESSED_IDS_FILE), exist_ok=True)
    with open(PROCESSED_IDS_FILE, "a") as f:
        f.write(f"{request_id}\n")

def get_committed_quantity(request):
    asset_ids = request.get("assignedDetails", {}).get("assetIds", [])
    return len(asset_ids)

def get_beneficiary_name(request):
    return request.get("fullName", "Beneficiary")

def get_partner_id(request):
    return request.get("partnerId", "Unknown Partner")

def get_admin_contact(db):
    return {"name": "Admin", "email": "admin@dkt.com"}

def send_alert_to_partner_and_admin(request, committed, received, db):
    partner_id = get_partner_id(request)
    admin = get_admin_contact(db)
    send_chatbot_message(
        f"⚠️ It looks like there is a mismatch between what was committed and what you received.\n"
        f"We'll notify the partner ({partner_id}) and admin ({admin['email']}) to resolve this.",
        system=False
    )
    send_chatbot_message(
        f"[ALERT] Mismatch for BeneficiaryRequest {request['_id']}: Committed {committed}, Received {received}\nNotify Partner: {partner_id}, Admin: {admin['email']}",
        system=True
    )

def main():
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    processed_ids = load_processed_ids()
    send_chatbot_message("[Watcher] Starting beneficiary delivery watcher...", system=True)

    while True:
        try:
            requests = db["beneficiaryrequests"].find({
                "status": "Approved",
                "assignedDetails.status": "Assigned"
            })
            for request in requests:
                req_id = str(request["_id"])
                if req_id in processed_ids:
                    continue
                committed = get_committed_quantity(request)
                beneficiary_name = get_beneficiary_name(request)
                assigned_status = request.get("assignedDetails", {}).get("status")
                received = handle_beneficiary_delivery_check(beneficiary_name, req_id, committed, assigned_status=assigned_status)
                if received is None:
                    continue
                if received != committed:
                    send_alert_to_partner_and_admin(request, committed, received, db)
                else:
                    send_chatbot_message("Thank you for confirming! We're glad you received the correct number of assets.")
                save_processed_id(req_id)
                processed_ids.add(req_id)
        except Exception as e:
            send_chatbot_message(f"[ERROR] Error in beneficiary delivery watcher: {e}", system=True)
        time.sleep(30)

if __name__ == "__main__":
    main()