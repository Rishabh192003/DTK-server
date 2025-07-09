# Commitment vs Delivery Comparison - CSR Chatbot

## Overview

This module implements the use case: **"Bot helps compare commitment vs upload + pickup, alerts donor/admin for mismatches"** for the CSR (Corporate Social Responsibility) chatbot system.

## Problem Statement

In the current CSR system flow:
1. Donor uploads CSV with products
2. Donor selects assets to donate
3. Admin approves the request
4. Pickup happens at donor's end
5. Delivery is made to partner
6. Partner marks delivery as "Delivered"

The system needs to verify that the quantity received by the partner matches the quantity committed for delivery.

## Key Correction Made

### ❌ Old Method (Incorrect)
- Used `quantity` field from `requestedProductModel`
- This didn't accurately reflect actual products assigned

### ✅ New Method (Correct)
- Count length of `assetId` array in `assetsDelevery` collection
- This represents actual products committed for delivery
- More accurate for commitment vs delivery comparison

## Implementation Details

### 1. Core Functions

#### `handle_commitment_vs_delivery_check(partner_name, tracking_id, committed_quantity)`
- Main chatbot function for commitment vs delivery comparison
- Asks partner for received quantity
- Compares with committed quantity
- Alerts admin/donor if mismatch detected
- Returns result with status and quantities

#### `get_committed_quantity_from_asset_delivery(delivery)`
- Calculates committed quantity from asset delivery
- Uses length of `assetId` array (corrected method)
- Returns actual number of products committed

### 2. Delivery Watcher Integration

The `delivery_watcher.py` has been updated to:
- Monitor deliveries with status "Delivered"
- Calculate committed quantity using corrected method
- Trigger commitment vs delivery check
- Update delivery records with verification status
- Send alerts for mismatches

### 3. Database Schema Updates

The `assetsDelevery` collection now includes a `deliveryVerification` field:

```javascript
{
  "deliveryVerification": {
    "verified": true/false,
    "committedQuantity": number,
    "receivedQuantity": number,
    "mismatch": number,
    "verifiedAt": Date,
    "status": "Verified" | "Mismatch Detected"
  }
}
```

## Workflow

1. **Delivery Detection**: Watcher monitors for deliveries with status "Delivered"
2. **Quantity Calculation**: Calculates committed quantity from `assetId` array length
3. **Partner Query**: Chatbot asks partner for received quantity
4. **Comparison**: Compares committed vs received quantities
5. **Alert System**: 
   - If match: Mark as verified
   - If mismatch: Alert admin and donor
6. **Record Update**: Update delivery record with verification details

## Files Modified/Created

### Modified Files
- `delivery_watcher.py` - Updated with corrected quantity calculation and new functionality
- `chatbot_logic.py` - Added `handle_commitment_vs_delivery_check` function

### New Files
- `test_commitment_vs_delivery.py` - Test script for the functionality
- `README_commitment_vs_delivery.md` - This documentation

## Usage

### Running the Delivery Watcher
```bash
cd DKT-Server/REC_AGENT
python delivery_watcher.py
```

### Testing the Functionality
```bash
cd DKT-Server/REC_AGENT
python test_commitment_vs_delivery.py
```

## Configuration

### MongoDB Connection
Update the connection settings in `delivery_watcher.py`:
```python
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "dkt"  # Change to your DB name
```

### Alert Configuration
Configure admin and donor notification systems in the alert functions.

## Integration Points

### Chatbot Platform Integration
Replace placeholder functions in `chatbot_logic.py`:
- `send_chatbot_message()` - Your chatbot's message sending function
- `get_user_response()` - Your chatbot's user input function

### Notification System Integration
Implement real notification systems for:
- Admin alerts
- Donor alerts
- Email/SMS notifications

## Error Handling

The system includes comprehensive error handling for:
- Invalid user input
- Database connection issues
- Missing delivery data
- Network failures

## Monitoring

The system logs all activities:
- `[INFO]` - Successful operations
- `[WARNING]` - Potential issues
- `[ERROR]` - Errors that need attention
- `[ALERT]` - Mismatch alerts
- `[CHATBOT]` - Chatbot interactions

## Future Enhancements

1. **Real-time Notifications**: Integrate with email/SMS systems
2. **Dashboard Integration**: Create admin dashboard for monitoring
3. **Analytics**: Track mismatch patterns and trends
4. **Automated Resolution**: Suggest actions for common mismatches
5. **Multi-language Support**: Support multiple languages for partners

## Testing

The test script demonstrates:
- Successful delivery verification
- Mismatch detection and alerting
- Integration with delivery watcher
- Corrected quantity calculation

## Troubleshooting

### Common Issues

1. **No committed quantity found**
   - Check if `assetId` array exists in delivery record
   - Verify delivery status is "Delivered"

2. **Database connection errors**
   - Verify MongoDB is running
   - Check connection string and database name

3. **Chatbot integration issues**
   - Replace placeholder functions with real implementations
   - Test user input handling

### Debug Mode
Enable debug logging by setting environment variable:
```bash
export DEBUG=true
python delivery_watcher.py
```

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify database connectivity
3. Test with the provided test script
4. Review the workflow documentation

---

**Note**: This implementation corrects the previous logic that incorrectly used the `quantity` field and now properly calculates committed quantities based on the actual products assigned in the `assetId` array. 