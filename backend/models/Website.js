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
    specialistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    subdomain: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      unique: true,
    },
    customDomain: {
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
      headerBgColor: {
        type: String,
        default: "",
      },
      headerTextColor: {
        type: String,
        default: "#ffffff",
      },
      footerBgColor: {
        type: String,
        default: "#111827",
      },
      footerTextColor: {
        type: String,
        default: "#ffffff",
      },
      accentColor: {
        type: String,
        default: "",
      },
      fontFamily: {
        type: String,
        default: "Inter",
      },
      buttonStyle: {
        type: String,
        enum: ["filled", "outlined", "rounded", "pill"],
        default: "filled",
      },
      buttonRadius: {
        type: String,
        default: "8px",
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
