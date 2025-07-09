import productModel from "../../donor/models/productModel.js";
import productUploadsModel from "../../donor/models/productUploadsModel.js";


export const approveOrRejetUploads = async (req, res) => {
    try {
        const { id, status } = req.body
        // Find the product uploads for the donor and populate the products
        const assetsUpload = await productUploadsModel.findOne({ _id: id })
         console.log(assetsUpload)
        if(!assetsUpload){
            res.status(404).json({success:false, message: "upload not found" });
        }

        assetsUpload.adminApproval = status
        // Update product statuses to "assigned"
        await productModel.updateMany(
            { _id: { $in: assetsUpload.products.map((product) => product._id) } },
            { $set: { adminApproval: status } }
        );
        await assetsUpload.save();
        res.status(200).json({ success:true,message: "status updated successfully!!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}; 