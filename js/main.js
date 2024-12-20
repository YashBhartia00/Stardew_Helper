const ctx = {
    MAP_H: 0,
    MAP_W: 0,
    FISH_DATA: [],
    fish_price_breakdown: [],
    fish_detail: [],
    fish_chances: {},
    SELECTED_TIME: [],
    SELECTED_SEASON: [],
    SELECTED_AREAS: [],
    seasons: ["Spring", "Summer", "Fall", "Winter"],
    locations: ["Ocean", "Mountain_Lake", "River_Town", "River_Forest", "Forest_Pond", "The_Desert", "Secret_Woods_Pond"],
}



let map, imageOverlay
const polygons = {}

/**
 * Converts relative coordinates to absolute coordinates
 * @param {*} relativeCoords
 * @returns absolute coordinates calculated based on the map dimensions
 */
function convertRelativeToAbsolute(relativeCoords){
    return relativeCoords.map(coords => [
        coords[0] * ctx.MAP_H,
        coords[1] * ctx.MAP_W
    ]);
}

/**
 * Computes the dimensions of the map based on the screen width
 */
function computeMapDimensions(){
    const screenWidth = window.innerWidth * 0.45;
    const aspectRatio = 919/560;

    ctx.MAP_H = screenWidth / aspectRatio;
    ctx.MAP_W = screenWidth;
}

/**
 * Sets the polygons for fishing locations on the map
 */
function setPolygons(){
    const areaSeaRelative = [
        [0.17, 0.6],
        [0.015, 0.6],
        [0.015, 0.87],
        [0.3, 0.87],
        [0.3, 0.87],
        [0.27, 0.82],
        [0.25, 0.8],
        [0.18, 0.8],
        [0.17, 0.79],
        [0.18, 0.66],
        [0.23, 0.63],
        [0.22, 0.61]
    ]

    const areaLakeRelative = [
        [0.835, 0.71],
        [0.79, 0.71],
        [0.75, 0.698],
        [0.748, 0.694],
        [0.726, 0.694],
        [0.71, 0.705],
        [0.69, 0.705],
        [0.69, 0.7],
        [0.68, 0.692],
        [0.655, 0.692],
        [0.6, 0.7],
        [0.58, 0.696],
        [0.555, 0.682],
        [0.555, 0.696],
        [0.59, 0.71],
        [0.665, 0.71],
        [0.68, 0.745],
        [0.716, 0.75],
        [0.748, 0.74],
        [0.76, 0.745],
        [0.767, 0.745],
        [0.777, 0.723],
        [0.777, 0.72]

    ]

    const areaTownRiverRelative = [
        [0.54, 0.69],
        [0.54, 0.675],
        [0.525, 0.675],
        [0.51, 0.683],
        [0.435, 0.683],
        [0.405, 0.673],
        [0.398, 0.673],
        [0.38, 0.685],
        [0.35, 0.685],
        [0.32, 0.65],
        [0.32, 0.6],
        [0.35, 0.56],
        [0.355, 0.56],
        [0.355, 0.525],
        [0.348, 0.51],
        [0.348, 0.47],
        [0.35, 0.47],
        [0.35, 0.42],
        [0.32, 0.42],
        [0.29, 0.44],
        [0.29, 0.49],
        [0.3, 0.52],
        [0.3, 0.6],
        [0.31, 0.61],
        [0.31, 0.68],
        [0.27, 0.702],
        [0.27, 0.712],
        [0.29, 0.708],
        [0.295, 0.708],
        [0.31, 0.7],
        [0.32, 0.685],
        [0.335, 0.685],
        [0.35, 0.692],
        [0.38, 0.692],
        [0.4, 0.683],
        [0.41, 0.683],
        [0.44, 0.69],
        [0.47, 0.695],
        [0.51, 0.695]

    ]
    const areaForestRiverRelative = [
        [0.33, 0.36],
        [0.32, 0.32],
        [0.255, 0.276],
        [0.22, 0.273],
        [0.2, 0.27],
        [0.2, 0.255],
        [0.23, 0.24],
        [0.24, 0.24],
        [0.26, 0.245],
        [0.265, 0.265],
        [0.28, 0.275],
        [0.28, 0.28],
        [0.345, 0.325],
        [0.355, 0.325],
        [0.355, 0.37],
        [0.367, 0.37],
        [0.367, 0.41],
        [0.353, 0.41],
        [0.353, 0.38],
    ]

    const areaPondRelative = [
        [0.41, 0.233],
        [0.387, 0.233],
        [0.365, 0.245],
        [0.36, 0.255],
        [0.36, 0.275],
        [0.365, 0.285],
        [0.375, 0.29],
        [0.4, 0.29],
        [0.42, 0.27],
        [0.427, 0.25],
    ]

    const areaDesertRelative = [
        [0.95, 0.01],
        [0.95, 0.05],
        [0.98, 0.05],
        [0.98, 0.01]
    ]

    const areaSecretWoodsRelative = [
        [0.47, 0.08],
        [0.48, 0.06],
        [0.49, 0.05],
        [0.50, 0.045],
        [0.51, 0.05],
        [0.52, 0.06],
        [0.53, 0.08],
        [0.52, 0.11],
        [0.51, 0.12],
        [0.50, 0.125],
        [0.49, 0.12],
        [0.48, 0.11]
    ]

    const areas = {
        areaOcean: areaSeaRelative,
        areaMountainLake: areaLakeRelative,
        areaRiverTown: areaTownRiverRelative,
        areaForestRiver: areaForestRiverRelative,
        areaForestPond: areaPondRelative,
        areaTheDesert: areaDesertRelative,
        areaSecretWoodsPond: areaSecretWoodsRelative
    };

    // Remove existing polygons if they exist
    Object.keys(polygons).forEach(key => {
        if(polygons[key]){
            map.removeLayer(polygons[key]);
        }
    });

    // Add new polygons
    Object.keys(areas).forEach(key => {
        const absoluteCoords = convertRelativeToAbsolute(areas[key]);
        let locationKey;
        if(key === "areaOcean") locationKey = "Ocean";
        else if(key === "areaMountainLake") locationKey = "Mountain_Lake";
        else if(key === "areaRiverTown") locationKey = "River_Town";
        else if(key === "areaForestRiver") locationKey = "River_Forest";
        else if(key === "areaForestPond") locationKey = "Forest_Pond";
        else if(key === "areaTheDesert") locationKey = "The_Desert";
        else if(key === "areaSecretWoodsPond") locationKey = "Secret_Woods_Pond";
        polygons[key] = L.polygon(absoluteCoords, {
            color: 'white',
            fillColor: 'white',
            weight: 2,
            fillOpacity: 0.2
        });

        polygons[key].bindTooltip(locationKey, {
            sticky: true
        });


        polygons[key].locationKey = locationKey;

        polygons[key].on('mouseover', function(e){
            this.setStyle({
                fillOpacity: 0.7
            })
        });

        polygons[key].on('mouseout', function(e){
            this.setStyle({
                fillOpacity: ctx.SELECTED_AREAS.includes(this.locationKey) ? 0.7 : 0.2
            });
        });

        polygons[key].on('click', function(e){
            const index = ctx.SELECTED_AREAS.indexOf(this.locationKey);
            if(index > -1){
                // Area is already selected, deselect it
                ctx.SELECTED_AREAS.splice(index, 1);
                this.setStyle({
                    fillOpacity: 0.2
                });
            } else {
                // Area is not selected, select it
                ctx.SELECTED_AREAS.push(this.locationKey);
                this.setStyle({
                    fillOpacity: 0.7
                });
            }

            filterFish();
            updateRadarChart();

        });

        polygons[key].addTo(map);
    });

}

