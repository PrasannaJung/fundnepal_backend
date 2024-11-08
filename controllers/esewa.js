const crypto = require("crypto");
const Project = require("../models/project");
const User = require("../models/user");
const { v4 } = require("uuid");
const Investor = require("../models/investor");

exports.mobilePayment = async (req, res, next) => {
  try {
    const { refId, amount, productId, productName } = req.body;

    const investorsExists = await Investor.findOne({
      investorId: req.user.id,
      projectId: productId,
    }).populate("investorId");
    console.log("___", investorsExists);
    if (investorsExists) {
      return res.status(400).json({
        success: false,
        message: "You have already invested in  this project",
      });
    }

    const project = await Project.findById(productId);
    project.investedAmount = project.investedAmount + parseInt(amount);
    await project.save();

    console.log(req.body);

    const newInvestor = new Investor({
      projectId: productId,
      investedAmount: parseInt(amount),
      investorId: req.user.id,
    });
    await newInvestor.save();
    return res
      .status(200)
      .json({ success: true, message: "You have invested successfully" });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.createInvestmentOrder = async (req, res, next) => {
  const { investmentAmount } = req.body;
  const projectId = req.params.pid + "-" + v4() + "-" + req.userId;
  console.log(
    "The project id and invest amount  is ",
    projectId,
    investmentAmount,
  );
  const signature = this.createSignature(
    `total_amount=${investmentAmount},transaction_uuid=${projectId},product_code=EPAYTEST`,
  );
  const formData = {
    amount: investmentAmount,
    failure_url: "http://localhost:5173",
    product_delivery_charge: "0",
    product_service_charge: "0",
    product_code: "EPAYTEST",
    signature: signature,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    success_url: "http://localhost:3000/api/esewa/verify-payment",
    tax_amount: "0",
    total_amount: investmentAmount,
    transaction_uuid: projectId,
  };

  res.json({
    message: "Order Created Sucessfully",
    formData,
    payment_method: "esewa",
  });
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { data } = req.query;
    const decodedData = JSON.parse(
      Buffer.from(data, "base64").toString("utf-8"),
    );
    console.log(decodedData);

    if (decodedData.status !== "COMPLETE") {
      return res.status(400).json({ message: "errror" });
    }
    const message = decodedData.signed_field_names
      .split(",")
      .map((field) => `${field}=${decodedData[field] || ""}`)
      .join(",");
    console.log(message);

    const projectId = decodedData.transaction_uuid.split("-")[0];
    const decodedArray = decodedData.transaction_uuid.split("-");
    const userId = decodedArray[decodedArray.length - 1];
    console.log("The project id is " + projectId);

    if (decodedData.status !== "COMPLETE") {
      console.log("The status is not complete");
      return res.redirect(`http://localhost:5173/projects/${projectId}`);
    }
    const project = await Project.findById(projectId);
    const investedAmount = parseFloat(
      decodedData.total_amount.replace(/,/g, ""),
    );
    console.log("The investment amount is " + investedAmount);

    if (!project) {
      return res
        .status(400)
        .json({ message: "Please provide a valid project id" });
    }

    project.investedAmount = project.investedAmount + investedAmount;

    await project.save();

    const newInvestor = new Investor({
      projectId,
      investorId: userId,
      investedAmount,
    });

    await newInvestor.save();

    res.redirect("http://localhost:5173/projects/all");
  } catch (err) {
    console.log(err.message);
    return res.status(400).json({ error: err?.message || "No Orders found" });
  }
};

exports.createSignature = (message) => {
  const secret = "8gBm/:&EnhH.1/q";
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(message);

  // Get the digest in base64 format
  const hashInBase64 = hmac.digest("base64");
  return hashInBase64;
};
