import Website from '../models/Website.js';

// Get website configuration
export const getWebsite = async (req, res) => {
  try {
    const { email } = req.params;
    console.log(`Fetching website for email: ${email}`);

    const website = await Website.findOne({ creatorEmail: email });
    
    if (!website) {
      console.log(`No website found for ${email}, creating new one`);
      // Create a default website configuration
      const newWebsite = new Website({
        creatorEmail: email,
        branding: {
          siteName: "My Creator Site",
          tagline: "Welcome to my site",
          logo: "",
          primaryColor: "#9333ea",
          secondaryColor: "#ec4899",
        },
        theme: {
          mode: "light",
        },
        content: {
          selectedCourses: [],
          selectedServices: [],
        },
      });
      
      await newWebsite.save();
      console.log(`Website created for: ${email}`);
      return res.json({ data: newWebsite });
    }

    console.log(`Website found for ${email}`);
    res.json({ data: website });
  } catch (error) {
    console.error("Error fetching website:", error);
    res.status(500).json({ error: error.message });
  }
};

// Save website configuration
export const saveWebsite = async (req, res) => {
  try {
    const { email } = req.params;
    const websiteData = req.body;
    
    console.log(`Saving website for email: ${email}`);
    console.log("Website data:", websiteData);

    let website = await Website.findOne({ creatorEmail: email });

    if (!website) {
      website = new Website({
        creatorEmail: email,
        ...websiteData,
      });
      console.log("Creating new website configuration");
    } else {
      // Update existing website
      Object.assign(website, websiteData);
      console.log("Updating existing website configuration");
    }

    await website.save();
    console.log(`Website saved successfully for: ${email}`);
    res.json({ data: website, message: "Website configuration saved" });
  } catch (error) {
    console.error("Error saving website:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update subdomain
export const updateSubdomain = async (req, res) => {
  try {
    const { email } = req.params;
    const { subdomain } = req.body;

    console.log(`Updating subdomain for email: ${email}, subdomain: ${subdomain}`);

    // Check if subdomain is already taken
    const existingWebsite = await Website.findOne({ subdomain });
    if (existingWebsite && existingWebsite.creatorEmail !== email) {
      console.log(`Subdomain ${subdomain} is already taken`);
      return res.status(400).json({ error: "Subdomain is already taken" });
    }

    let website = await Website.findOne({ creatorEmail: email });

    if (!website) {
      website = new Website({
        creatorEmail: email,
        subdomain,
        isConfigured: true,
      });
      console.log("Creating new website with subdomain");
    } else {
      website.subdomain = subdomain;
      website.isConfigured = true;
      console.log("Updating existing website subdomain");
    }

    await website.save();
    console.log(`Subdomain updated successfully for: ${email}`);
    res.json({ data: website, message: "Subdomain configured successfully" });
  } catch (error) {
    console.error("Error updating subdomain:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update branding
export const updateBranding = async (req, res) => {
  try {
    const { email } = req.params;
    const { branding, theme } = req.body;

    console.log(`Updating branding for email: ${email}`);

    let website = await Website.findOne({ creatorEmail: email });

    if (!website) {
      website = new Website({
        creatorEmail: email,
        branding,
        theme,
      });
      console.log("Creating new website with branding");
    } else {
      if (branding) {
        website.branding = { ...website.branding, ...branding };
      }
      if (theme) {
        website.theme = { ...website.theme, ...theme };
      }
      console.log("Updating existing website branding");
    }

    await website.save();
    console.log(`Branding updated successfully for: ${email}`);
    res.json({ data: website, message: "Branding updated successfully" });
  } catch (error) {
    console.error("Error updating branding:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update content selection
export const updateContent = async (req, res) => {
  try {
    const { email } = req.params;
    const { selectedCourses, selectedServices } = req.body;

    console.log(`Updating content for email: ${email}`);

    let website = await Website.findOne({ creatorEmail: email });

    if (!website) {
      website = new Website({
        creatorEmail: email,
        content: {
          selectedCourses: selectedCourses || [],
          selectedServices: selectedServices || [],
        },
      });
      console.log("Creating new website with content");
    } else {
      website.content.selectedCourses = selectedCourses || [];
      website.content.selectedServices = selectedServices || [];
      console.log("Updating existing website content");
    }

    await website.save();
    console.log(`Content updated successfully for: ${email}`);
    res.json({ data: website, message: "Content selection saved" });
  } catch (error) {
    console.error("Error updating content:", error);
    res.status(500).json({ error: error.message });
  }
};

// Publish website
export const publishWebsite = async (req, res) => {
  try {
    const { email } = req.params;

    console.log(`Publishing website for email: ${email}`);

    const website = await Website.findOne({ creatorEmail: email });

    if (!website) {
      return res.status(404).json({ error: "Website not found" });
    }

    website.isPublished = true;
    await website.save();
    
    console.log(`Website published successfully for: ${email}`);
    res.json({ data: website, message: "Website published successfully" });
  } catch (error) {
    console.error("Error publishing website:", error);
    res.status(500).json({ error: error.message });
  }
};
