/*
Functions:
Connect the web service to the database (database utilized is MongoDB)
Alternative CRUD operations for documents in the database
*/

const mongoose = require('mongoose');
require('dotenv').config();
const url = process.env.MONGODB_URI;

const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true
}

const database = {
    connect: async function () {
        await mongoose.connect(url, options);
        console.log('Connected to: ' + url);
    },

    insertOne: async function(model, doc) {
        return await model.create(doc);
    },

    insertMany: async function(model, docs) {
        return await model.insertMany(docs);
    },

    findOne: async function(model, query, projection) {
        return await model.findOne(query, projection);
    },

    findMany: async function(model, query, projection) {
        return await model.find(query, projection);
    },

    updateOne: async function(model, filter, update) {
        return await model.updateOne(filter, update);
    },

    updateMany: async function(model, filter, update) {
        return await model.updateMany(filter, update);
    },

    deleteOne: async function(model, conditions) {
        return await model.deleteOne(conditions);
    },

    deleteMany: async function(model, conditions) {
        return await model.deleteMany(conditions);
    },

    findOneAndDelete: async function (model, query) {
        return await model.findOneAndDelete(query);
    }
}

module.exports = database;