/**
 * Initializes the map
 */
function mapInit(){
    // Compute map dimensions
    computeMapDimensions();
    const mapContainer = document.getElementById('map');
    mapContainer.style.width = `${ctx.MAP_W}px`;
    mapContainer.style.height = `${ctx.MAP_H}px`;

    // Init map
    map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: 0,
        maxZoom:2,
        maxBounds: [[0,0], [ctx.MAP_H, ctx.MAP_W]],
        maxBoundsViscosity: 1.0,
        zoomControl: false
    });

    // Load game map
    const bounds = [[0, 0], [ctx.MAP_H,ctx.MAP_W]];
    imageOverlay = L.imageOverlay('../data/images/map/main.jpg', bounds).addTo(map);
    map.fitBounds(bounds);

    setPolygons();

    window.addEventListener('resize', function(){
        computeMapDimensions();
        const mapContainer = document.getElementById('map');
        mapContainer.style.width = `${ctx.MAP_W}px`;
        mapContainer.style.height = `${ctx.MAP_H}px`;

        map.invalidateSize();
        map.setMaxBounds([[0,0], [ctx.MAP_H, ctx.MAP_W]]);
        map.fitBounds([[0,0], [ctx.MAP_H, ctx.MAP_W]]);

        if(imageOverlay){
            map.removeLayer(imageOverlay);
        }
        const newBounds = [[0, 0], [ctx.MAP_H,ctx.MAP_W]];
        imageOverlay = L.imageOverlay('../data/images/map/main.jpg', newBounds).addTo(map);

        // Update areas
        setPolygons();
    });
}

/**
 * Main function to create the visualization
 */
function createViz(){
    ctx.SELECTED_TIME = new Array(21).fill(false);
    ctx.SELECTED_SEASON = new Array(4).fill(false);
    ctx.SELECTED_WEATHER = "Any";
    ctx.SELECTED_AREAS = []
    mapInit();
    loadData();
    timeWheel();
    handleWeatherSelection();

    document.getElementById("reset").addEventListener("click", function(){
        ctx.SELECTED_AREAS = [];
        setPolygons();
        ctx.SELECTED_TIME = new Array(21).fill(false);
        ctx.SELECTED_SEASON = new Array(4).fill(false);
        ctx.SELECTED_WEATHER = "Any";
        d3.selectAll(".weather-btn").classed("selected", false);
        document.getElementById("fishSearch").value = "";

        d3.selectAll("path.season").style("opacity", 0.3);
        d3.selectAll("path.time").style("opacity", 0.3);

        filterFish();
        updateRadarChart();
    });
}



/**
 * Loads the data from the csv files
 */
