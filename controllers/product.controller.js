
import mongoose from "mongoose";
import productModel from "../models/product.model.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

// Upload buffer to Cloudinary
const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "products",
        resource_type: "image",
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

// Get Cloudinary public ID
const getPublicId = (image) => {
  if (!image) return null;

  if (typeof image === "object" && image.public_id) {
    return image.public_id;
  }

  if (typeof image === "string") {
    try {
      const url = new URL(image);
      const pathname = url.pathname;
      const uploadIndex = pathname.indexOf("/upload/");

      if (uploadIndex === -1) return null;

      let publicId = pathname.substring(uploadIndex + 8);

      publicId = publicId.replace(/^v\d+\//, "");
      publicId = publicId.replace(/\.[^/.]+$/, "");

      return publicId;
    } catch {
      return null;
    }
  }

  return null;
};

// Delete Cloudinary images
const deleteCloudinaryImages = async (images = []) => {
  for (const image of images) {
    const publicId = getPublicId(image);

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.log("Cloudinary Delete Error:", error.message);
      }
    }
  }
};

// Pagination helper
const getPagination = (request) => {
  const page = Math.max(parseInt(request.query.page) || 1, 1);

  const limit = Math.min(
    Math.max(parseInt(request.query.limit) || 10, 1),
    100
  );

  return { page, limit };
};

// Validate numeric values
const isValidNumber = (value, min = 0, max = Infinity) => {
  if (value === undefined || value === null || value === "") {
    return false;
  }

  const number = Number(value);

  return (
    Number.isFinite(number) &&
    number >= min &&
    number <= max
  );
};

// Escape regex special characters
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Upload product images
export async function imagesUplaod(request, response) {
  const uploadedImages = [];

  try {
    const images = request.files || [];

    if (images.length === 0) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Please upload at least one image",
      });
    }

    for (const image of images) {
      const result = await uploadBuffer(image.buffer, {
        use_filename: true,
        unique_filename: true,
      });

      uploadedImages.push({
        url: result.secure_url,
        public_id: result.public_id,
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      images: uploadedImages,
    });
  } catch (error) {
    await deleteCloudinaryImages(uploadedImages);

    console.log("Cloudinary Upload Error:", error);

    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || "Image upload failed",
    });
  }
}

// Create product
export async function createProduct(request, response) {
  try {
    const {
      name,
      description,
      brand,
      price,
      oldPrice,
      catName,
      catId,
      category,
      stock,
      rating,
      isFeatured,
      discount,
    } = request.body;

    const images = request.body.imagesArr || request.body.images;

    if (
      !name ||
      !description ||
      !String(name).trim() ||
      !String(description).trim()
    ) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Product name and description are required",
      });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Please upload at least one image",
      });
    }

    if (
      !images.every(
        (image) => image?.url && image?.public_id
      )
    ) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Invalid product images",
      });
    }

    if (!isValidNumber(price)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Invalid product price",
      });
    }

    if (!isValidNumber(oldPrice)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Invalid old price",
      });
    }

    if (!isValidNumber(stock)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Invalid product stock",
      });
    }

    if (!isValidNumber(rating, 0, 5)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Rating must be between 0 and 5",
      });
    }

    if (!isValidNumber(discount, 0, 100)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Discount must be between 0 and 100",
      });
    }

    if (
      category &&
      !mongoose.Types.ObjectId.isValid(category)
    ) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Invalid category ID",
      });
    }

    const product = await productModel.create({
      name: String(name).trim(),
      description: String(description).trim(),
      images,
      brand,
      price,
      oldPrice,
      catName,
      catId,
      category: category || undefined,
      stock,
      rating,
      isFeatured,
      discount,
    });

    return response.status(201).json({
      success: true,
      error: false,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.log("Create Product Error:", error);

    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || "Product creation failed",
    });
  }
}

