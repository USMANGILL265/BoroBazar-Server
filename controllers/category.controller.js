
import categoryModel from "../models/category.model.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

// Upload buffer directly to Cloudinary
const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "categories",
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

// Upload category images
export async function imagesUplaod(request, response) {
  try {
    const images = request.files || [];

    if (images.length === 0) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Please upload at least one image",
      });
    }

    const imagesArr = [];

    for (const image of images) {
      const result = await uploadBuffer(image.buffer, {
        use_filename: true,
        unique_filename: true,
      });

      imagesArr.push({
        url: result.secure_url,
        public_id: result.public_id,
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      images: imagesArr,
    });
  } catch (error) {
    console.log("Cloudinary Upload Error:", error);

    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || "Image upload failed",
    });
  }
}

// Create category
export async function createCategory(request, response) {
  try {
    const { name, images } = request.body;

    if (!name || !name.trim()) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Category name is required",
      });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Please upload at least one image",
      });
    }

    const category = await categoryModel.create({
      name: name.trim(),
      images,
    });

    return response.status(201).json({
      message: "Category created successfully",
      error: false,
      success: true,
      category,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

// Get all categories
export async function getCategory(request, response) {
  try {
    const categories = await categoryModel.find().sort({
      createdAt: -1,
    });

    return response.status(200).json({
      error: false,
      success: true,
      categories,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

// Delete single image from Cloudinary
export async function deleteImage(request, response) {
  try {
    const { public_id } = request.body;

    if (!public_id) {
      return response.status(400).json({
        success: false,
        error: true,
        message: "Image public_id is required",
      });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result !== "ok" && result.result !== "not found") {
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

// Delete category
export async function deleteCategory(request, response) {
  try {
    const { id } = request.params;

    const category = await categoryModel.findById(id);

    if (!category) {
      return response.status(404).json({
        message: "Category not found",
        success: false,
        error: true,
      });
    }

    for (const image of category.images) {
      if (image.public_id) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }

    await categoryModel.findByIdAndDelete(id);

    return response.status(200).json({
      message: "Category deleted successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    console.log("Delete category Error:", error);

    return response.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}

// Update category
export async function updateCategory(request, response) {
  try {
    const { id } = request.params;
    const { name, images } = request.body;

    const category = await categoryModel.findById(id);

    if (!category) {
      return response.status(404).json({
        message: "Category not found",
        success: false,
        error: true,
      });
    }

    if (name !== undefined) {
      category.name = name.trim();
    }

    if (images !== undefined) {
      if (!Array.isArray(images) || images.length === 0) {
        return response.status(400).json({
          message: "Please upload at least one image",
          success: false,
          error: true,
        });
      }

      category.images = images;
    }

    await category.save();

    return response.status(200).json({
      message: "Category updated successfully",
      success: true,
      error: false,
      category,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}
// Get single category by ID
export async function getSingleCategory(request, response) {
  try {
    const { id } = request.params;

    const category = await categoryModel.findById(id);

    if (!category) {
      return response.status(404).json({
        message: "Category not found",
        success: false,
        error: true,
      });
    }

    return response.status(200).json({
      message: "Category fetched successfully",
      success: true,
      error: false,
      category,
    });
  } catch (error) {
    console.log("Get Single Category Error:", error);

    return response.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}