function loadData(){
    let chanceFiles = [];
    ctx.locations.forEach(location => {
        ctx.seasons.forEach(season => {
            ["Sun", "Rain"].forEach(weather => {
                chanceFiles.push(`data/fish_chances/${location}_${season}_${weather}.csv`);
            });
        });
    });

    // let chanceFiles = ["data/fish_chances/ocean_winter_rain.csv" ,"data/fish_chances/ocean_winter_sun.csv"]

    const files = [
        "data/fish_detail.csv",
        "data/fish_price_breakdown.csv",
        "data/crabpotandothercatchables.csv",
    ]

    files.push(...chanceFiles);

    let promises = files.map(url => d3.csv(url))
    Promise.all(promises).then(function(data){
        ctx.fish_price_breakdown = data[1];
        processFishData(data[0]);
        addFishToList();
        ctx.fish_chances = {};
        chanceFiles.forEach((file, index) => {
            // Sometimes location is 2 words separated by _ (ie River_Town), or even 3 words
            let location = file.split("/")[2].split("_")[0];
            let second = file.split("/")[2].split("_")[1];
            let third = file.split("/")[2].split("_")[2];

            let season = "";
            let weather = "";
            if(ctx.seasons.includes(second)){
                season = second;
                weather = third.split(".")[0];
            } else if (ctx.seasons.includes(third)){ // location is 2 words
                location += "_" + second;
                season = third;
                weather = file.split("/")[2].split("_")[3].split(".")[0];
            } else { // location is 3 words
                location += "_" + second + "_" + third;
                season = file.split("/")[2].split("_")[3];
                weather = file.split("/")[2].split("_")[4].split(".")[0];
            }
            processChancesData(location, season, weather, data[index + 3]);
        })
        ctx.fish_detail = data[0];
        fishAveragePricePerTime();
        // updateProfitBarChart();
    })
}

/**
 * Processes the fish chances data into a more usable format
 * @param {*} location 
 * @param {*} season 
 * @param {*} weather 
 * @param {*} data 
 * @returns 
 */
function processChancesData(location, season, weather, data){
    // variable to take into account: hours of the day, season, weather, location.
    // Fish chances of being caught depends on those
    let chances = {}
    if(!data) return;
    data.forEach(row => {
        let time = row.Time;
        chances[time] = {};
        chances[time]["weather"] = weather;
        chances[time]["season"] = season;
        for(let i = 2 ; i < data.columns.length; i++){
            let fish = data.columns[i];
            chances[time][fish.replace(/\d+/g, "").trim()] = parseFloat(row[fish]);
        }
    });
    ctx.fish_chances[location + "_" + season + "_" + weather] = chances;
}

/**
 * Processes the fish data into a more usable format
 * @param {*} data raw fish data
 */
function processFishData(data){
    let fishData = data.map(fish => {
        let season = fish.Season.split('\n').map(s => s.trim());
        if (season == "All Seasons"){
            season = ctx.seasons;
        }

        let time = fish.Time.split('\n').map(t => t.trim());
        if(time == "Anytime"){
            time = ["6:00 - 2:00"];
        } else {
            time = time.map(t => {
                t = t.replace(/[–—]/g, '-');
                let [start, end] = t.split(' - ')
                const matchStart = start.match(/^(\d{1,2})(am|pm)$/i);
                const matchEnd = end.match(/^(\d{1,2})(am|pm)$/i);
                let hourStart = parseInt(matchStart[1], 10);
                let hourEnd = parseInt(matchEnd[1], 10);
                if(matchStart[2] === "pm" && hourStart !== 12){
                    hourStart += 12;
                }
                if(matchEnd[2] === "pm" && hourEnd !== 12){
                    hourEnd += 12;
                }
                return `${hourStart}:00 - ${hourEnd}:00`;
            })
        }

        // If location is river (town+forest), change that elementt to town_river and town_forest (ie 2 locations)
        let location = fish.Location.split('\n').flatMap(loc => {
            return loc.split(',').flatMap(l => {
                l = l.trim();

                // Handle river locations first with exact string matching
                const riverLocations = {
                    "River (Town+Forest)": ['River_Town', 'River_Forest'],
                    "River (Forest)": ['River_Forest'],
                    "River (Town)": ['River_Town']
                };

                if (riverLocations[l]) {
                    return riverLocations[l];
                }

                // Handle other locations
                return l
                    .replace(/[()]/g, '') // Remove parentheses
                    .replace(/\s+/g, '_') // Replace spaces with underscore
                    .replace(/_+$/g, ''); // Remove trailing underscores
            });
        })


        return {
            name: fish.Name,
            seasons: season,
            times: time,
            weather: fish.Weather.split('\n').map(w => w.trim()),
            location: location,
            description: fish.Description,
            baseXP: parseInt(fish.BaseXP),
            difficulty: parseInt(fish.Difficulty.split(' ')[0]),
            basePrice: parseInt(ctx.fish_price_breakdown.find(row => row.Name === "BP Base")[fish.Name]),
        }
    });

    ctx.FISH_DATA = fishData;
}

/**
 * Adds the list of fish to the fish list container
 */
function addFishToList(){
    const container = d3.select("#fishList");
    let data = ctx.FISH_DATA.sort((a, b) => a.name.localeCompare(b.name));
    container.selectAll("li")
        .data(ctx.FISH_DATA)
        .enter()
        .append("li")
        .each(function(d){
            const li = d3.select(this);
            li.append("img")
                .attr("src", `data/images/fish/${d.name.replace(/ /g, "_")}.png`);
            li.append("span")
                .text(d.name);
        })
        .on("click", function(event, fish){
            displayFishInfo(fish);
        })
        .on("mouseover", function(event, fish){
            highlightFishingZones(fish.location);
        })
        .on("mouseout", function(event, fish){
            unhighlightFishingZones(fish.location);
        });
}

