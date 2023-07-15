const path = require("path");
const ordersController = require("../orders/orders.controller");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
// Maybe I use this by inserting the new data object as an argument.

// TODO: Implement the /dishes handlers needed to make the tests pass

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body
        if (data[propertyName]) {
            return next()
        }
        next({
            status: 400,
            message: `Must include a ${propertyName} property.`
        })
    }
}

function priceIsValidNumber(req, res, next) {
    const { data: { price } = {} } = req.body
    if (price <= 0 || !Number.isInteger(price)) {
        return next({
            status: 400,
            message: `The price requires a valid number.`
        })
    } else {
        return next()
    }

}

function dishExists(req, res, next) {
    const { dishId } = req.params
    const foundDish = dishes.find((dish) => dish.id === dishId)
    if (foundDish) {
        res.locals.dish = foundDish
        return next()
    }
    return next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    })
}

function checkIfIdsMatch(req, res, next) {
    const { dishId } = req.params
    const { data: { id } = {} } = req.body
    if (id) {
        if (id === dishId) {
            return next()
        } else {
            return next({
                status: 400,
                message: `Inputted id:${id} must match existing id:${dishId}.`
            })
        }
    }
    return next()
}

function create(req, res, next) {
    const { data: { name, description, price, image_url } = {} } = req.body
    const newDish = {
        id: nextId(), // not sure how to use this function.
        name,
        description,
        image_url,
        price,
    }
    dishes.push(newDish)
    res.status(201).json({ data: newDish })
}

function read(req, res, next) {
    res.json({ data: res.locals.dish })
}

function update(req, res, next) {
    const dish = res.locals.dish
    const { data: { name, description, price, image_url }} = req.body

    dish.name = name
    dish.description = description
    dish.price = price
    dish.image_url = image_url

    res.json({ data: dish })
}

function list(req, res, next) {
    res.json({ data: dishes })
}


module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValidNumber,
        create
    ],
    read: [dishExists, read],
    update: [
        dishExists,
        checkIfIdsMatch,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValidNumber,
        update,
    ],
    list,
}