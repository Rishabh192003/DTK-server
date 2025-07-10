from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from REC_AGENT.duplicate_checker import DuplicateChecker 
from REC_AGENT.chatbot_logic import donor_to_partner_handoff_check, handle_beneficiary_delivery_check, send_chatbot_message
from bson import ObjectId
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from fastapi import APIRouter
from REC_AGENT.partner_to_beneficiary_reschedule import (
    chatbot_check_delivery_status,
    reschedule_beneficiary_request,
    db
)

app = FastAPI()
checker = DuplicateChecker()  # You can pass custom DB URI if needed

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "dkt")

class AssetRequest(BaseModel):
    asset_id: str
    auto_remove: bool = False

class ChatbotRequest(BaseModel):
    asset_id: str
    doner_id: str
    
class HandoffCheckRequest(BaseModel):
    donor_name: str
    partner_name: str
    tracking_id: str
    committed_quantity: int

class BeneficiaryDeliveryCheckRequest(BaseModel):
    request_id: str

class RescheduleRequest(BaseModel):
    shipment_id: int
    
@app.post("/api/reconciliation/check-duplicates")
def check_duplicates(req: AssetRequest):
    try:
        result = checker.check_and_handle_duplicates(req.asset_id, req.auto_remove)
        if result["status"] == "not_found":
            raise HTTPException(status_code=404, detail=result["message"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@app.post("/api/chatbot/check-duplicates")
def chatbot_check_duplicates(req: ChatbotRequest):
    try:
        # Import here to avoid circular imports
        from REC_AGENT.chatbot_logic import handle_duplicate_check
        
        # Call the chatbot logic
        handle_duplicate_check(req.asset_id, req.doner_id)
        
        return {"message": "Duplicate check initiated", "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agent/donor-to-partner-handoff-check")
def donor_to_partner_handoff_api(req: HandoffCheckRequest):
    try:
        # Run the handoff check logic (this will prompt for input in console for now)
        result = donor_to_partner_handoff_check(
            req.donor_name,
            req.partner_name,
            req.tracking_id,
            req.committed_quantity
        )
        return {"status": "success", "received_quantity": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agent/beneficiary-delivery-check")
def beneficiary_delivery_check_api(req: BeneficiaryDeliveryCheckRequest):
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        request_doc = db["beneficiaryrequests"].find_one({"_id": ObjectId(req.request_id)})
        if not request_doc:
            raise HTTPException(status_code=404, detail="BeneficiaryRequest not found")
        if request_doc.get("status") != "Approved" or request_doc.get("assignedDetails", {}).get("status") != "Assigned":
            raise HTTPException(status_code=400, detail="Request not in correct state for delivery check (must be Approved and assignedDetails.status == 'Assigned')")
        committed = len(request_doc.get("assignedDetails", {}).get("assetIds", []))
        beneficiary_name = request_doc.get("fullName", "Beneficiary")
        received = handle_beneficiary_delivery_check(beneficiary_name, req.request_id, committed)
        if received != committed:
            send_chatbot_message(
                f"🚨 ALERT: Mismatch detected for BeneficiaryRequest {req.request_id}!\n"
                f"Committed: {committed}, Received: {received}.\n"
                f"Notifying Partner and Admin."
            )
            return {"status": "mismatch", "committed": committed, "received": received}
        else:
            send_chatbot_message(
                f"✅ Thank you! The received quantity matches the committed quantity."
            )
            return {"status": "verified", "committed": committed, "received": received}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/agent/partner-to-beneficiary-reschedule")
def partner_to_beneficiary_reschedule(req: RescheduleRequest):
    # 1. Find the delivery by shipment_id
    delivery = db.assetsdeleveries.find_one({"shippingDetails.shipment_id": req.shipment_id})
    if not delivery:
        raise HTTPException(status_code=404, detail="Could not find delivery with the given shipment_id.")

    # 2. Check delivery status
    status_message = chatbot_check_delivery_status(req.shipment_id)
    if "failed" in status_message.lower():
        beneficiary_request_id = delivery.get("beneficeryRequestId")
        partner_id = delivery.get("partnerId")
        new_request_id = reschedule_beneficiary_request(beneficiary_request_id, partner_id)
        if new_request_id:
            return {
                "status": "rescheduled",
                "message": "Delivery failed and request has been rescheduled.",
                "new_request_id": str(new_request_id)
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to reschedule. Please check the IDs.")
    else:
        return {
            "status": "ok",
            "message": "Delivery is not failed. No rescheduling needed.",
            "current_status": status_message
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
    