const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body
        if (data[propertyName]) {
            return next()
        }
        return next({
            status: 400,
            message: `Must include a ${propertyName} property.`
        })

    }
}

function quantityIsValidNumber(req, res, next) {
    const { data: { dishes } = {} } = req.body
    for (let i = 0; i < dishes.length; i++) {
        const dish = dishes[i]
        if (dish.quantity <= 0 || !Number.isInteger(dish.quantity)) {
            return next({
                status: 400,
                message: `The dish ${i} must have a quantity that is an integer greater than 0`
            })
        }
    }
    return next()
}

function dishesArrayNotEmpty(req, res, next) {
    const { data: { dishes } } = req.body
    if (dishes.length >= 1) {
        return next()
    }
    return next({
        status: 400,
        message: `Order must contain at least one dish.`
    })
}

function orderExists(req, res, next) {
    const { orderId } = req.params
    const foundOrder = orders.find(order => order.id === orderId)
    if (foundOrder) {
        res.locals.order = foundOrder
        return next()
    }
    next({
        status: 404,
        message: `Order does not exist: ${orderId}.`
    })
}

function isNotDeliveredYet(req, res, next) {
    const order = res.locals.order

    if (order.status === "delivered") {
        return next({
            status: 404,
            message: `A delivered order cannot be changed`
        })
    }
    return next()
}

function statusIsPending(req, res, next) {
    const order = res.locals.order

    if (order.status === "pending") {
        return next()
    }
    return next({
        status: 400,
        message: `An order cannot be deleted unless it is pending.` 
    })
}

function create(req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    }
    orders.push(newOrder)
    res.status(201).json({ data: newOrder })
}

function read(req, res, next) {
    res.json({ data: res.locals.order })
}

function update(req, res, next) {
    const order = res.locals.order
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body
    
    order.deliverTo = deliverTo
    order.mobileNumber = mobileNumber
    order.status = status
    order.dishes = dishes

    res.json({ data: order })
}

function destroy(req, res, next) {
    const order = res.locals.order
    const deletedOrders = orders.splice(order, 1)

    res.sendStatus(204)
}

function list(req, res, next) {
    res.json({ data: orders })
}


module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        quantityIsValidNumber,
        dishesArrayNotEmpty,
        create,
    ],
    read: [orderExists, read],
    update: [
        orderExists,
        isNotDeliveredYet,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        bodyDataHas("status"),
        quantityIsValidNumber,
        dishesArrayNotEmpty,
        update,
    ],
    delete: [
        orderExists,
        statusIsPending,
        destroy,
    ],
    list,
}
