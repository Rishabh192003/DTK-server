import requests
import os
from REC_AGENT.gemini_helper import ask_gemini
from REC_AGENT.partner_to_beneficiary_reschedule import (
    chatbot_check_delivery_status,
    reschedule_beneficiary_request
)

def handle_duplicate_check(asset_id, doner_id):
    """
    Chatbot function to handle duplicate detection after product upload
    """
    # 1. Check for duplicates using the asset_id from fullstack upload
    resp = requests.post(
        "http://localhost:8000/api/reconciliation/check-duplicates",
        json={"asset_id": asset_id, "auto_remove": False}
    )
    result = resp.json()

    # 2. Handle different scenarios
    if result["status"] == "flagged":
        # Show alert to user via chatbot
        alert_message = (
            f"🚨 **Duplicate Detection Alert** 🚨\n\n"
            f"We found duplicate product IDs in your uploaded products:\n"
            f"• Duplicate indices: {result['duplicates']}\n"
            f"• Message: {result['message']}\n\n"
            f"**What would you like to do?**\n"
            f"1. Remove duplicates automatically\n"
            f"2. Upload a corrected product list"
        )
        
        # Send alert to user (this would be your chatbot's send_message function)
        send_chatbot_message(alert_message)
        
        # Wait for user response (this would be your chatbot's get_user_response function)
        user_choice = get_user_response()
        
        if user_choice.lower() in ["1", "auto", "remove", "yes", "automatically"]:
            # Auto-remove duplicates
            resp = requests.post(
                "http://localhost:8000/api/reconciliation/check-duplicates",
                json={"asset_id": asset_id, "auto_remove": True}
            )
            success_message = "✅ Duplicates have been automatically removed. Your product list is now clean!"
            send_chatbot_message(success_message)
        else:
            # Ask user to re-upload
            reupload_message = "📁 Please upload a corrected product list without duplicates."
            send_chatbot_message(reupload_message)
            
    elif result["status"] == "clean":
        success_message = "✅ No duplicates found! Your product list has been successfully uploaded."
        send_chatbot_message(success_message)
        
    elif result["status"] == "cleaned":
        success_message = "✅ Duplicates were automatically removed. Your product list is now clean!"
        send_chatbot_message(success_message)
        
    else:
        error_message = f"❌ Error: {result.get('message', 'Unknown error occurred')}"
        send_chatbot_message(error_message)

def handle_commitment_vs_delivery_check(partner_name, tracking_id, committed_quantity):
    """
    Chatbot function to handle commitment vs delivery comparison check.
    This is the main function for the new use case: "Bot helps compare commitment vs upload + pickup, alerts donor/admin for mismatches"
    
    Args:
        partner_name: Name of the partner to message
        tracking_id: Tracking or delivery ID
        committed_quantity: Quantity committed for delivery (length of assetId array)
    """
    # 1. Ask partner for received quantity
    send_chatbot_message(
        f"Hello {partner_name}, your delivery with tracking ID {tracking_id} has been marked as Delivered.\n"
        f"We need to verify the delivery. How many units did you actually receive? (Committed: {committed_quantity})"
    )
    
    try:
        received_quantity = int(get_user_response())
    except ValueError:
        send_chatbot_message("❌ Invalid input. Please enter a valid number.")
        return handle_commitment_vs_delivery_check(partner_name, tracking_id, committed_quantity)

    # 2. Compare and alert if mismatch
    if received_quantity != committed_quantity:
        mismatch_alert = (
            f"🚨 **COMMITMENT vs DELIVERY MISMATCH ALERT** 🚨\n\n"
            f"**Delivery Details:**\n"
            f"• Tracking ID: {tracking_id}\n"
            f"• Partner: {partner_name}\n"
            f"• Committed Quantity: {committed_quantity}\n"
            f"• Received Quantity: {received_quantity}\n"
            f"• Mismatch: {abs(committed_quantity - received_quantity)} units\n\n"
            f"**Action Required:**\n"
            f"An alert has been sent to the Admin and Donor for investigation."
        )
        send_chatbot_message(mismatch_alert)
        
        # Log the alert for admin/donor notification
        print(f"[ALERT] Admin/Donor: Mismatch for delivery {tracking_id}")
        print(f"Committed: {committed_quantity}, Received: {received_quantity}")
        print(f"Partner: {partner_name}")
        
        return {
            "status": "mismatch",
            "committed_quantity": committed_quantity,
            "received_quantity": received_quantity,
            "mismatch": abs(committed_quantity - received_quantity)
        }
    else:
        success_message = (
            f"✅ **Delivery Verification Successful** ✅\n\n"
            f"Thank you {partner_name}! The received quantity ({received_quantity}) "
            f"matches the committed quantity ({committed_quantity}).\n\n"
            f"Delivery {tracking_id} has been verified successfully."
        )
        send_chatbot_message(success_message)
        
        print(f"[INFO] Admin/Donor: Delivery {tracking_id} successfully verified")
        print(f"Quantity: {committed_quantity}, Partner: {partner_name}")
        
        return {
            "status": "verified",
            "committed_quantity": committed_quantity,
            "received_quantity": received_quantity,
            "mismatch": 0
        }

