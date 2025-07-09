from REC_AGENT.duplicate_checker import DuplicateChecker

# Use the asset_id from your sample data
asset_id = "700000000000000000000007"

checker = DuplicateChecker(db_uri="mongodb://localhost:27017", db_name="dkt")
result = checker.check_and_handle_duplicates(asset_id=asset_id)
print(result)