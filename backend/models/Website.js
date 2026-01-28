import mongoose from 'mongoose';

const websiteSchema = new mongoose.Schema(
  {
    creatorEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    subdomain: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      unique: true,
    },
    isConfigured: {
      type: Boolean,
      default: false,
    },
    branding: {
      siteName: {
        type: String,
        default: "",
      },
      tagline: {
        type: String,
        default: "",
      },
      logo: {
        type: String,
        default: "",
      },
      primaryColor: {
        type: String,
        default: "#9333ea",
      },
      secondaryColor: {
        type: String,
        default: "#ec4899",
      },
    },
    theme: {
      mode: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
    },
    content: {
      selectedCourses: [
        {
          type: String,
        },
      ],
      selectedServices: [
        {
          type: String,
        },
      ],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Website = mongoose.model('Website', websiteSchema);
export default Website;