/**
 * Highlights the zones where a fish can be caught
 * @param {*} locations 
 */
function highlightFishingZones(locations){
    locations.forEach(location => {
        const polygon = polygons[`area${location.replace(/_/g, '')}`];
        if(polygon){
            polygon.setStyle({
                color: "red"
            });
        }
    });
}

/**
 * Removes the highlight from the zones where a fish can be caught
 * @param {*} locations 
 */
function unhighlightFishingZones(locations){
    locations.forEach(location => {
        const polygon = polygons[`area${location.replace(/_/g, '')}`];
        if(polygon){
            polygon.setStyle({
                color: "white"
            });
        }
    });
}

/**
 * Function to check if a given hour is within a given range
 * @param {*} hour the hour to check between 6 and 26
 * @param {*} range array of string ranges ["xx:xx, xx:xx", ...]
 * @returns Boolean
 */
function isInRange(hour, range){
    if(!range) return false;


    return range.some(timeRange => {
        const [start, end] = timeRange.split(' - ').map(t => parseInt(t));
        newEnd = end > start ? end : end + 24;
        return hour >= start && hour < newEnd;
    });
}

/**
 * Checks if a fish matches all the selected filters
 * @param {*} fish 
 * @returns true if the fish matches all the selected filters
 */
function isFishMatch(fish){
    const matchesArea = ctx.SELECTED_AREAS ? ctx.SELECTED_AREAS.every(area => fish.location.includes(area)) : true;
    const matchesSeason = ctx.SELECTED_SEASON.every((selected, index) => {
        return selected ? fish.seasons.includes(ctx.seasons[index]) : true;
    });
    const matchesWeather = fish.weather.includes(ctx.SELECTED_WEATHER) || fish.weather.includes("Any")  || ctx.SELECTED_WEATHER == "Any";
    const matchesTime = ctx.SELECTED_TIME.every((selected, index) => {
        return !selected || isInRange(index + 6, fish.times);
    });
    return matchesArea && matchesSeason && matchesWeather && matchesTime;
}

/**
 * Filters the list of fish based on the selected time, season, area and weather
 * @param {*} searchTerm
 */
function filterFish(searchTerm=""){
    const container = d3.select("#fishList");
    const filteredData = ctx.FISH_DATA.filter(isFishMatch);
    const finalFilteredData = searchTerm ? filteredData.filter(fish => fish.name.toLowerCase().includes(searchTerm.toLowerCase())) : filteredData;
    const filteredFishNames = finalFilteredData.map(fish => fish.name);

    container.selectAll("li")
        .style("display", d => filteredFishNames.includes(d.name) ? null : "none");

    // updateProfitBarChart()
}


/**
 * Displays the fish information in an overlay
 * @param {*} fish fish object to display
 */
function displayFishInfo(fish){
    // Put map under overlay
    const mapContainer = document.getElementById('map');
    mapContainer.style.zIndex = -1;

    const overlay = d3.select("body").append("div").attr("id", "fishInfoOverlay");
    const container = overlay.append("div").attr("id", "fishInfo");

    // Close Icon
    container.append("div")
    .attr("id", "close")
    .text("X")
    .on("click", function() {
        overlay.classed("fade-out", true);
        setTimeout(() =>{
            overlay.remove(); // Close the container on close
        mapContainer.style.zIndex = 1; // Put map back on top
        }, 500);

    });

    // Add fish name
    container.append("div")
    .attr("id", "fishName")
    .text(fish.name);

    const contentContainer = container.append("div").attr("id", "fishInfoContent");


    // Left section with fish name and image
    const leftSection = contentContainer.append("div").attr("class", "page-left")

    // Add Image and motif
    const imageContainer = leftSection.append("div").attr("id", "fishImageContainer");
    imageContainer.append("img")
        .attr("src", `data/images/fish/${fish.name.replace(/ /g, "_")}.png`);
    // imageContainer.append("div")
    //     .attr("id", "fishMinigame");


    // Set fish description
    leftSection.append("div")
    .attr("class", "page-description")
    .text(fish.description);

    // Right section
    const rightSection = contentContainer.append("div").attr("class", "page-right");

    // Create table for fish info
    const table = rightSection.append("table")
        .attr("id", "fishInfoTable");
    const tbody = table.append("tbody");

    const info = [
        { label: "Location", value: fish.location.map(l => l.replace(/_/g, " ")).join(", ") },
        { label: "Time", value: fish.times },
        { label: "Season", value: fish.seasons.join(", ") },
        { label: "Weather", value: fish.weather },
        { label: "Base XP", value: fish.baseXP }
    ]


    info.forEach(i => {
        const row = tbody.append("tr");
        row.append("th").text(i.label);
        row.append("td").text(i.value);
    });

    // // Add price breakdown in grouped bar chart, price depending on quality. different bars represent profession
    // const priceBreakdown = rightSection.append("div")
    //     .attr("id", "priceBreakdown");
    // priceBarChart("#priceBreakdown", fish.Name);
}



/**
 * Filters the fish list based on the search input
 */
