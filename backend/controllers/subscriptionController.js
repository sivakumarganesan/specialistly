import Subscription from '../models/Subscription.js';

export const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubscriptionByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const subscription = await Subscription.findOne({ email });
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const {
      creatorId,
      email,
      planType,
      price,
      currency,
      status,
      billingCycle,
      features,
      autoRenew,
    } = req.body;

    const subscription = new Subscription({
      creatorId,
      email,
      planType,
      price,
      currency,
      status,
      billingCycle,
      features,
      autoRenew,
      startDate: new Date(),
      nextBillingDate:
        billingCycle === 'forever'
          ? null
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for monthly
    });

    await subscription.save();
    res.status(201).json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const subscription = await Subscription.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    subscription.lastUpdated = new Date();
    subscription.updatedAt = new Date();
    await subscription.save();

    res.json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateSubscriptionByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const updates = req.body;

    let subscription = await Subscription.findOne({ email });

    if (!subscription) {
      // Create new subscription if it doesn't exist
      subscription = new Subscription({
        email,
        ...updates,
      });
    } else {
      // Update existing subscription
      Object.assign(subscription, updates);
      subscription.lastUpdated = new Date();
      subscription.updatedAt = new Date();
    }

    await subscription.save();
    res.json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findByIdAndDelete(id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const changePlan = async (req, res) => {
  try {
    const { email } = req.params;
    const { planType, price, currency, billingCycle, features } = req.body;

    let subscription = await Subscription.findOne({ email });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    subscription.planType = planType;
    subscription.price = price;
    subscription.currency = currency;
    subscription.billingCycle = billingCycle;
    subscription.features = features;
    subscription.status = 'active';
    subscription.startDate = new Date();
    subscription.lastUpdated = new Date();
    subscription.updatedAt = new Date();

    if (billingCycle === 'monthly') {
      subscription.nextBillingDate = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );
    } else if (billingCycle === 'yearly') {
      subscription.nextBillingDate = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      );
    } else {
      subscription.nextBillingDate = null;
    }

    await subscription.save();
    res.json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
