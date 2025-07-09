import sys
from chatbot_logic import donor_to_partner_handoff_check

# Simulate test data for a delivery
mock_delivery = {
    "_id": "mock_delivery_id_123",
    "partnerId": "mock_partner_id_456",
    "assetId": ["mock_product_id_1", "mock_product_id_2"],
    "shippingDetails": {"order_id": "MOCKTRACK123"},
    "beneficeryRequestId": "mock_request_id_789"
}

# Simulate test data for partner and donor
mock_partner_name = "Test Partner"
mock_donor_name = "Test Donor"
mock_tracking_id = mock_delivery["shippingDetails"]["order_id"]
mock_committed_quantity = 5  # Set what you want to test


def test_donor_to_partner_handoff():
    print("\n--- Running Donor to Partner Handoff Check Test ---")
    print(f"Simulating delivery: {mock_delivery}")
    print(f"Donor: {mock_donor_name}, Partner: {mock_partner_name}, Tracking ID: {mock_tracking_id}, Committed Quantity: {mock_committed_quantity}")
    donor_to_partner_handoff_check(mock_donor_name, mock_partner_name, mock_tracking_id, mock_committed_quantity)
    print("--- Test Complete ---\n")

if __name__ == "__main__":
    test_donor_to_partner_handoff() 