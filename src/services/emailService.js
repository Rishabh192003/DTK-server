import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const user = process.env.EMAIL_FROM;
const pass = process.env.EMAIL_PASS;

// Configure the transporter using your email and credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: user,
    pass: pass,
  },
});

// Function to send OTP and Greeting

export const sendEmail = async (email, type, data) => {
  // Determine the email content based on the type
  let subject;
  let html;

  if (type === "otp") {
    subject = "Your OTP for Logging In";
    html = `
      <div>
        <h3>OTP Verification</h3>
        <p>Your one-time password (OTP) for logging in is: <strong>${data.otp}</strong>. This OTP is valid for the next 5 minutes. Please use it to complete your login process.</p>
        <p>If you did not request this, please ignore this message or contact our support team.</p>
        </br>
        <p>Best regards,<br />The DKT Platform Team</p>
        </div>
    `;
  } else if (type === "assetUploads") {
    subject = "Asset Upload Confirmation";
    html = `
    <div>
    <p>
      Your asset upload has been successful. The reference ID for this asset is: 
      <strong>${data.assetId}</strong>. 
      Please keep this ID for your records and future reference.
    </p>
    <p>
      If you did not upload, please disregard this message or reach out to our support team for assistance.
    </p>
    <br />
    <p>
      Best regards,<br />
      The DKT Platform Team
    </p>
  </div>
    `;
  } else if (type === "requestDelivery") {
    subject = "Delivery Request Confirmation";
    html = `
    <div>
  <p>
    Your delivery request has been successfully initiated. Below are the details for your reference:
  </p>
  <ul>
    <li><strong>Request ID:</strong> ${data.requestId}</li>
    <li><strong>Pickup Address:</strong> ${data.address}</li>
    <li><strong>Scheduled Pickup Date:</strong> ${data.shippingDate}</li>
  </ul>
  <p>
    Please ensure that the items are ready for pickup at the specified address and date. If you have any questions or need to make changes to the schedule, please contact our support team.
  </p>
  <br />
  <p>
    Best regards,<br />
    The DKT Platform Team
  </p>
</div>

    `;
  } else if (type === "acceptDelevery") {
    subject = "Delivery Request Accepted";
    html = `
    <div>
    <p>
      We are pleased to inform you that your delivery request has been accepted. Below are the details for your reference:
    </p>
    <ul>
      <li><strong>Request ID:</strong> ${data.requestId}</li>
      <li><strong>Pickup Address:</strong> ${data.address}</li>
      <li><strong>Scheduled Pickup Date:</strong> ${data.pickupDate}</li>
    </ul>
    <p>
      Please ensure the items are ready for pickup at the specified address and date. Our team will arrive as scheduled to complete the process. If you need to make any adjustments, kindly contact our support team at your earliest convenience.
    </p>
    <br />
    <p>
      Thank you for using our service. We look forward to assisting you!
    </p>
    <br />
    <p>
      Best regards,<br />
      The DKT Platform Team
    </p>
  </div>
    `;
  } else if (type === "assetRequest") {
    subject = "Asset Request Confirmation";
    html = `
    <div>
    
    <p>
      Your asset request has been successfully submitted. Below are the details for your reference:
    </p>
    <ul>
      <li><strong>Request ID:</strong> ${data.requestId}</li>
    </ul>
    <p>
      Please use the Request ID to track the status of your request. If you need further assistance or have any queries, feel free to reach out to our support team.
    </p>
    <br />
    <p>
      Thank you for using our service. We are committed to processing your request promptly!
    </p>
    <br />
    <p>
      Best regards,<br />
      The DKT Platform Team
    </p>
  </div>
    `;
  } else if (type === "assetRequestAcceptOrReject") {
    subject = "Asset Request Confirmation Status";
    html = `
    <div>
    
    <p>
      Your asset request has been ${data.status}. Below are the details for your reference:
    </p>
    <ul>
      <li><strong>Request ID:</strong> ${data.requestId}</li>
    </ul>
    <p>
      Please use the Request ID to track the status of your request. If you need further assistance or have any queries, feel free to reach out to our support team.
    </p>
    <br />
    <p>
      Thank you for using our service. We are committed to processing your request promptly!
    </p>
    <br />
    <p>
      Best regards,<br />
      The DKT Platform Team
    </p>
  </div>
    `;
  }
  else if (type === "Asset Allocation") {
    subject = "Asset Allotment";
    html = `
    <div>
    
    <p>
      Assets has been successfully alloted to your request. Below are the details for your reference:
    </p>
    <ul>
      <li><strong>Request ID:</strong> ${data.requestId}</li>
    </ul>
    <p>
      Please use the Request ID to track the status of your request. If you need further assistance or have any queries, feel free to reach out to our support team.
    </p>
    <br />
    <p>
      Thank you for using our service. We are committed to processing your request promptly!
    </p>
    <br />
    <p>
      Best regards,<br />
      The DKT Platform Team
    </p>
  </div>
    `;
  }
  else if (type === "Allot Asset Delevery") {
    subject = "Delevery Patner Assign For Assets Delevery";
    html = `
    <div>
    
    <p>
      Successfully assign delevery partner. Below are the details for your reference:
    </p>
    <ul>
      <li><strong>Request ID:</strong> ${data.requestId}</li>
      <li><strong>Delevery Partner:</strong> ${data.deleveryPartner}</li>
    </ul>
    <p>
      Please use the Request ID to track the status of your request. If you need further assistance or have any queries, feel free to reach out to our support team.
    </p>
    <br />
    <p>
      Thank you for using our service. We are committed to processing your request promptly!
    </p>
    <br />
    <p>
      Best regards,<br />
      The DKT Platform Team
    </p>
  </div>
    `;
  }
  else if (type === "assetRequestResponce") {
    subject = "Asset Request Update";
    html = `
    <div>

    <p>
      We have reviewed your asset request, and here is the update for your reference:
    </p>
    <ul>
      <li><strong>Request ID:</strong> ${data.requestId}</li>
      <li><strong>Status:</strong> ${data.status}</li>
    </ul>
    <p>
      ${data.status === "Approved"
        ? "Congratulations! Your request has been approved. We will process it shortly and notify you of the next steps."
        : "Unfortunately, your request has been rejected. If you have any questions or would like to discuss further, please contact our support team."
      }
    </p>
    <br />
    <p>
      Thank you for using our service. We appreciate your understanding and support!
    </p>
    <br />
    <p>
      Best regards,<br />
      The DKT Platform Team
    </p>
  </div>
  
    `;
  } else if (type === "report") {
    subject = "Report Generation Confirmation";
    html = `
    <div>
    <p>
      Your report has been successfully generated. Below are the details for your reference:
    </p>
    <ul>
      <li><strong>Report ID:</strong> ${data.reportId}</li>
    </ul>
    <p>
      You can use the Report ID to track or access this report at any time. If you need further assistance or encounter any issues, please reach out to our support team.
    </p>
    <br />
    <p>
      Thank you for using our service. We hope this report meets your needs!
    </p>
    <br />
    <p>
      Best regards,<br />
      The DKT Platform Team
    </p>
  </div>
  
  
    `;
  } else if (type === "resetPassword") {
    subject = "Reset Your Password - OTP Verification";
    html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #45AFAB;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your account on <strong>DKT Platform</strong>.</p>
        <p>Your OTP for resetting your password is:</p>
        <h3 style="background: #f3f3f3; padding: 10px; display: inline-block; border-radius: 5px; color: #45AFAB;">
          ${data.otp}
        </h3>
        <p>This OTP is valid for <strong>5 minutes</strong>.</p>
        <p>If you did not request a password reset, you can safely ignore this email. If you suspect any unauthorized activity, please contact our support team immediately.</p>
        <p style="margin-top: 20px;">Best regards,<br />The DKT Platform Team</p>
      </div>
    `;
  } else if (type === "greeting") {
    subject = "Welcome to DKT Platform!";
    html = `
      <div>
        <h3>Welcome, ${data.name || data.companyName || data.partnerName}!</h3>
        <p>Thank you for registering on our platform. We are excited to have you onboard.</p>
        <p>Your registration is currently under review by our admin team. Once your profile is approved, you will receive a confirmation email and will be able to log in to your account.</p>
        <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
        <p>Best regards,<br />The DKT Platform Team</p>
      </div>
    `;
  } else if (type === "subjectApproved") {
    subject = "Profile Approval Confirmation";
    html = `
      <div>
        <p>
          Dear ${data.name || data.companyName || data.partnerName}, 
        </p>
        <p>
          Congratulations! Your profile has been successfully approved. You can now log in to your account and access the platform.
        </p>
        <p>
          Thank you for choosing our platform. We are excited to have you onboard!
        </p>
        <br />
        <p>
          Best regards,<br />
          The Platform Team
        </p>
      </div>`;
  } else if (type === "subjectRejected") {
    subject = "Profile Rejection Notification";
    html = `
      <div>
        <p>
          Dear ${data.name || data.companyName || data.partnerName}, 
        </p>
        <p>
          We regret to inform you that your profile has been reviewed and could not be approved at this time.
        </p>
        <p>
          If you believe this is an error or have any questions, please contact our support team for assistance.
        </p>
        <br />
        <p>
          Best regards,<br />
          The Platform Team
        </p>
      </div>
    `;
  } else if (type === "register") {
    subject = "Your OTP Code";
    html = `
      <div>
        <h3>OTP Verification</h3>
        <p>Your one-time password (OTP) for Verification is: <strong>${data.otp}</strong>. This OTP is valid for the next 5 minutes. Please use it to complete your registration process.</p>
        <p>If you did not request this, please ignore this message or contact our support team.</p>
        </br>
        <p>Best regards,<br />The DKT Platform Team</p>
        </div>
    `;
  } else {
    throw new Error("Invalid email type specified");
  }

  const mailOptions = {
    from: user, // Sender address
    to: email, // Recipient's email
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    // console.log(`Email sent to ${email} (type: ${type})`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send email");
  }
};
