import productModel from "../../donor/models/productModel.js";

export const updateAssetCondition = async (req, res) => {
  try {
    const { productId, condition, isRepair, repairDetails } = req.body;

    console.log(req.body);

    // ✅ Validate required fields
    if (!productId || !condition) {
      return res.status(400).json({
        success: false,
        message: "Product ID and condition are required.",
      });
    }

    let updatedProduct;

    if (isRepair) {
      // ✅ If repair is true, update repair details
      updatedProduct = await productModel.findByIdAndUpdate(
        productId,
        {
          condition,
          repair: {
            isRepair: true,
            service: Array.isArray(repairDetails) ? repairDetails : [], // Ensure it's an array
          },
        },
        { new: true, runValidators: true }
      );
    } else {
      // ✅ If not repairing, just update the condition
      updatedProduct = await productModel.findByIdAndUpdate(
        productId,
        {
          condition,
          "repair.isRepair": false, // Reset repair status
          "repair.service": [], // Remove previous repair details
        },
        { new: true, runValidators: true }
      );
    }

    // ✅ If product not found
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // ✅ Respond with the updated product
    res.status(200).json({
      success: true,
      message: "Condition assigned successfully.",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating asset condition:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the asset condition.",
      error: error.message,
    });
  }
};
