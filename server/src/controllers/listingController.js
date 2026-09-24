import Joi from 'joi';
import { Listing } from '../models/Listing.js';

// TODO: write a validation schema for create/update per README.md section 2.

const CATEGORIES = ['textbooks', 'electronics', 'furniture', 'clothing', 'other'];
const CONDITIONS = ['new', 'like-new', 'used', 'worn'];
const STATUSES = ['active', 'sold', 'removed'];



const createSchema = Joi.object({
  title: Joi.string().min(1).max(120).required(),
  description: Joi.string().max(1000).allow('', null),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(...CATEGORIES).default('other'),
  condition: Joi.string().valid(...CONDITIONS).default('used'),
  status: Joi.string().valid(...STATUSES).default('active'),
  seller: Joi.string().hex().length(24).allow(null)
});

const updateSchema = Joi.object({
  title: Joi.string().min(1).max(120),
  description: Joi.string().max(1000).allow('', null),
  price: Joi.number().min(0),
  category: Joi.string().valid(...CATEGORIES),
  condition: Joi.string().valid(...CONDITIONS),
  status: Joi.string().valid(...STATUSES),
  seller: Joi.string().hex().length(24).allow(null)
}).min(1);


// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const listings = await Listing.find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json({ listings });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    // Hide removed listings unless requested via ?includeRemoved=true
    if (listing.status === 'removed' && req.query.includeRemoved !== 'true') {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json({ listing });
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });
    const listing = await Listing.create(value);
    res.status(201).json({ listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: 'removed' } },
      { $set: value },
      { new: true, runValidators: true }
    ).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: 'removed' } },
      { status: 'removed' },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ ok: true, message: 'Listing removed', listing });
  } catch (err) { next(err); }
}

