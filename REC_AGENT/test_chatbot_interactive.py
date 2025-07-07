import pandas as pd
from pymongo import MongoClient
from bson.objectid import ObjectId
import requests
import json

# Test configuration
DONER_ID = "6866da6882eaeda30f3e6c29"  # Replace with actual doner ID
CSV_PATH = "REC_AGENT/sample.csv"  # Path to your test CSV file

def create_test_csv():
    """Create a test CSV with duplicates for testing"""
    test_data = [
        {"name": "Laptop A", "description": "High performance", "category": "Electronics", "condition": "Good", "quantity": 1, "model": "M1234"},
        {"name": "Laptop B", "description": "Basic use", "category": "Electronics", "condition": "Fair", "quantity": 1, "model": "M1234"},  # Duplicate model
        {"name": "Tablet C", "description": "Portable", "category": "Electronics", "condition": "Good", "quantity": 1, "model": "M5678"},
        {"name": "Tablet D", "description": "Backup", "category": "Electronics", "condition": "Fair", "quantity": 1, "model": ""},  # Empty model
        {"name": "Tablet E", "description": "Backup", "category": "Electronics", "condition": "Fair", "quantity": 1, "model": ""},  # Empty model
    ]
    
    df = pd.DataFrame(test_data)
    df.to_csv(CSV_PATH, index=False)
    print(f"✅ Test CSV created at: {CSV_PATH}")
    return test_data

def upload_csv_to_mongodb(csv_data):
    """Simulate CSV upload by inserting data into MongoDB"""
    client = MongoClient("mongodb://localhost:27017")
    db = client["reconciliation"]
    
    # Insert products (simulating the upload process)
    product_ids = []
    for record in csv_data:
        result = db["products"].insert_one(record)
        product_ids.append(result.inserted_id)
    
    # Insert product upload record with csv_data
    upload_doc = {
        "donerId": ObjectId(DONER_ID),
        "products": product_ids,
        "adminApproval": "Pending",
        "csv_data": csv_data
    }
    
    result = db["product_uploads"].insert_one(upload_doc)
    asset_id = str(result.inserted_id)
    
    print(f"✅ CSV data uploaded to MongoDB with asset_id: {asset_id}")
    return asset_id

def interactive_duplicate_check(asset_id):
    """Interactive duplicate check with user input"""
    print(f"\n🧪 Interactive Duplicate Check for asset_id: {asset_id}")
    
    # Step 1: Check for duplicates
    print("\n1️⃣ Checking for duplicates...")
    try:
        response = requests.post(
            "http://localhost:8000/api/reconciliation/check-duplicates",
            json={"asset_id": asset_id, "auto_remove": False},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Duplicate check result: {json.dumps(result, indent=2)}")
            
            # Step 2: If duplicates found, ask user what to do
            if result.get("status") == "flagged":
                print("\n🚨 **Duplicate Detection Alert** 🚨")
                print(f"We found duplicate entries in your uploaded CSV:")
                print(f"• Duplicate rows: {result['duplicates']}")
                print(f"• Message: {result['message']}")
                print("\n**What would you like to do?**")
                print("1. Remove duplicates automatically")
                print("2. Upload a corrected CSV file")
                
                # Get user input
                user_choice = input("\nEnter your choice (1/auto/yes for auto-remove, anything else for re-upload): ").strip().lower()
                
                if user_choice in ["1", "auto", "remove", "yes", "automatically"]:
                    print("\n2️⃣ Removing duplicates automatically...")
                    response2 = requests.post(
                        "http://localhost:8000/api/reconciliation/check-duplicates",
                        json={"asset_id": asset_id, "auto_remove": True},
                        timeout=10
                    )
                    
                    if response2.status_code == 200:
                        result2 = response2.json()
                        print(f"✅ Auto-remove result: {json.dumps(result2, indent=2)}")
                        print("🎉 Duplicates have been automatically removed. Your CSV is now clean!")
                    else:
                        print(f"❌ Auto-remove failed: {response2.status_code} - {response2.text}")
                else:
                    print("📁 Please upload a corrected CSV file without duplicates.")
                    
            elif result.get("status") == "clean":
                print("✅ No duplicates found! Your CSV has been successfully uploaded.")
                
            elif result.get("status") == "cleaned":
                print("✅ Duplicates were automatically removed. Your CSV is now clean!")
                
            else:
                print(f"❌ Error: {result.get('message', 'Unknown error occurred')}")
                
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Make sure your FastAPI server is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def main():
    """Main test function"""
    print("🚀 Starting Interactive Chatbot Test Script")
    print("=" * 60)
    
    # Step 1: Create test CSV
    csv_data = create_test_csv()
    
    # Step 2: Upload to MongoDB (simulate frontend upload)
    asset_id = upload_csv_to_mongodb(csv_data)
    
    # Step 3: Interactive duplicate check
    interactive_duplicate_check(asset_id)
    
    print("\n" + "=" * 60)
    print("✅ Interactive test completed!")
    print(f"📝 Asset ID for further testing: {asset_id}")

if __name__ == "__main__":
    main() 