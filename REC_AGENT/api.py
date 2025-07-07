from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from duplicate_checker import DuplicateChecker 
from chatbot_logic import donor_to_partner_handoff_check

app = FastAPI()
checker = DuplicateChecker()  # You can pass custom DB URI if needed

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
        from chatbot_logic import handle_duplicate_check
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)