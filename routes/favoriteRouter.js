const express = require("express");
const bodyParser = require("body-parser");
const Favorite = require("../models/favorite");
const authenticate = require("../authenticate");
const cors = require("./cors");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    const requestedUserID = req.user._id;
    console.log("user: ", req.user._id);

    Favorite.find({ user: requestedUserID })
      .populate("user")
      .populate("campsites")
      .then((favorite) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorite);
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    const requestedUserID = req.user._id;
    const requestedCampsites = req.body.campsites;

    Favorite.findOne({ user: requestedUserID })
      .then((favorite) => {
        if (!favorite) {
          // If 'favorite' is an empty document
          req.body.user = requestedUserID; // Add a field for user: ObjectId to the req.body

          Favorite.create(req.body)
            .then((favorite) => {
              console.log("Favorite Created ", favorite);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        } else {
          // Document 'favorite' is not empty, then we can get favorite.campsites
          // >>> Convert ObjectId arrays to string arrays
          const strRequestedCampsites = requestedCampsites.map((item) =>
            item._id.toString()
          );
          const originalCampsites = favorite.campsites.map((item) =>
            item.toString()
          );
          // End: Convert ObjectId arrays to string arrays

          // Merge string arrays
          let updatedCampsites = [
            ...originalCampsites,
            ...strRequestedCampsites,
          ];

          // Remove duplicate array elements
          updatedCampsites = updatedCampsites.filter(
            (item, index) => updatedCampsites.indexOf(item) === index
          );
          updatedCampsites.sort(); // sorts for beautification

          // Update favorite.campsites
          favorite.campsites = updatedCampsites;

          console.log("favorite updated: ", JSON.stringify(favorite));

          favorite
            .save()
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        }
      })
      .catch((err) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /favorites");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    const requestedUserID = req.user._id;

    Favorite.deleteOne({ user: requestedUserID })
      .then((response) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(response);
      })
      .catch((err) => next(err));
  });

favoriteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `GET operation not supported on /favorites/${req.params.campsiteId}`
    );
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    const requestedUserID = req.user._id;

    Favorite.findOne({ user: requestedUserID })
      .then((favorite) => {
        if (!favorite) {
          // If 'favorite' is an empty document
          req.body.user = requestedUserID; // Add a field for user: ObjectId to the req.body
          req.body.campsites = req.params.campsiteId;
          Favorite.create(req.body);

          res.statusCode = 200;
          return next();
        } else if (favorite.campsites.includes(req.params.campsiteId)) {
          // If that campiste already exists
          res.statusCode = 403;
          res.end(`That campsite is already in the list of favorites!`);
        } else {
          // If that campiste doesn't exist while there exists favorite.campsites
          favorite.campsites.push(req.params.campsiteId);
          favorite
            .save()
            .then((favorite) => {
              res.statusCode = 200;
              res.json(favorite);
            })
            .catch((err) => next(err));
        }
      })
      .catch((err) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /favorites/${req.params.campsiteId}`
    );
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    const requestedUserID = req.user._id;

    Favorite.findOne({ user: requestedUserID })
      .then((favorite) => {
        favorite.campsites = favorite.campsites.filter(
          (item) => !item.equals(req.params.campsiteId)
        );

        favorite.save();
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorite);
      })
      .catch((err) => next(err));
  });

module.exports = favoriteRouter;
