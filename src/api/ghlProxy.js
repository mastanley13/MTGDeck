const express = require('express');
const axios = require('axios');
const router = express.Router();

const GHL_API_KEY = process.env.VITE_GHL_API_KEY;
const GHL_LOCATION_ID = process.env.VITE_LOCATION_ID;
const GHL_API_URL = 'https://rest.gohighlevel.com/v1';

// Middleware to add GHL authentication
const addGHLAuth = (req, res, next) => {
  req.ghlHeaders = {
    Authorization: `Bearer ${GHL_API_KEY}`,
    'Content-Type': 'application/json',
    Version: '2021-07-28'
  };
  next();
};

// Get all blogs
router.get('/blogs', addGHLAuth, async (req, res) => {
  try {
    const response = await axios.get(`${GHL_API_URL}/custom-values/blogs`, {
      headers: req.ghlHeaders,
      params: {
        locationId: GHL_LOCATION_ID,
        ...req.query
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching blogs from GHL:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Internal server error'
    });
  }
});

// Create blog post
router.post('/blogs', addGHLAuth, async (req, res) => {
  try {
    const response = await axios.post(
      `${GHL_API_URL}/custom-values/blogs`,
      {
        ...req.body,
        locationId: GHL_LOCATION_ID
      },
      { headers: req.ghlHeaders }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error creating blog in GHL:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Internal server error'
    });
  }
});

// Update blog post
router.put('/blogs/:id', addGHLAuth, async (req, res) => {
  try {
    const response = await axios.put(
      `${GHL_API_URL}/custom-values/blogs/${req.params.id}`,
      {
        ...req.body,
        locationId: GHL_LOCATION_ID
      },
      { headers: req.ghlHeaders }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error updating blog in GHL:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Internal server error'
    });
  }
});

// Delete blog post
router.delete('/blogs/:id', addGHLAuth, async (req, res) => {
  try {
    const response = await axios.delete(
      `${GHL_API_URL}/custom-values/blogs/${req.params.id}`,
      {
        headers: req.ghlHeaders,
        params: { locationId: GHL_LOCATION_ID }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error deleting blog from GHL:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Internal server error'
    });
  }
});

// Upload file
router.post('/upload', addGHLAuth, async (req, res) => {
  try {
    const formData = new FormData();
    formData.append('file', req.files.file);
    formData.append('locationId', GHL_LOCATION_ID);

    const response = await axios.post(
      `${GHL_API_URL}/files/upload`,
      formData,
      {
        headers: {
          ...req.ghlHeaders,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error uploading file to GHL:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Internal server error'
    });
  }
});

module.exports = router; 