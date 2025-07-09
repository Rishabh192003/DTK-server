from pymongo import MongoClient
import pandas as pd
df = pd.read_csv("C:/Users/rj054/OneDrive/Desktop/rec-chatbot/DKT-Server/REC_AGENT/sample.csv")
print(df)
client = MongoClient("mongodb://localhost:27017")
db = client["reconciliation"]
collection = db["product_uploads"]

asset_id = collection.insert_one({
    "csv_data": df.to_dict(orient="records")
}).inserted_id

print("Test Asset ID:", asset_id)
