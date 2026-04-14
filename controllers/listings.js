const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({accessToken: mapToken});
const filterPatterns = {
    trending: null,
    rooms: /room|hotel|apartment|penthouse|loft|villa|bungalow/i,
    "iconic-cities": /new york city|amsterdam|miami|dubai|los angeles|boston|florence/i,
    mountains: /mountain|ski|chalet|banff|aspen|alps|cabin|retreat/i,
    castles: /castle|palace|fort|historic villa/i,
    pools: /pool|infinity pool|swimming/i,
    camping: /camp|treehouse|cabin|lake|outdoor|forest/i,
    farms: /farm|cottage|cotswolds|countryside|rustic/i,
    arctic: /arctic|snow|ice|ski|winter/i,
    domes: /dome|igloo/i,
    boats: /boat|ship|canal|island/i,
};

module.exports.index = async (req,res) => {
    const searchQuery = req.query.search?.trim() || "";
    const activeCategory = req.query.category || "";
    const queryConditions = [];

    if(searchQuery){
        const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        queryConditions.push({
            title: { $regex: escapedQuery, $options: "i" },
        });
    }

    const categoryPattern = filterPatterns[activeCategory];
    if(categoryPattern){
        queryConditions.push({
            $or: [
                { title: categoryPattern },
                { description: categoryPattern },
                { location: categoryPattern },
                { country: categoryPattern },
            ],
        });
    }

    const query = queryConditions.length > 0 ? { $and: queryConditions } : {};

    const allListings = await Listing.find(query);
    res.render("listings/index.ejs", {allListings, searchQuery, activeCategory});
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews", 
            populate: {
                path: "author"
            },
        })
        .populate("owner");
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    // console.log(listing);
    res.render("listings/show.ejs", {listing});
};

module.exports.createListing = async (req, res, next) => {
    let response = await geocodingClient
        .forwardGeocode({
            query: req.body.listing.location,
            limit: 1,
        })
        .send();  

    let url = req.file.path;
    let filename = req.file.filename;
    
    // let {title, description, image, price, country, location} = req.body;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};
    newListing.geometry = response.body.features[0].geometry;
    let savedListing = await newListing.save();
    console.log(savedListing);
    req.flash("success", "New Listing Created!");
    res.redirect("/listings"); 
};

module.exports.renderEditForm = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_200,w_250");
    res.render("listings/edit.ejs", {listing, originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
    let {id} = req.params;
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});
    
        if(typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url, filename};
        await listing.save();
        }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing deleted!");
    res.redirect("/listings");
};
