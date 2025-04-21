const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Review = require("./review.js");

const listingSchema = new Schema({
    title:
    {type:String,
     required:true
    },
    description:String,
  
        image: {
            filename: {
                type:String,
                
            },
            url: 
            {
                type:String,
                
            }

        },
        price: {
            type: Number,
            min: [0, 'Price cannot be negative'], // Ensures price is not negative
        },
    location: String,
    country:String,
    reviews:[{
        type: Schema.Types.ObjectId,
        ref:"Review",
    }
    ],
    owner:{
        type: Schema.Types.ObjectId,
        ref:"User",
    },
    category: {
        type: String,
        enum: ['trending', 'rooms', 'iconic', 'mountains', 'castles', 'pools', 'campaign', 'arctic', 'domes'], // Define your valid categories here
        required: true // Optional: if you want to make it required
    }

    
   
   
});

listingSchema.post("findOneAndDelete",async(listing)=>{
    await Review.deleteMany({_id:{$in:listing.reviews}});
})

const Listing = mongoose.model("Listing",listingSchema);

module.exports=Listing;