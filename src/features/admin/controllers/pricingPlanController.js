import pricingPlan from "../models/pricingPlan.js";

// GET all pricing plans
export const getPricingPlans = async (req, res) => {
  try {
    const plans = await pricingPlan.find();
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET a single pricing plan by ID
export const getPricingPlanById = async (req, res) => {
  try {
    const plan = await PricingPlan.findById(req.params.id);
    if (!plan)
      return res.status(404).json({ message: "Pricing Plan not found" });
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE a new pricing plan
export const createPricingPlan = async (req, res) => {
  const {
    category,
    platformFee,
    perLaptopFee,
    logistics,
    lumpsum,
    singleTransactionFee,
    service,
  } = req.body;
  const newPlan = new pricingPlan({
    category,
    platformFee,
    perLaptopFee,
    logistics,
    lumpsum,
    singleTransactionFee,
    service,
  });

  try {
    await newPlan.save();
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// UPDATE an existing pricing plan
export const updatePricingPlan = async (req, res) => {
  try {
    const plan = await pricingPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!plan)
      return res.status(404).json({ message: "Pricing Plan not found" });
    res.status(200).json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE a pricing plan
export const deletePricingPlan = async (req, res) => {
  try {
    const plan = await pricingPlan.findByIdAndDelete(req.params.id);
    if (!plan)
      return res.status(404).json({ message: "Pricing Plan not found" });
    res.status(200).json({ message: "Pricing Plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
