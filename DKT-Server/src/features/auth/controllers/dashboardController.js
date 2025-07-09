export const donorDashboard = (req, res) => {
  return res
    .status(200)
    .json({ success: true, message: "Welcome to the Donor Dashboard" });
};

export const partnerDashboard = (req, res) => {
  return res
    .status(200)
    .json({ success: true, message: "Welcome to the Partner Dashboard" });
};

export const beneficiaryDashboard = (req, res) => {
  return res
    .status(200)
    .json({ success: true, message: "Welcome to the Beneficiary Dashboard" });
};

export const adminDashboard = (req, res) => {
  return res
    .status(200)
    .json({ success: true, message: "Welcome to the Admin Dashboard" });
};
