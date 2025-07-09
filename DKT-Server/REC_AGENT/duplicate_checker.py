import pandas as pd
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

class DuplicateChecker:
    def __init__(self, db_uri=None, db_name=None):
        if db_uri is None:
            db_uri = os.getenv("MONGO_URI")
        if db_name is None:
            db_name = os.getenv("DB_NAME", "reconciliation")
        self.client = MongoClient(db_uri)
        self.db = self.client[db_name]
        self.csv_collection = self.db["product_uploads"]

    def check_and_handle_duplicates(self, asset_id, auto_remove=False):
        record = self.csv_collection.find_one({"_id": ObjectId(asset_id)})

        if not record or "csv_data" not in record:
            return {
                "message": "CSV data not found for the given asset ID.",
                "duplicates": [],
                "status": "not_found"
            }

        df = pd.DataFrame(record["csv_data"])
        dup_rows = []

        if "model" in df.columns:
            dup_mask = df.duplicated(subset=["model"], keep=False)
            if dup_mask.any():
                dup_rows = df[dup_mask].index.tolist()
                if auto_remove:
                    df_cleaned = df.drop_duplicates(subset=["model"], keep="first")
                    self.csv_collection.update_one(
                        {"_id": ObjectId(asset_id)},
                        {"$set": {"csv_data": df_cleaned.to_dict(orient="records")}}
                    )
                    return {
                        "message": "Duplicates auto-removed by model number.",
                        "duplicates": dup_rows,
                        "status": "cleaned"
                    }
                else:
                    return {
                        "message": "Duplicate model numbers found.",
                        "duplicates": dup_rows,
                        "status": "flagged"
                    }
        else:
            dup_mask = df.duplicated(keep=False)
            if dup_mask.any():
                dup_rows = df[dup_mask].index.tolist()
                if auto_remove:
                    df_cleaned = df.drop_duplicates(keep="first")
                    self.csv_collection.update_one(
                        {"_id": ObjectId(asset_id)},
                        {"$set": {"csv_data": df_cleaned.to_dict(orient="records")}}
                    )
                    return {
                        "message": "Duplicates auto-removed by full row check.",
                        "duplicates": dup_rows,
                        "status": "cleaned"
                    }
                else:
                    return {
                        "message": "Duplicate rows found by fallback comparison.",
                        "duplicates": dup_rows,
                        "status": "flagged"
                    }

        return {
            "message": "No duplicates found.",
            "duplicates": [],
            "status": "clean"
        }
