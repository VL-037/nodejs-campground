const mongoose = require('mongoose');
const Review = require('./review')
const Schema = mongoose.Schema;
const { cloudinary } = require('../cloudinary')

// https://res.cloudinary.com/qksicphhr/image/upload/w_1000/v1624964264/YelpCamp/clyzgvioapmb85wxw6ld.jpg

const ImageSchema = new Schema({
    url: String,
    filename: String
})
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});
const option = { toJSON: { virtuals: true } }

const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    geometry: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'], // 'location.type' must be 'Point'
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, option);
CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0, 100)}...</p>`
})

CampgroundSchema.post('findOneAndDelete', async function (campground) {
    if (campground) {
        await Review.deleteMany({
            _id: {
                $in: campground.reviews
            }
        })
        for (let img of campground.images) { //additional for delete cloud img when delete a campground
            await cloudinary.uploader.destroy(img.filename)
        }
    }
})

module.exports = mongoose.model('Campground', CampgroundSchema);