def handle_handoff_check(partner_name, tracking_id, committed_quantity):
    """
    Chatbot function to handle handoff check after delivery is marked as Delivered.
    partner_name: Name of the partner to message
    tracking_id: Tracking or delivery ID
    committed_quantity: Quantity committed for delivery
    """
    # 1. Ask partner for received quantity
    send_chatbot_message(
        f"Hello {partner_name}, your delivery with tracking ID {tracking_id} has been marked as Delivered.\n"
        f"How many units did you actually receive? (Committed: {committed_quantity})"
    )
    try:
        received_quantity = int(get_user_response())
    except Exception:
        send_chatbot_message("Invalid input. Please enter a number.")
        return handle_handoff_check(partner_name, tracking_id, committed_quantity)

    # 2. Compare and alert if mismatch
    if received_quantity != committed_quantity:
        send_chatbot_message(
            f"🚨 ALERT: Mismatch detected! Committed: {committed_quantity}, Received: {received_quantity}.\n"
            f"Notifying Admin and Donor."
        )
        print(f"[ALERT] Admin/Donor: Mismatch for delivery {tracking_id} (Committed: {committed_quantity}, Received: {received_quantity})")
    else:
        send_chatbot_message(
            f"✅ Thank you! The received quantity matches the committed quantity."
        )
        print(f"[INFO] Admin/Donor: Delivery {tracking_id} successfully verified (Quantity: {committed_quantity})")
    return received_quantity

def handoff_quantity_check(from_role, to_role, from_name, to_name, tracking_id, committed_quantity):
    """
    Generic chatbot function to handle handoff quantity check between any two roles.
    from_role: e.g., 'Donor'
    to_role: e.g., 'Partner'
    from_name: Name of the sender (Donor/Admin/etc.)
    to_name: Name of the receiver (Partner/Beneficiary/etc.)
    tracking_id: Tracking or delivery ID
    committed_quantity: Quantity committed for delivery
    """
    send_chatbot_message(
        f"Hello {to_name}, your delivery from {from_role} '{from_name}' with tracking ID {tracking_id} has been marked as Delivered.\n"
        f"How many units did you actually receive? (Committed: {committed_quantity})"
    )
    try:
        received_quantity = int(get_user_response())
    except Exception:
        send_chatbot_message("Invalid input. Please enter a number.")
        return handoff_quantity_check(from_role, to_role, from_name, to_name, tracking_id, committed_quantity)

    if received_quantity != committed_quantity:
        send_chatbot_message(
            f"🚨 ALERT: Mismatch detected! Committed: {committed_quantity}, Received: {received_quantity}.\n"
            f"Notifying {from_role} and Admin."
        )
        print(f"[ALERT] {from_role}/Admin: Mismatch for delivery {tracking_id} (Committed: {committed_quantity}, Received: {received_quantity})")
    else:
        send_chatbot_message(
            f"✅ Thank you! The received quantity matches the committed quantity."
        )
        print(f"[INFO] {from_role}/Admin: Delivery {tracking_id} successfully verified (Quantity: {committed_quantity})")
    return received_quantity

def donor_to_partner_handoff_check(donor_name, partner_name, tracking_id, committed_quantity):
    """
    Wrapper for donor to partner handoff quantity check.
    """
    return handoff_quantity_check(
        from_role="Donor",
        to_role="Partner",
        from_name=donor_name,
        to_name=partner_name,
        tracking_id=tracking_id,
        committed_quantity=committed_quantity
    )

