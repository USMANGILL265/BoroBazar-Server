import { v2 as cloudinary } from "cloudinary";
import HomeSliderModel from "../models/homeSlider.model.js";

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) =>
        error ? reject(error) : resolve(result)
      )
      .end(buffer);
  });

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

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
      resource_type: "image",
    };

    for (const image of images) {
      const result = await uploadBuffer(image.buffer, {
        ...options,
        filename_override: image.originalname,
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

export async function deleteImage(request, response) {
  try {
    const { public_id } = request.body;

    if (!public_id) {
      return response.status(400).json({
        success: false,
        message: "Image public_id is required",
      });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result !== "ok" && result.result !== "not found") {
      return response.status(400).json({
        success: false,
        message: "Image could not be deleted",
      });
    }

    return response.status(200).json({
      success: true,
      message: "Image deleted successfully",
      result: result.result,
    });
  } catch (error) {
    console.log("Cloudinary Delete Error:", error);
    return response.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function addHomeSlide(request, response) {
  try {
    const { images } = request.body;

    if (!images || images.length === 0) {
      return response.status(400).json({
        message: "Please upload at least one image",
        success: false,
        error: true,
      });
    }

    let slide = new HomeSliderModel({
      images: images,
    });

    slide = await slide.save();

    return response.status(200).json({
      message: "Slide Created Successfully",
      success: true,
      error: false,
      slide: slide,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}

export async function updateHomeSlide(request, response) {
  try {
    const { id } = request.params;
    const { images } = request.body;

    if (!images || images.length === 0) {
      return response.status(400).json({
        message: "Please upload at least one image",
        success: false,
        error: true,
      });
    }

    const slide = await HomeSliderModel.findByIdAndUpdate(
      id,
      {
        images: images,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!slide) {
      return response.status(404).json({
        message: "Slide not found",
        success: false,
        error: true,
      });
    }

    return response.status(200).json({
      message: "Slide updated successfully",
      success: true,
      error: false,
      slide: slide,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}

export async function deleteHomeSlide(request, response) {
  try {
    const { id } = request.params;

    const slide = await HomeSliderModel.findById(id);

    if (!slide) {
      return response.status(404).json({
        message: "Slide not found",
        success: false,
        error: true,
      });
    }

    // Delete all images from Cloudinary
    if (slide.images && slide.images.length > 0) {
      for (const image of slide.images) {
        if (image.public_id) {
          await cloudinary.uploader.destroy(image.public_id);
        }
      }
    }

    // Delete slide from MongoDB
    await HomeSliderModel.findByIdAndDelete(id);

    return response.status(200).json({
      message: "Home Slide deleted successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    console.log("Delete Home Slide Error:", error);

    return response.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}

export async function getHomeSlides(request, response) {
  try {
    const slides = await HomeSliderModel.find().sort({ createdAt: -1 });

    return response.status(200).json({
      success: true,
      error: false,
      slides: slides,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}