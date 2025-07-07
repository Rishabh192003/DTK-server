import mongoose from "mongoose";
import Donor from "../models/donorModel.js";
import jwt from "jsonwebtoken";
import { uploadToAzureBlob } from "../../../utils/azureBlob.js";
import productModel from "../models/productModel.js";
import productUploadsModel from "../models/productUploadsModel.js";
import { sendEmail } from "../../../services/emailService.js";


export const addProduct = async (req, res) => {
  const { products, isBulk } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  try {
    // Decode the token and extract the userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userId format" });
    }

    // Look for the donor by userId
    const donor = await Donor.findById(userId);
    if (!donor) {
      return res
        .status(404)
        .json({ success: false, message: "Donor not found" });
    }

    let createdProductIds = [];

    if (isBulk) {
      // Bulk product addition
      if (!Array.isArray(products) || products.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid products array" });
      }

      for (let product of products) {
        const {
          name,
          description,
          category,
          condition,
          quantity,
          images,
          companyDetails,
          manufacturer,
          model,
          specification,
          ageOfProduct,
          originalPurchaseValue,
        } = product;

        // Validate product fields
        if (
          !name ||
          !description ||
          !category ||
          !condition ||
          !quantity ||
          !companyDetails ||
          !manufacturer ||
          !model ||
          !specification
        ) {
          return res
            .status(400)
            .json({ success: false, message: "Missing product fields" });
        }

        // Create the product
        const newProduct = await productModel.create({
          name,
          description,
          category,
          condition,
          quantity,
          images: images || [],
          companyDetails,
          manufacturer,
          model,
          specification,
          ageOfProduct,
          originalPurchaseValue,
        });

        createdProductIds.push(newProduct._id);

        // Add the product to the donor's products array
        donor.products.push(newProduct._id);
      }

      // Save the donor after adding products
      await donor.save();

      // Create an entry in the productUpload collection
      const uploadedProduct = await productUploadsModel.create({
        donerId: donor._id,
        products: createdProductIds,
      });

      await sendEmail(donor.email, "assetUploads", {
        assetId: uploadedProduct._id,
      });

      return res.status(200).json({
        success: true,
        message: "Products added successfully (bulk)",
        products: createdProductIds,
      });
    } else {
      // Single product addition
      const {
        name,
        description,
        category,
        condition,
        quantity,
        companyDetails,
        manufacturer,
        model,
        specification,
        ageOfProduct,
        originalPurchaseValue,
      } = req.body;

      if (
        !name ||
        !description ||
        !category ||
        !condition ||
        !quantity ||
        !companyDetails ||
        !manufacturer ||
        !model ||
        !specification
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Missing product fields" });
      }

      // if (!req.file) {
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "No image file provided" });
      // }

      // Handle image upload for the single product

      let image_url = "";
      if (req.file) {
        image_url = await uploadToAzureBlob(req.file);
      }

      // Create the product
      const newProduct = await productModel.create({
        name,
        description,
        category,
        condition,
        quantity,
        images: [image_url],
        companyDetails,
        manufacturer,
        model,
        specification,
        ageOfProduct,
        originalPurchaseValue,
      });
      // Add the product to the donor's products array
      donor.products.push(newProduct._id);
      await donor.save();

      // Create an entry in the productUpload collection
      await productUploadsModel.create({
        donerId: donor._id,
        products: [newProduct._id],
      });

      await sendEmail(donor.email, "assetUploads", { assetId: newProduct._id });

      return res.status(200).json({
        success: true,
        message: "Product added successfully (single)",
        product: newProduct,
      });
    }
  } catch (error) {
    console.error("Error adding products:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error adding products" });
  }
};

// get all uploads
export const getAllUploads = async (req, res) => {
  try {
    // Find the product uploads for the donor and populate the products
    const productsUploads = await productUploadsModel
      .find()
      .populate("donerId")
      .populate("products")
      .sort({ createdAt: -1 }); // Populate the products field with product details

    if (!productsUploads || productsUploads.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No product uploads found" });
    }

    // Return the product uploads with populated products
    return res.status(200).json({
      success: true,
      message: "Product uploads retrieved successfully",
      productsUploads,
    });
  } catch (error) {
    console.error("Error fetching product uploads:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching product uploads" });
  }
};

// Get all product uploads for the authenticated donor
export const getProductUploads = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  try {
    // Verify the token and decode the user ID (donor's ID)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userId format" });
    }

    // Find the product uploads for the donor and populate the products
    const productsUploads = await productUploadsModel
      .find({ donerId: userId })
      .populate("products").sort({ createdAt: -1 });; // Populate the products field with product details

    if (!productsUploads || productsUploads.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No product uploads found" });
    }

    // Return the product uploads with populated products
    return res.status(200).json({
      success: true,
      message: "Product uploads retrieved successfully",
      productsUploads,
    });
  } catch (error) {
    console.error("Error fetching product uploads:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching product uploads" });
  }
};

// get oroduct uploads By Id
export const getProductUploadsById = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userId format" });
    }

    // Find the product uploads for the donor and populate the products
    const productsUploads = await productUploadsModel
      .find({ donerId: userId })
      .populate("products")
      .populate("donerId")
      .sort({ createdAt: -1 }); // Populate the products field with product details

    if (!productsUploads || productsUploads.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No product uploads found" });
    }

    // Return the product uploads with populated products
    return res.status(200).json({
      success: true,
      message: "Product uploads retrieved successfully",
      productsUploads,
    });
  } catch (error) {
    console.error("Error fetching product uploads:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching product uploads" });
  }
};

export const getDonorsProductUploadsById = async (req, res) => {
  try {
    const { uploadId } = req.body;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(uploadId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userId format" });
    }

    // Find the product uploads for the donor and populate the products
    const productsUploads = await productUploadsModel
      .find({ _id: uploadId })
      .populate("products")
      .populate("donerId")
      .sort({ createdAt: -1 }); // Populate the products field with product details

    if (!productsUploads || productsUploads.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No product uploads found" });
    }

    // Return the product uploads with populated products
    return res.status(200).json({
      success: true,
      message: "Product uploads retrieved successfully",
      productsUploads,
    });
  } catch (error) {
    console.error("Error fetching product uploads:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching product uploads" });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    // Find the product uploads for the donor and populate the products
    const productsUploads = await productModel.find();

    if (!productsUploads || productsUploads.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No product found" });
    }

    // Return the product uploads with populated products
    return res.status(200).json({
      success: true,
      message: "get all products successfully",
      productsUploads,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching product " });
  }
};
