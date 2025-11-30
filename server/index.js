const express = require("express");
const routes = require("./routes");
const adminRoutes = require("./routes-admin");
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use("/", express.static("uploads"));

// Public routes
app.use("/", routes);

// Admin routes
app.use("/", adminRoutes);

// Stripe checkout for PRO
app.post("/create-checkout-session", async(req,res)=>{
    const session = await stripe.checkout.sessions.create({
        mode:"payment",
        line_items:[{
            price_data:{
                currency:"usd",
                product_data:{ name:"Pro Upgrade" },
                unit_amount:100
            },
            quantity:1
        }],
        success_url: "https://your-frontend-url/success",
        cancel_url: "https://your-frontend-url/cancel"
    });
    res.json({ url: session.url });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