// Get all products
export async function getAllProduct(request, response) {
  try {
    const { page, limit } = getPagination(request);

    const total = await productModel.countDocuments();

    const products = await productModel
      .find()
      .populate("category")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return response.status(200).json({
      success: true,
      error: false,
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

// Get products by category name
export async function getAllProductByCatName(request, response) {
  try {
    const { page, limit } = getPagination(request);

    const filter = {
      catName: request.query.catName,
    };

    const total = await productModel.countDocuments(filter);

    const products = await productModel
      .find(filter)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return response.status(200).json({
      success: true,
      error: false,
      products,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

// Get products by price
export async function getAllProductByPrice(request, response) {
  try {
    const { catId, minPrice, maxPrice } = request.query;

    const filter = {};

    if (catId) {
      filter.catId = catId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined) {
        if (!isValidNumber(minPrice)) {
          return response.status(400).json({
            success: false,
            error: true,
            message: "Invalid minimum price",
          });
        }

        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        if (!isValidNumber(maxPrice)) {
          return response.status(400).json({
            success: false,
            error: true,
            message: "Invalid maximum price",
          });
        }

        filter.price.$lte = Number(maxPrice);
      }

      if (
        filter.price.$gte !== undefined &&
        filter.price.$lte !== undefined &&
        filter.price.$gte > filter.price.$lte
      ) {
        return response.status(400).json({
          success: false,
          error: true,
          message: "Minimum price cannot exceed maximum price",
        });
      }
    }

    const products = await productModel
      .find(filter)
      .populate("category")
      .sort({ price: 1 });

    return response.status(200).json({
      success: true,
      error: false,
      products,
      product: products,
      total: products.length,
      totalPages: 1,
      page: 1,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

// Get products by rating
export async function getAllProductByRating(request, response) {
  try {
    const { page, limit } = getPagination(request);

    const filter = {};

    if (request.query.catId) {
      filter.catId = request.query.catId;
    }

    if (request.query.rating !== undefined) {
      if (!isValidNumber(request.query.rating, 0, 5)) {
        return response.status(400).json({
          success: false,
          error: true,
          message: "Invalid rating",
        });
      }

      filter.rating = Number(request.query.rating);
    }

    const total = await productModel.countDocuments(filter);

    const products = await productModel
      .find(filter)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return response.status(200).json({
      success: true,
      error: false,
      products,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

// Get total products count
export async function getAllProductsCount(request, response) {
  try {
    const productCount = await productModel.countDocuments();

    return response.status(200).json({
      success: true,
      error: false,
      productCount,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

// Get featured products
export async function getAllFeaturedProducts(request, response) {
  try {
    const products = await productModel
      .find({ isFeatured: true })
      .populate("category")
      .sort({ createdAt: -1 });

    return response.status(200).json({
      success: true,
      error: false,
      products,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

// Delete single product
export async function deleteProducts(request, response) {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Invalid product ID",
      });
    }

    const product = await productModel.findById(id);

    if (!product) {
      return response.status(404).json({
        message: "Product not found",
        success: false,
        error: true,
      });
    }

    await productModel.findByIdAndDelete(id);

    await deleteCloudinaryImages(product.images);

    return response.status(200).json({
      message: "Product deleted successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      success: false,
      error: true,
    });
  }
}

// Delete multiple products
export async function deleteMultipleProducts(request, response) {
  try {
    const { ids } = request.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return response.status(400).json({
        message: "Invalid Input",
        success: false,
        error: true,
      });
    }

    if (
      !ids.every((id) => mongoose.Types.ObjectId.isValid(id))
    ) {
      return response.status(400).json({
        message: "Invalid product IDs",
        success: false,
        error: true,
      });
    }

    const products = await productModel.find({
      _id: { $in: ids },
    });

    if (products.length === 0) {
      return response.status(404).json({
        message: "Products not found",
        success: false,
        error: true,
      });
    }

    await productModel.deleteMany({
      _id: { $in: ids },
    });

    for (const product of products) {
      await deleteCloudinaryImages(product.images);
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: "Products deleted successfully",
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

// Get single product
export async function getSingleProducts(request, response) {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Invalid product ID",
      });
    }

    const product = await productModel
      .findById(id)
      .populate("category");

    if (!product) {
      return response.status(404).json({
        success: false,
        error: true,
        message: "Product not found",
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      product,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

// Delete individual image
export async function deleteImage(request, response) {
  try {
    const { public_id, productId } = request.body;

    if (!public_id) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Image public_id is required",
      });
    }

    // If productId is supplied, remove image from database first
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return response.status(400).json({
          success: false,
          error: true,
          message: "Invalid product ID",
        });
      }

      const product = await productModel.findById(productId);

      if (!product) {
        return response.status(404).json({
          success: false,
          error: true,
          message: "Product not found",
        });
      }

      if (product.images.length <= 1) {
        return response.status(400).json({
          success: false,
          error: true,
          message: "At least one product image is required",
        });
      }

      const imageExists = product.images.some(
        (image) => image.public_id === public_id
      );

      if (!imageExists) {
        return response.status(404).json({
          success: false,
          error: true,
          message: "Image not found in this product",
        });
      }

      product.images = product.images.filter(
        (image) => image.public_id !== public_id
      );

      await product.save();
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (
      result.result !== "ok" &&
      result.result !== "not found"
    ) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Image could not be deleted",
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: "Image deleted successfully",
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

// Update product
export async function updateProduct(request, response) {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Invalid product ID",
      });
    }

    const product = await productModel.findById(id);

    if (!product) {
      return response.status(404).json({
        message: "Product not found",
        success: false,
        error: true,
      });
    }

    const {
      name,
      description,
      brand,
      price,
      oldPrice,
      catName,
      catId,
      category,
      stock,
      rating,
      isFeatured,
      discount,
    } = request.body;

    const images = request.body.imagesArr ?? request.body.images;

    // Validate numeric fields only when supplied
    const numericFields = [
      ["price", price, 0, Infinity],
      ["oldPrice", oldPrice, 0, Infinity],
      ["stock", stock, 0, Infinity],
      ["rating", rating, 0, 5],
      ["discount", discount, 0, 100],
    ];

    for (const [field, value, min, max] of numericFields) {
      if (
        value !== undefined &&
        !isValidNumber(value, min, max)
      ) {
        return response.status(400).json({
          success: false,
          error: true,
          message: `Invalid ${field}`,
        });
      }
    }

    if (
      category &&
      !mongoose.Types.ObjectId.isValid(category)
    ) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Invalid category ID",
      });
    }

    if (name !== undefined) {
      if (!String(name).trim()) {
        return response.status(400).json({
          success: false,
          error: true,
          message: "Product name cannot be empty",
        });
      }

      product.name = String(name).trim();
    }

    if (description !== undefined) {
      if (!String(description).trim()) {
        return response.status(400).json({
          success: false,
          error: true,
          message: "Description cannot be empty",
        });
      }

      product.description = String(description).trim();
    }

    if (brand !== undefined) product.brand = brand;
    if (price !== undefined) product.price = price;
    if (oldPrice !== undefined) product.oldPrice = oldPrice;
    if (catName !== undefined) product.catName = catName;
    if (catId !== undefined) product.catId = catId;
    if (category !== undefined) product.category = category;
    if (stock !== undefined) product.stock = stock;
    if (rating !== undefined) product.rating = rating;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;
    if (discount !== undefined) product.discount = discount;

    if (images !== undefined) {
      if (
        !Array.isArray(images) ||
        images.length === 0 ||
        !images.every(
          (image) => image?.url && image?.public_id
        )
      ) {
        return response.status(400).json({
          message: "Please provide valid product images",
          success: false,
          error: true,
        });
      }

      const newPublicIds = images.map(
        (image) => getPublicId(image)
      );

      const removedImages = product.images.filter(
        (image) =>
          !newPublicIds.includes(getPublicId(image))
      );

      product.images = images;

      await product.save();

      await deleteCloudinaryImages(removedImages);

      return response.status(200).json({
        message: "Product updated successfully",
        success: true,
        error: false,
        product,
      });
    }

    await product.save();

    return response.status(200).json({
      message: "Product updated successfully",
      success: true,
      error: false,
      product,
    });
  } catch (error) {
    console.log("Update Product Error:", error);

    return response.status(500).json({
      message: error.message,
      success: false,
      error: true,
    });
  }
}

// Filter products
export async function filters(request, response) {
  try {
    const {
      catId,
      minPrice,
      maxPrice,
      rating,
      page = 1,
      limit = 10,
    } = request.body;

    const currentPage = Math.max(parseInt(page) || 1, 1);

    const perPage = Math.min(
      Math.max(parseInt(limit) || 10, 1),
      100
    );

    const filter = {};

    if (Array.isArray(catId) && catId.length > 0) {
      filter.catId = { $in: catId };
    } else if (catId && !Array.isArray(catId)) {
      filter.catId = catId;
    }

    if (minPrice !== undefined && minPrice !== "") {
      if (!isValidNumber(minPrice)) {
        return response.status(400).json({
          success: false,
          error: true,
          message: "Invalid minimum price",
        });
      }

      filter.price = {
        ...filter.price,
        $gte: Number(minPrice),
      };
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      if (!isValidNumber(maxPrice)) {
        return response.status(400).json({
          success: false,
          error: true,
          message: "Invalid maximum price",
        });
      }

      filter.price = {
        ...filter.price,
        $lte: Number(maxPrice),
      };
    }

    if (
      filter.price?.$gte !== undefined &&
      filter.price?.$lte !== undefined &&
      filter.price.$gte > filter.price.$lte
    ) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Minimum price cannot exceed maximum price",
      });
    }

    if (Array.isArray(rating) && rating.length > 0) {
      if (!rating.every((value) => isValidNumber(value, 0, 5))) {
        return response.status(400).json({
          success: false,
          error: true,
          message: "Invalid rating filter",
        });
      }

      filter.rating = { $in: rating.map(Number) };
    } else if (rating !== undefined && rating !== "") {
      if (!isValidNumber(rating, 0, 5)) {
        return response.status(400).json({
          success: false,
          error: true,
          message: "Invalid rating",
        });
      }

      filter.rating = Number(rating);
    }

    const total = await productModel.countDocuments(filter);

    const products = await productModel
      .find(filter)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    return response.status(200).json({
      success: true,
      error: false,
      products,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      success: false,
      error: true,
    });
  }
}

// Sort products
const sortItems = (products, sortBy, order) => {
  return products.sort((a, b) => {
    if (sortBy === "name") {
      const nameA = a.name || "";
      const nameB = b.name || "";

      return order === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    }

    if (sortBy === "price") {
      return order === "asc"
        ? a.price - b.price
        : b.price - a.price;
    }

    return 0;
  });
};

export async function sortBy(request, response) {
  try {
    const { products, sortBy: sortField, order } = request.body;

    const productList = Array.isArray(products)
      ? products
      : products?.products;

    if (!Array.isArray(productList)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Invalid products data",
      });
    }

    if (!["name", "price"].includes(sortField)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Invalid sorting field",
      });
    }

    if (!["asc", "desc"].includes(order)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Invalid sorting order",
      });
    }

    const sortedItems = sortItems(
      [...productList],
      sortField,
      order
    );

    return response.status(200).json({
      success: true,
      error: false,
      products: sortedItems,
      totalPages: 0,
      page: 0,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

// Search products
export async function searchProductController(request, response) {
  try {
    const { query, page = 1, limit = 10 } = request.body;

    if (
      typeof query !== "string" ||
      !query.trim()
    ) {
      return response.status(400).json({
        message: "Query is required",
        success: false,
        error: true,
      });
    }

    const currentPage = Math.max(parseInt(page) || 1, 1);

    const perPage = Math.min(
      Math.max(parseInt(limit) || 10, 1),
      100
    );

    const searchRegex = {
      $regex: escapeRegex(query.trim()),
      $options: "i",
    };

    const filter = {
      $or: [
        { name: searchRegex },
        { brand: searchRegex },
        { catName: searchRegex },
      ],
    };

    const total = await productModel.countDocuments(filter);

    const products = await productModel
      .find(filter)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    return response.status(200).json({
      success: true,
      error: false,
      products,
      total,
      totalPages: Math.ceil(total / perPage),
      page: currentPage,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      success: false,
      error: true,
    });
  }
}
