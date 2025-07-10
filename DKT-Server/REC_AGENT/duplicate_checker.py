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

        if not record or "products" not in record:
            return {
                "message": "Products array not found for the given asset ID.",
                "duplicates": [],
                "status": "not_found"
            }

        products = record["products"]
        # Find duplicates in the products array
        seen = set()
        duplicates = []
        for idx, prod in enumerate(products):
            if prod in seen:
                duplicates.append(idx)
            else:
                seen.add(prod)

        if duplicates:
            if auto_remove:
                # Remove duplicates, keep first occurrence
                new_products = []
                seen = set()
                for prod in products:
                    if prod not in seen:
                        new_products.append(prod)
                        seen.add(prod)
                self.csv_collection.update_one(
                    {"_id": ObjectId(asset_id)},
                    {"$set": {"products": new_products}}
                )
                return {
                    "message": "Duplicates auto-removed from products array.",
                    "duplicates": duplicates,
                    "status": "cleaned"
                }
            else:
                return {
                    "message": "Duplicate product IDs found in products array.",
                    "duplicates": duplicates,
                    "status": "flagged"
                }
        else:
            return {
                "message": "No duplicates found in products array.",
                "duplicates": [],
                "status": "clean"
            }
