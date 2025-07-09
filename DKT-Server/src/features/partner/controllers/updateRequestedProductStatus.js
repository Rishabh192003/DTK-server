import requestedProductModel from "../models/requestedProductModel.js";

export const updateRequestedProductStatus = async (req, res) => {
  try {
    const { requestId, productId, status } = req.body;

    if (!requestId || !productId || !status) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const requestedProduct = await requestedProductModel.findOneAndUpdate(
      { requestId, productId },
      { status },
      { new: true }
    );

    if (!requestedProduct) {
      return res.status(404).json({ message: "Requested product not found" });
    }

    res.status(200).json({
      message: "Requested product status updated",
      requestedProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