function FilterByName() {
    const input = document.getElementById("fishSearch");
    const searchTerm = input.value;
    filterFish(searchTerm);
}

/**
 * Creates a bar chart to display the price breakdown of a fish
 * @param {*} selector
 * @param {*} fishName
 */
function priceBarChart(selector, fishName){
    let margin = {top: 10, right: 30, bottom: 20, left: 40},
        width = 460 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    let svg = d3.select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    let subgroups = ["Base", "Silver", "Gold", "Irridium"];
    let groups = ["BP", "FP", "AP"];

    let data = [];
    subgroups.forEach(subgroup => {
        let baseRow = ctx.fish_price_breakdown.find(row => row.Name === "BP " + subgroup);
        let fisherRow = ctx.fish_price_breakdown.find(row => row.Name === "FP " + subgroup);
        let anglerRow = ctx.fish_price_breakdown.find(row => row.Name === "AP " + subgroup);
        data.push ({
            quality: subgroup,
            "BP": parseInt(baseRow[fishName]),
            "FP": parseInt(fisherRow[fishName]),
            "AP": parseInt(anglerRow[fishName])
        });
    });

    // fy encodes the fish quality
    const fy = d3.scaleBand()
    .domain(subgroups)
    .range([0, height])
    .padding(0.4);


    // y encodes the profession
    const y = d3.scaleBand()
    .domain(groups)
    .range([0, fy.bandwidth()])
    .padding(0.2);

    const color = d3.scaleOrdinal()
    .domain(groups)
    .range(d3.schemeSpectral[groups.length]);

    // x encodes the price (width of the bars)
    let x = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(d["BP"], d["FP"], d["AP"]))]).nice()
        .range([0, width]);

    // Show the bars
    svg.append("g")
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
            .attr("transform", d => "translate(0," + fy(d.quality) + ")")
        .selectAll("rect")
        .data(d => groups.map(key => ({key: key, value: d[key]})))
        .enter()
        .append("rect")
            .attr("y", d => y(d.key))
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.value))
            .style("fill", d => color(d.key))
            .append("title")
                .text(d => `${d.value}g`);

    // Add y axis
    svg.append("g")
        .call(d3.axisLeft(fy));

    // Add x axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickSize(0));

    // Add legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width * 0.7}, 0)`);

    const professions = ["Base Profession", "Fisher Profession", "Angler Profession"];
    professions.forEach((profession, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        legendRow.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", color(groups[i]));

        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 10)
            .attr("text-anchor", "start")
            .text(profession);
    });
}

/**
 * Creates a pie chart to create a season wheel for selection
 */
function seasonWheel(){
    const seasons = ctx.seasons;
    const size = 200;
    const radius = size / 2;

    const seasonWheel = d3.select("#seasonWheel")
        .append("svg")
            .attr("width", size)
            .attr("height", size)
        .append("g")
            .attr("transform", `translate(${radius}, ${radius})`);

    const color = d3.scaleOrdinal()
        .domain(seasons)
        .range(["#00FF00", "#FFD700", "#FF8C00", "#1E90FF"]);

    const pie = d3.pie()
        .value(1);

    const data = pie(seasons.map(season => ({key: season, value: 1})));

    const arc = d3.arc()
                .innerRadius(50)
                .outerRadius(radius)

    seasonWheel.selectAll("path")
        .data(data)
        .enter()
        .append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.key))
            .attr("stroke", "black")
            .style("stroke-width", "2px")
            .style("opacity", 0.7)

    // Add labels
    seasonWheel.selectAll("path.text-path")
            .data(data)
            .enter()
            .append("path")
                .attr("class", "text-path")
                .attr("id", (d, i) => `text-path-${i}`)
                .attr("d", arc.innerRadius(70).outerRadius(70))
    seasonWheel.selectAll("text")
            .data(data)
            .enter()
            .append("text")
                .append("textPath")
                    .attr("xlink:href", (d, i) => `#text-path-${i}`)
                    .attr("startOffset", "25%")
                    .style("text-anchor", "middle")
                    .text(d => d.data.key);
}

/**
 * Creates a time wheel for selection with seasons and times
 */