def handle_beneficiary_delivery_check(beneficiary_name, request_id, committed_quantity, assigned_status=None):
    """
    Chatbot function to handle beneficiary delivery check.
    Only to be used when assignedDetails.status == 'Assigned'.
    Optionally, pass assigned_status to enforce at logic level.
    """
    if assigned_status is not None and assigned_status != "Assigned":
        send_chatbot_message("This delivery check can only be performed when status is 'Assigned'.", system=True)
        return None
    send_chatbot_message(
        f"Hi {beneficiary_name}! We've marked your request {request_id} as assigned.\n"
        f"How many assets did you actually receive? (We expected to deliver {committed_quantity}.)"
    )
    try:
        received_quantity = int(get_user_response())
    except Exception:
        send_chatbot_message("Invalid input. Please enter a number.")
        return handle_beneficiary_delivery_check(beneficiary_name, request_id, committed_quantity, assigned_status)

    return received_quantity

# def handle_partner_to_beneficiary_reschedule():
#     """
#     Chatbot function for interactive partner-to-beneficiary delivery rescheduling.
#     1. Asks for shipment ID
#     2. Checks delivery status
#     3. If failed, notifies and asks admin if they want to reschedule
#     4. If yes, reschedules the request
#     """
#     send_chatbot_message("Please provide the Shiprocket shipment ID to check delivery status:")
#     shipment_id = get_user_response()
#     status_message = chatbot_check_delivery_status(shipment_id)
#     send_chatbot_message(status_message)
#     if "failed" in status_message.lower():
#         send_chatbot_message("Would you like to reschedule this delivery request to the same partner? (yes/no)")
#         admin_response = get_user_response()
#         if admin_response.strip().lower() in ["yes", "y"]:
#             # In a real system, you would look up the beneficiary_request_id and partner_id from the DB
#             send_chatbot_message("Please provide the Beneficiary Request ID:")
#             beneficiary_request_id = get_user_response()
#             send_chatbot_message("Please provide the Partner ID:")
#             partner_id = get_user_response()
#             new_request_id = reschedule_beneficiary_request(beneficiary_request_id, partner_id)
#             if new_request_id:
#                 send_chatbot_message(f"✅ Rescheduled! New Beneficiary Request ID: {new_request_id}")
#             else:
#                 send_chatbot_message("❌ Failed to reschedule. Please check the provided IDs.")
#         else:
#             send_chatbot_message("Reschedule cancelled.")

def handle_partner_to_beneficiary_reschedule():
    """
    Chatbot function for interactive partner-to-beneficiary delivery rescheduling.
    1. Asks for shipment ID
    2. Checks delivery status
    3. If failed, fetches beneficiary and partner IDs automatically
    4. Asks admin if they want to reschedule
    5. If yes, reschedules the request
    """
    send_chatbot_message("Please provide the Shiprocket shipment ID to check delivery status:")
    shipment_id = get_user_response()
    status_message = chatbot_check_delivery_status(shipment_id)
    send_chatbot_message(status_message)
    if "failed" in status_message.lower():
        # --- AUTOMATICALLY FETCH IDs ---
        from REC_AGENT.partner_to_beneficiary_reschedule import db  # Import db connection
        delivery = db.assetsdeleveries.find_one({"shippingDetails.shipment_id": int(shipment_id)})
        if not delivery:
            send_chatbot_message("❌ Could not find a delivery with that shipment ID.")
            return
        beneficiary_request_id = delivery.get("beneficeryRequestId")
        partner_id = delivery.get("partnerId")
        send_chatbot_message(
            f"Found Beneficiary Request ID: {beneficiary_request_id}\n"
            f"Found Partner ID: {partner_id}\n"
            "Would you like to reschedule this delivery request to the same partner? (yes/no)"
        )
        admin_response = get_user_response()
        if admin_response.strip().lower() in ["yes", "y"]:
            new_request_id = reschedule_beneficiary_request(beneficiary_request_id, partner_id)
            if new_request_id:
                send_chatbot_message(f"✅ Rescheduled! New Beneficiary Request ID: {new_request_id}")
            else:
                send_chatbot_message("❌ Failed to reschedule. Please check the provided IDs.")
        else:
            send_chatbot_message("Reschedule cancelled.")

# Placeholder functions for chatbot integration
def send_chatbot_message(message, system=False):
    if system:
        print(f"[SYSTEM] {message}")
    else:
        print(f"\n🤖 [CHATBOT]: {message}\n")

def get_user_response():
    """Get user response from your chatbot platform"""
    response = input("Your response: ")
    return response
    # Replace with your actual chatbot response function 
    
    