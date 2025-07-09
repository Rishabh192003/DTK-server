import assetDelevery from "../models/assetDelevery.js";


export const getAllAssetDeliveries = async (req, res) => {
    try {
        // Retrieve all asset deliveries and populate referenced fields
        const deliveries = await assetDelevery
            .find()
            .populate({
                path: "beneficeryRequestId", // Populate beneficeryRequestId
                populate: { path: "beneficiaryId" }, // Further populate beneficiaryId within beneficeryRequestId
            })
            .populate("assetId") // Populate assetId
            .populate("partnerId").sort({ updatedAt: -1 }); // Populate partnerIdS

        // Check if no deliveries were found
        if (!deliveries || deliveries.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No asset delivery requests found.",
            });
        }

        // Send a successful response with the data
        res.status(200).json({
            success: true,
            data: deliveries,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error.",
            error: error.message, // Include the error message for debugging purposes
        });
    }
};


export const getAssetDeleveryRequestBy_PartnerId = async (req, res) => {
    try {
        const { requestId } = req.body;

        const delevery = await assetDelevery
            .find({ _id: requestId })
            .populate([
                {
                    path: "beneficeryRequestId", // Populate beneficeryRequestId
                    populate: [ 
                        { path: "beneficiaryId" }, // Further populate beneficiaryId within beneficeryRequestId
                        {
                            path: "assignedDetails",
                            populate: {
                                path: "assetIds", // Populate assetIds within assignedDetails
                            },
                        },
                    ],
                },
                { path: "assetId" }, // Populate assetId
                { path: "partnerId" }, // Populate partnerId
            ])
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            data: delevery,
            message: "Requests found successfully!",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};