function timeWheel(){
    const seasons = ctx.seasons;
    const times = d3.range(6, 26).map(hour => `${hour % 24}:00`);

    const size = 300;
    const radius = size / 2;

    const wheel = d3.select("#seasonWheel")
        .append("svg")
            .attr("width", size)
            .attr("height", size)
        .append("g")
            .attr("transform", `translate(${radius}, ${radius})`);

    const colorSeason = d3.scaleOrdinal()
        .domain(seasons)
        .range(["#36ab57", "#ffbf00", "#ff570a", "#32cbff"]);

    const pie = d3.pie()
        .value(1);

    const seasonData = pie(seasons.map(season => ({key: season, value: 1})));
    const timeData = pie(times.map(time => ({key: time, value: 1})));

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius/2)

    const outerArc = d3.arc()
        .innerRadius(radius / 2)
        .outerRadius(radius)

    // Draw seasons
    wheel.selectAll("path.season")
        .data(seasonData)
        .enter()
        .append("path")
            .attr("class", "season")
            .attr("d", arc)
            .attr("fill", d => colorSeason(d.data.key))
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .style("opacity", 0.3)
            .on("mouseover", function(){
                d3.select(this).style("opacity", 1);
            })
            .on("mouseout", function(){
                const season = d3.select(this).data()[0].data.key;
                const index = seasons.indexOf(season);
                if(!ctx.SELECTED_SEASON[index]){
                    d3.select(this).style("opacity", 0.3);
                }
            })
            .on("click", function(){
                // If season already selected, change opacity to 0.7. Else change to 1
                const season = d3.select(this).data()[0].data.key;
                const index = seasons.indexOf(season);

                d3.select(this).style("opacity", ctx.SELECTED_SEASON[index] ? 0.7 : 1);
                ctx.SELECTED_SEASON[index] = !ctx.SELECTED_SEASON[index];
                filterFish();
                updateRadarChart();
            })

    // Draw times
    wheel.selectAll("path.time")
        .data(timeData)
        .enter()
        .append("path")
            .attr("class", "time")
            .attr("d", outerArc)
            .attr("fill", "#bebebe")
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .style("opacity", 0.3)
            .on("mouseover", function(){
                d3.select(this).style("opacity", 1);
            })
            .on("mouseout", function(){
                const time = d3.select(this).data()[0].data.key;
                const index = times.indexOf(time);
                if(!ctx.SELECTED_TIME[index]){
                    d3.select(this).style("opacity", 0.3);
                }
            })
            .on("click", function(){
                // If time already selected, change opacity to 0.7. Else change to 1
                const time = d3.select(this).data()[0].data.key;
                const index = times.indexOf(time);

                d3.select(this).style("opacity", ctx.SELECTED_TIME[index] ? 0.7 : 1);
                ctx.SELECTED_TIME[index] = !ctx.SELECTED_TIME[index];
                filterFish();
            });

    // Add season labels
    wheel.selectAll("path.season-text-path")
        .data(seasonData)
        .enter()
        .append("path")
            .attr("class", "season-text-path")
            .attr("id", (d, i) => `season-text-path-${i}`)
            .attr("d", arc.innerRadius(radius/4).outerRadius(radius/4))
    wheel.selectAll("text.season-text")
        .data(seasonData)
        .enter()
        .append("text")
            .append("textPath")
                .attr("xlink:href", (d, i) => `#season-text-path-${i}`)
                .attr("startOffset", "25%")
                .style("text-anchor", "middle")
                .text(d => d.data.key);

    // Add time labels
    wheel.selectAll("text.time-text")
        .data(timeData)
        .enter()
        .append("text")
            .attr("class","time-text")
            .attr("transform", d => `translate(${outerArc.centroid(d)})`)
            .attr("dy", "0.35em")
            .style("text-anchor", "middle")
            .text(d => d.data.key);
}

/**
 * Same as isFishMatch but without the time filter
 * @param {*} fish 
 * @returns true if the fish matches all the selected filters 
 */
function isFishMatchNoTime(fish){
    const matchesArea = ctx.SELECTED_AREAS ? ctx.SELECTED_AREAS.every(area => fish.location.includes(area)) : true;
    const matchesSeason = ctx.SELECTED_SEASON.every((selected, index) => {
        return selected ? fish.seasons.includes(ctx.seasons[index]) : true;
    });
    const matchesWeather = fish.weather.includes(ctx.SELECTED_WEATHER) || fish.weather.includes("Any")  || ctx.SELECTED_WEATHER == "Any";
    return matchesArea && matchesSeason && matchesWeather;
}

/**
 * Computes the hourly possible profit for a given hour, season
 * @param {*} hour  the hour to compute the profit for
 * @param {*} season the season to compute the profit for
 * @returns the hourly profit
 */
function computeHourlyProfit(hour, season, locations, weather){
    // TODO: Only compute for fishes that are available in the given season
    let total = 0;
    // console.log("compute hourly profit", hour, season, locations, weather);
    const fishPerHour = 2; // A player can fish about 2 fishes per game hour
    locations.forEach(location => {
        weather.forEach(weather => {
            let chances = ctx.fish_chances[location + "_" + season + "_" + weather];
            chances = chances[hour];
            let profit = 0;

            // chances column is weather, season, fish1, fish2, fish3, ...
            let fishCount = 0;
            Object.keys(chances).forEach(row => {
                if(row == "weather" || row == "season") return;
                let fish = row;
                let chance = chances[row];
                let fishData = ctx.FISH_DATA.find(f => f.name == fish);
                if(fishData && !isFishMatchNoTime(fishData)) return;
                // if(location == "Secret_Woods_Pond") console.log("fish", fish, "chance", chance, "fishData", fishData);
                if(!fishData){
                    if (fish == "Green Algae"){
                        let price = 15;
                        profit += price * chance;
                        fishCount++;
                    } else {
                        return;
                    }
                } else {
                    let price = fishData.basePrice;
                    profit += price * chance;
                    fishCount++;
                }
            })
            if(profit > 0)
                total += profit / fishCount * fishPerHour;
        });
        if(location == "Secret_Woods_Pond") console.log("total", total);
    })

    return total; // Placeholder
}

/**
 * Creates a radar chart to display the hourly profit for each season
 * @param {*} seasons the seasons to display the profit for
 * @param {*} locations the locations to display the profit for
 * @param {*} weather the weather to display the profit for
 */
