import mongoose, { mongo } from "mongoose";

const orderScema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },

    products: [
      {
        productId: {
          type: String,
        },
        productTitle: {
          type: String,
        },
        quantity: {
          type: Number,
        },
        price: {
          type: Number,
        },

        image: {
          type: String,
        },
        subTotal: {
          type: Number,
        },
      },
    ],
    paymentId: {
      type: String,
      default: "",
    },
    payment_status: {
      type: String,
      default: "",
    },
    order_status: {
      type: String,
      default: "confirm",
    },
    delivery_adress: {
      type: mongoose.Schema.ObjectId,
      ref: "address",
    },
    totalAmt: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const OrderModel = mongoose.model("Order", orderScema);

export default OrderModel;
