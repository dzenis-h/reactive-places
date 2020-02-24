const fs = require("fs");
const { validationResult } = require("express-validator");

const HttpError = require("../middleware/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      "Could not find place for the provided id.",
      404
    );
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!userWithPlaces) {
    return next(
      new HttpError("Could not find places for the provided user id.", 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map(place =>
      place.toObject({ getters: true })
    )
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  try {
    await createdPlace.save();
    user.places.push(createdPlace);
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again !!!",
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description } = req.body;
  const { pid } = req.params;

  let place;
  try {
    place = await Place.findById(pid).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(`No place found with the id of ${pid}`, 500);
    return next(error);
  }

  if (place.creator.id.toString() !== req.user.id.toString()) {
    return next(
      new HttpError(
        `User with the id of ${req.user.id} is NOT authorized to do this action`,
        401
      )
    );
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const { pid } = req.params;
  const { id } = req.user; // we're setting this up in the'protect' middleware (from token)

  let place;
  try {
    place = await Place.findById(pid).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place 1",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find place for this id.", 404);
    return next(error);
  }

  if (place.creator.id.toString() !== req.user.id.toString()) {
    return next(
      new HttpError(
        `User with the id of ${id} is NOT authorized to do this action`,
        401
      )
    );
  }

  const imagePath = place.image;

  try {
    const user = await User.findById(place.creator.id);
    const newList = user.places.filter(p => p.toString() !== pid.toString());
    user.places = newList;
    await user.save();
    await place.remove();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place 2",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, err => {
    console.log(err);
  });

  res.status(200).json({ message: "Place successfully deleted." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
