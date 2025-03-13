const express = require("express")
const crypto = require("crypto")

const app = express()
app.use(express.json());

const receiptDB = {}


/*
*Generates a hash from a JSON reciept
*This ensures unique ID for each receipt
*@param {JSON Object} receipt - Receipt passed in
*@returns {String} Generated hashed ID (hexidecimal string) (This could also be truncated to improve speed)
*/
function generateReceiptID(receipt){
    const receiptString = JSON.stringify(receipt)
    return crypto.createHash("sha256").update(receiptString).digest("hex")
}



/*
*Calculates points based on rules for receipt
*@param {JSON Object} receipt - Receipt passed in
*@returns {Integer} Points awarded to specific receipt based on rules
*/
function calculatePoints(receipt){
    let points = 0

    //1 point for each alphanumeric character in retailer name
    points += (receipt.retailer.match(/[a-zA-Z0-9]/g) || []).length;

    //50 points if the total is a round dollar amount with no cents
    const total = parseFloat(receipt.total);
    if (total % 1 === 0) points += 50;

    //25 points if the total is a multiple of .25
    if (total % .25 === 0) points += 25;

    //5 points for every 2 items on the receipt
    points += Math.floor(receipt.items.length / 2) * 5;
        
    //if the trimmed length of the item description is a multiple of 3, multiply the price by .2 and round up to the nearest integer
    receipt.items.forEach((item)=> {
        if (item.shortDescription.trim().length % 3 === 0) {
            points += Math.ceil(parseFloat(item.price) * 0.2);}})

    //6 points if the day in the purchase date is odd
    const day = parseInt(receipt.purchaseDate.split("-")[2]);
    if (day % 2 !== 0) points += 6;
    
    //10 points f the time of the purchase is after 2pm and before 4pm (14-16)
    const [hour, minute] = receipt.purchaseTime.split(":").map(Number);
if ((hour === 14 && minute > 0) || (hour === 15)) {
    points += 10;
}


    return points
}


/*
*Post takes in a receipt, calculates a unique ID, and awards points. 
*Adds ID and points to in-memory database
*Reponds with unique ID
*/
app.post("/receipts/process", (req, res) => {
    const receipt = req.body
    
    //checks to make sure that receipt is valid and matches format
    if (!receipt.retailer || !receipt.purchaseDate || !receipt.purchaseTime || !receipt.items || !receipt.total) {
        return res.status(400).json({ error: "At least one of the required categories doesn't exist" });
    }
    if (!Array.isArray(receipt.items) || receipt.items.length < 1) {
        return res.status(400).json({ error: "Invalid items array. Make sure that there are items in receipt." });
    }
    for (let item of receipt.items) {
        if (!item.shortDescription || !item.price || !/^\d+\.\d{2}$/.test(item.price)) {
            return res.status(400).json({ error: "Make sure that item details are in correct format" });
        }
    }
    if (!/^\d+\.\d{2}$/.test(receipt.total)) {
        return res.status(400).json({ error: "Make sure that total is in the correct format." });
    }

    const id = generateReceiptID(receipt)
    const points = calculatePoints(receipt)
    if (!receiptDB[id]){
        receiptDB[id] = points
    }
    res.json({"id": id})
})


/*
*Searches in-memory database for unique ID that is provided in get request
*Responds with points awarded to that ID
*/
app.get("/receipts/:id/points", (req, res) => {
    const id = req.params.id;
    if (!receiptDB[id]){
        return res.status(404).json({ error: "No receipt found for this ID." });
    }

    res.json({"points": receiptDB[id]})
})


const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`))