function fishAveragePricePerTime(seasons=ctx.seasons, locations=ctx.locations, weather=["Sun", "Rain"]){
    const times = ["600", "100", "0", "2300", "2200", "2100", "1900", "1800", "1700", "1600", "1500", "1400", "1300", "1200", "1100", "1000", "900", "800", "700"];

    const data = [];
    seasons.forEach(season => {
        point = {}
        times.forEach(hour => {
            const gameHour = parseInt(hour);
            point[hour] = computeHourlyProfit(gameHour, season, locations, weather);
        });
        data.push(point);
    });

    // console.log("chart", data);

    maxValue = d3.max(data.map(season => d3.max(Object.values(season))));
    let width = 600;
    let height = 600;
    let svg = d3.select("#radarChart").append("svg")
    .attr("width", width)
    .attr("height", height);

    let radialScale = d3.scaleLinear()
    .domain([0,maxValue])
    .range([0,250]);
    let ticks = [maxValue/4,maxValue/2,3*maxValue/4,maxValue];

    // Create "axis" circles
    svg.selectAll("circle")
        .data(ticks)
        .join(
            enter => enter.append("circle")
                .attr("cx", width/2)
                .attr("cy", height/2)
                .attr("fill", "none")
                .attr("stroke", "grey")
                .attr("r", d => radialScale(d))
        )

    function angleToCoordinate(angle, value){
            let x = Math.cos(angle) * radialScale(value);
            let y = Math.sin(angle) * radialScale(value);
            return {"x": width / 2 + x, "y": height / 2 - y};
    }

    svg.selectAll(".ticklabel")
        .data(ticks)
        .join(
            enter => enter.append("text")
            .attr("class", "ticklabel")
            .attr("x", width/2 + 5)
            .attr("y", d => height/2 - radialScale(d))
            .attr("dy", "1em")
            .text(d => parseInt(d).toString())
                .attr("fill", "grey")
                .attr("font-size", "10px")
        )

    // Plot axes
    const features = times;
    const featureData = features.map((d, i) => {
        let angle = (Math.PI/2) + (2 * Math.PI * i / features.length);
        return {
            name: d,
            angle: angle,
            line_coord: angleToCoordinate(angle, maxValue),
            label_coord: angleToCoordinate(angle, maxValue + 0.5)
        }
    })

    // draw axes lines
    svg.selectAll("line")
        .data(featureData)
        .join(
            enter => enter.append("line")
                .attr("x1", width/2)
                .attr("y1", height/2)
                .attr("x2", d => d.line_coord.x)
                .attr("y2", d => d.line_coord.y)
                .attr("stroke", "lightgrey")
        )

    // draw axes labels
    svg.selectAll(".axislabel")
        .data(featureData)
        .join(
            enter => enter.append("text")
                .attr("x", d => d.label_coord.x)
                .attr("y", d => d.label_coord.y)
                .attr("text-anchor", d => {
                    if(d.angle > Math.PI / 2 && d.angle < 3 * Math.PI / 2){
                        return "end";
                    } else {
                        return "start";
                    }
                })
                .attr("dy", d => {
                    if(d.angle > Math.PI && d.angle < 2 * Math.PI){
                        return "1em";
                    } else if(d.angle == 0 || d.angle == Math.PI){
                        return "0.5em";
                    } else {
                        return "-0.5em";
                    }
                })
                .text(d =>  formatTime(d.name))
        )

    let line = d3.line()
        .x(d => d.x)
        .y(d => d.y);

    let colors = d3.scaleOrdinal()
        .domain(ctx.seasons)
        .range(["#00FF00", "#FFD700", "#FF8C00", "#1E90FF"]);

    function getPathCoordinates(data_point){
        let coordinates = [];
        for (var i = 0; i < features.length; i++){
            let ft_name = features[i].toString();
            let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
            coordinates.push(angleToCoordinate(angle, data_point[ft_name]));
        }
        coordinates.push(coordinates[0]);
        return coordinates;
    }

    svg.selectAll("path")
        .data(data)
        .join(
            enter => enter.append("path")
                .datum(d => getPathCoordinates(d))
                .attr("d", line)
                .attr("stroke-width", 2)
                .attr("stroke", (d, i) => colors(seasons[i]))
                .attr("fill", "none")
                .append("title")
                .text((d, i) => seasons[i])
        );

    function formatTime(hour){
        const hourInt = parseInt(hour);
        const formattedHour = hourInt%2400;
        const hourPart = Math.floor(formattedHour / 100);
        return `${hourPart}:00`;
    }
}

/**
 * Updates the radar chart with the selected filters
 */
function updateRadarChart(){
    d3.select("#radarChart").select("svg").remove();
    let selectedSeason = ctx.seasons.map((season, index) => ctx.SELECTED_SEASON[index] ? season : null).filter(season => season);
    if (selectedSeason.length == 0) selectedSeason = ctx.seasons;
    let selectedAreas = ctx.SELECTED_AREAS;
    if (selectedAreas.length == 0) selectedAreas = ctx.locations;
    let selectedWeather = [ctx.SELECTED_WEATHER];
    if(ctx.SELECTED_WEATHER == "Any") selectedWeather = ["Sun", "Rain"];
    fishAveragePricePerTime(selectedSeason, selectedAreas, selectedWeather);
}


function handleWeatherSelection(){
    d3.selectAll(".weather-btn").on("click", function(){
        const selectedWeather = d3.select(this).attr("data-weather");
        if(ctx.SELECTED_WEATHER == selectedWeather){
            ctx.SELECTED_WEATHER = "Any";
            d3.select(this).classed("selected", false);
        } else {
            ctx.SELECTED_WEATHER = selectedWeather;
            d3.selectAll(".weather-btn").classed("selected", false);
            d3.select(this).classed("selected", true);
        }
        filterFish();
        updateRadarChart();
    });
}

function createXPDifficultyScatter(data){
    const margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    d3.select("#scatterplot").select("svg").remove();
    // append the svg object to the body of the page
    const svg = d3.select("#scatterplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Add X axis
    const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.difficulty) + 5])
    .range([ 0, width ]);

    svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

    // Add Y axis
    const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.baseXP) + 5])
    .range([ height, 0]);

    svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

    // Add dots
    let dots = svg.append('g')
    .selectAll("dot")
    .data(data)
    .join("circle")
        .attr("class", d => "dot-" + d.name)
        .attr("cx", d =>  x(d.difficulty))
        .attr("cy", d => y(d.baseXP) )
        .attr("r", 2)
        .style("fill", "#69b3a2")
    dots.append("title")
        .text(d => d.name + ": " + d.baseXP + " XP");

    // Add images
    let images = svg.append('g')
        .selectAll("image")
        .data(data)
        .join("image")
            .attr("xlink:href", d => `data/images/fish/${d.name.replace(/ /g, "_")}.png`)
            .attr("x", d => x(d.difficulty) - 7.5)
            .attr("y", d => y(d.baseXP) - 7.5)
            .attr("width", 15)
            .attr("height", 15)
            .style("display", "none")
        images.append("title")
                .text(d => d.name + ": " + d.baseXP + " XP");

    d3.select("#toggleFish").on("click", function(){
        const isDotVisible = dots.style("display") != "none";
        dots.style("display", isDotVisible ? "none" : null);
        images.style("display", isDotVisible ? null : "none");
        d3.select(this).text(isDotVisible ? "Switch to Points" : "Switch to Images");
    });
}

function updateXPDifficultyScatter(data){
    const margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#scatterplot").select("svg").select("g");

    let trans = d3.transition().duration(750);
    // Axis
    const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.difficulty) + 5])
    .range([ 0, width ]);

    const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.baseXP) + 5])
    .range([ height, 0]);

    svg.select(".x-axis")
        .transition(trans)
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    svg.select(".y-axis")
        .transition(trans)
        .call(d3.axisLeft(y));

    let circles = svg.selectAll("circle")
        .data(data, d => d.name);

    circles.enter()
        .append("circle")
        .attr("class", d => "dot-" + d.name)
        .attr("cx", d =>  x(d.difficulty))
        .attr("cy", d => y(d.baseXP) )
        .attr("r", 0)
        .style("fill", "#69b3a2")
        .transition(trans)
        .attr("r", 2)

    circles.transition(trans)
        .attr("cx", d =>  x(d.difficulty))
        .attr("cy", d => y(d.baseXP) )
        .attr("r", 2)
        .style("fill", "#69b3a2")

    circles.exit()
        .transition(trans)
        .attr("r", 0)
        .remove();

    circles.append("title")
        .text(d => d.name + ": " + d.baseXP + " XP");
}

function createProfitBarChart(data){
    d3.select("#profitBarChart").select("svg").remove();
    const margin = { top: 20, bottom:20, left: 20, right:20}
    width = 400 - margin.left - margin.right;
    height = 400 - margin.top - margin.bottom;

    let svg = d3.select("#profitBarChart")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.profit)])
        .range([0, width]);

    let y = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, height])
        .padding(0.1);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y));

    // Bars
    svg.selectAll("myRect")
        .data(data)
        .enter()
        .append("rect")
            .attr("x", x(0))
            .attr("y", d => y(d.name))
            .attr("width", d => x(d.profit))
            .attr("height", y.bandwidth())
            .attr("fill", "#69b3a2")
}

function updateProfitBarChart(){
    let selectedSeason = ctx.seasons.map((season, index) => ctx.SELECTED_SEASON[index] ? season : null).filter(season => season);
    if (selectedSeason.length == 0) selectedSeason = ctx.seasons;

    let selectedWeather = [ctx.SELECTED_WEATHER];
    if(ctx.SELECTED_WEATHER == "Any") selectedWeather = ["Sun", "Rain"];

    let selectedTime = ctx.SELECTED_TIME.map((selected, index) => selected ? index + 6 : null).filter(time => time != null);
    if (selectedTime.length == 0) selectedTime = d3.range(6, 26);

    for(let i = 0 ; i < selectedTime.length; i++){
        selectedTime[i] = selectedTime[i].toString();
        if(selectedTime[i] == "24") selectedTime[i] = "0";
        else if(selectedTime[i] == "25") selectedTime[i] = "100";
        else {
            selectedTime[i] = selectedTime[i] + "00";
        }
    }

    const data = ctx.locations.map(location => {
        let totalProfit = 0;
        selectedSeason.forEach(season => {
            selectedTime.forEach(time => {
                selectedWeather.forEach(weather => {
                    totalProfit += computeHourlyProfit(time, [season], [location], [weather]);
                })
            })
        });
        return {
            name: location,
            profit: totalProfit
        }
    })
    console.log("data", data);
    createProfitBarChart(data);
}