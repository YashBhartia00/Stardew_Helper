const ctx = {
    W: 1200,
    H: 500,
    crops: [],
    seasons: ["Spring", "Summer", "Fall", "Winter"],
    selected_season: "Spring",
    switchChart: false
}


function createVizCrops(){
    loadCrops();
    document.querySelectorAll('.season-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.season-button').forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected')
            ctx.selected_season = this.innerText;
            if(!ctx.switchChart){
                updateChartText();
            } else {
                d3.select("#chart").select("svg").remove();
                createRankingChart();
            }
        })
    })
    document.getElementsByClassName('switch-viz-button')[0].addEventListener('click', switchChart);
}

function switchChart(){
    ctx.switchChart = !ctx.switchChart;
    d3.select("#chart").select("svg").remove();
    if(ctx.switchChart){
        document.getElementsByClassName('switch-viz-text')[0].innerText = "Switch to profit per day visualisation";
        d3.select("#chart h2").text("Ranking of crops on " + ctx.selected_season);
        document.getElementById("day").style.display = "none";
        createRankingChart();
    }else{
        document.getElementsByClassName('switch-viz-text')[0].innerText = "Switch to Ranking visualization";
        document.getElementById("day").style.display = "flex";
        d3.select("#chart h2").text("Profit from planting crops on day "+ document.getElementById("dayFilter").value +" of " + ctx.selected_season);
        createChart();
    }
}

function loadCrops(){
    d3.csv("data/crops.csv").then(function(crop){
        processCropData(crop);
        createChart();
    });
}

function updateChartText(){
    value = document.getElementById("dayFilter").value;
    document.getElementById("dayValue").innerText = value;
    document.querySelector("#chart h2").innerText = "Profit from planting crops on day " + value + " of " + ctx.selected_season;
    updateChart();
}

function updateRankingChartText(){
    document.querySelector("#chart h2").innerText = "Ranking of crops on " + ctx.selected_season;
    updateRankingChart();
}

function processCropData(crop){
    let cropData = [];
    crop.forEach(function(d){
        cropData.push({
            crop: d.Name.trim().replace(/\s/g, "_"),
            price: parseInt(d["Price (Regular)"]),
            growthTime: parseInt(d["Growth Time (In Days)"]),
            reGrowthTime: parseInt(d["Regrowth Time (In Days)"]),
            season: d.Season.split(",").map(s => s.trim()),
            seedPrice: d["Seed Price"],
        });
    });
    ctx.crops = cropData;
}

function getNextSeason(curr_season){
    let idx = ctx.seasons.indexOf(curr_season);
    return ctx.seasons[(idx + 1) % 4];
}

function computeProfit(crop, current_day){
    // The general formula is: Minimum Gold per Day = ((Max Harvests × Sell Price per Harvest) − Seed Price) / Growing Days
    // Growing Days = Days to Maturity + ((Max Harvests − 1) × Days to Regrow)
    // Days to Maturity and Days to Regrow are listed in each table.
    // Max Harvests is normally 1, but for crops that continue to produce, it is the actual number of harvests that can be obtained in the growing season(s).
    // Sell Price per Harvest is normally the same as the Sell Price of one normal-quality crop. Extra crops are not counted since their occurrence is rare, except in the case of potatoes. The chance of an extra potato is ≈25%, much higher than with any other crop. Thus, the Sell Price per Harvest is 1.25 × 80 instead of 1 × 80.
    // In the case of plants that always give >1 item per harvest (e.g., Coffee Bean, Blueberry, Cranberries) the Sell Price per Harvest = # of crops per Harvest × Sell Price for one item.
    let current_season = ctx.selected_season; 
    let price = 0;
    let harvest_seasons = crop.season;
    let next_season = getNextSeason(current_season);

    deadline = 28;
    cpt = 0; // To avoid infinite loop in case of cactus fruit
    while(harvest_seasons.includes(next_season) && cpt < 4){
        deadline += 28;
        next_season = getNextSeason(next_season);
        cpt++;
    }

    if(current_day - 1 + crop.growthTime <= deadline){
        price = crop.price;
        if (!isNaN(crop.reGrowthTime)){ // Multiple harvests
            let harvests = Math.floor((deadline - current_day + crop.growthTime) / crop.reGrowthTime); // Number of harvests possible
            price += harvests * crop.price;
        }
    }
    
    return price - crop.seedPrice;
}


function updateChart(){
    let season = ctx.selected_season;
    let profit = [];
    let crops = ctx.crops;

    crops.forEach(function(crop){
        if(crop.season.includes(season)){
            let current_day = parseInt(document.getElementById("dayValue").innerText);
            profit.push({
                crop: crop.crop,
                value: computeProfit(crop, current_day)
            });
        }
    });

    // Translate bars to their new position
    let margin = {top: 30, right: 30, bottom: 100, left: 60}
    width = ctx.W - margin.left - margin.right,
    height = ctx.H - margin.top - margin.bottom;

    let svg = d3.select("#chart").select("svg").select("g");


    let x = d3.scaleBand()
    .range([0, width])
    .domain(profit.map(function(d) { return d.crop; }))
    .padding(0.2);

    let x_crops = d3.scaleBand()
        .range([0, width])
        .domain(profit.map(function(d) { return d.crop.replace(/_/g, " "); }))
        .padding(0.2);

    let [min, max] = d3.extent(profit, function(d) { return d.value; });
    if (min == max){
        min > 0 ? min = 0 : max = 0;
    }
    let y = d3.scaleLinear()
        .domain([min, max])
        .range([height, 0]);

    let trans = svg.transition().duration(1000);

    svg.select(".x-axis")
        .transition(trans)
        .attr("transform", "translate(0," + y(0) + ")")
        .call(d3.axisBottom(x_crops))
        .selectAll("text")
            .attr("transform", "translate(-15,10)rotate(-70)")
            .style("text-anchor", "end")

    svg.select(".y-axis")
        .transition(trans)
        .call(d3.axisLeft(y));
    
    // Softly update the bars

    let posBars = svg.select(".pos").selectAll("rect")
        .data(profit.map(d => d.value >= 0 ? d : {crop: d.crop, value: 0}));
    
    posBars.enter()
        .append("rect")
        .attr("x", d => x(d.crop))
        .attr("y", y(0))
        .attr("height", 0)
        .attr("width", x.bandwidth())
        .attr("fill", "#90EE90")
        .call(enter => enter.append("title").text(d => d.value + "g"))
        .merge(posBars)
        .transition(trans)
        .attr("x", d => x(d.crop))
        .attr("y", d => y(d.value))
        .attr("height", d => y(0) - y(d.value))
        .attr("width", x.bandwidth())
        .select("title")
            .text(d => d.value + "g");

    posBars.exit()
        .transition(trans)
        .attr("y", y(0))
        .attr("height", 0)
        .remove();

    let negBars = svg.select(".neg").selectAll("rect")
        .data(profit.map(d => d.value < 0 ? d : {crop: d.crop, value: 0}))

    negBars.enter()
        .append("rect")
        .attr("x", d => x(d.crop))
        .attr("y", y(0))
        .attr("height", 0)
        .attr("width", x.bandwidth())
        .attr("fill", "#FF7F7F")
        .call(enter => enter.append("title").text(d => d.value + "g"))
        .merge(negBars)
        .transition(trans)
        .attr("x", d => x(d.crop))
        .attr("y", y(0))
        .attr("height", d => y(d.value) - y(0))
        .attr("width", x.bandwidth())
        .select("title")
            .text(d => d.value + "g");

    negBars.exit()
        .transition(trans)
        .attr("y", y(0))
        .attr("height", 0)
        .remove();
}


function createChart(){
    let season = ctx.selected_season; 
    let crops = ctx.crops;
    let profit = [];

    crops.forEach(function(crop){
        if(crop.season.includes(season)){
            let current_day = parseInt(document.getElementById("dayValue").innerText);
            profit.push({
                crop: crop.crop,
                value: computeProfit(crop, current_day)
            });
        }
    });


    // console.log(profit);

    let margin = {top: 30, right: 30, bottom: 100, left: 60}
    width = ctx.W - margin.left - margin.right,
    height = ctx.H - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
            .attr("width", ctx.W)
            .attr("height", ctx.H)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    let x = d3.scaleBand()
        .range([0, width])
        .domain(profit.map(function(d) { return d.crop; }))
        .padding(0.2);

    let [min, max] = d3.extent(profit, function(d) { return d.value; });
    if (min == max){
            min > 0 ? min = 0 : max = 0;
    }
    let y = d3.scaleLinear()
        .domain([min, max])
        .range([height, 0]);
    
    let x_crops = d3.scaleBand()
        .range([0, width])
        .domain(profit.map(function(d) { return d.crop.replace(/_/g, " "); }))
        .padding(0.2);


    let transition = svg.transition().duration(1000).ease(d3.easePoly);
    // Positive values
    svg.append("g")
        .attr("class", "pos")
        .selectAll("rect")
        .data(profit.map(d => d.value > 0 ? d : {value: 0}))
        .join("rect")
            .attr("x", d => x(d.crop))
            .attr("y", d => y(0))
            .attr("height", 0)
            .attr("width", x.bandwidth())
            .attr("fill", "#90EE90")
            .transition(transition)
                .attr("y", d => y(d.value))
                .attr("height", d => y(0) - y(d.value))
            .selection()
            .append("title")
                .text(d => d.value + "g");

    // Negative values
    svg.append("g")
        .attr("class", "neg")
        .selectAll("rect")
        .data(profit.map(d => d.value <= 0 ? d : {value: 0}))
        .join("rect")
            .attr("x", d => x(d.crop))
            .attr("y", y(0))
            .attr("height", 0)
            .attr("width", x.bandwidth())
            .attr("fill", "#FF7F7F")
            .transition(transition)
                .attr("height", d => y(0) - y(-d.value))
            .selection()
            .append("title")
                .text(d => d.value + "g");

    svg.append("g")
        .attr("transform", "translate(0," + y(0) + ")")
        .attr("class", "x-axis")
        .call(d3.axisBottom(x_crops))
        .selectAll("text")
            .attr("transform", "translate(-15,10)rotate(-70)")
            .style("text-anchor", "end")

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));
}

/**
 * @function createRankingChart
 * @description Creates a ranking slop chart
 */
function createRankingChart(){
    let profit = {};
    let season = ctx.selected_season; 
    let crops = ctx.crops;

    // filter crops by season
    crops = crops.filter(crop => crop.season.includes(season));

    crops.forEach(function(crop){
        for(let day = 1; day <= 28; day++){
            let p = computeProfit(crop, day);
            if(!(day in profit)){
                profit[day] = [];
            }
            profit[day].push({crop: crop.crop, value: p});
        }
    });

    // Sort profit data
    Object.keys(profit).forEach(day => {
        profit[day].sort((a, b) => b.value - a.value);
    })


    let margin = {top: 30, right: 30, bottom: 70, left: 60}
    width = ctx.W - margin.left - margin.right,
    height = ctx.H - margin.top - margin.bottom;

    let days = Array.from({length: 28}, (v, i) => i + 1);
    let ranking = Array.from({length: crops.length}, (v, i) => {
        if(i == 0) return "1st";
        if(i == 1) return "2nd";
        return i+1 + "th"
    });


    const x = d3.scalePoint()
        .domain(days)
        .range([0, width])
        .padding(0.5);

    const y = d3.scalePoint()
        .domain(crops.map(c => c.crop))
        .range([margin.top, height])
        .padding(0.5);

    const display = d3.scalePoint()
        .domain(ranking)
        .range([margin.top, height])
        .padding(0.5);

    const svg = d3.select("#chart")
        .append("svg")
            .attr("width", ctx.W)
            .attr("height", ctx.H)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    trans = svg.transition().duration(1000);
    // axis
    svg.append("g")
        .attr("opacity", 0)
        .attr("class", "x-axis")
        .transition(trans)
        .attr("opacity", 1)
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("opacity", 0)
        .attr("class", "y-axis")
        .transition(trans)
        .attr("opacity", 1)
        .call(d3.axisLeft(display));


    // Maximum of 17 crops
    let colorLine = d3.scaleOrdinal()
        .domain(crops.map(c => c.crop))
        .range(["#393b79","#5254a3","#6b6ecf","#9c9ede","#637939","#8ca252","#b5cf6b","#cedb9c","#8c6d31","#bd9e39","#e7ba52","#e7cb94","#843c39","#ad494a","#d6616b","#e7969c","#7b4173","#a55194","#ce6dbd","#de9ed6"]);
    
    let line = d3.line()
        .x(d => x(d.day))
        .y(d => y(crops[d.rank].crop));
            
    // Draw lines
    const paths = svg.selectAll(".crop-line")
        .data(crops)
        .enter()
        .append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", crop => colorLine(crop.crop))
            .attr("stroke-width", 1.5)
            .attr("d", crop => {
                let lineData = days.map(day => {
                    let dayData = profit[day].find(p => p.crop === crop.crop);
                    return {
                        day: day,
                        rank: profit[day].indexOf(dayData),
                        value: dayData.value
                    };
                });
                return line(lineData);
            });

    // Animate lines
    paths.each(function() {
        const length = this.getTotalLength();
        d3.select(this)
            .attr("stroke-dasharray", length + " " + length)
            .attr("stroke-dashoffset", length)
            .transition()
                .duration(2000)
                .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
    });


    // Add circles and images for each crop
    crops.forEach(crop => {
        let lineData = days.map(day => {
            let dayData = profit[day].find(p => p.crop == crop.crop);
            return {
                day: day,
                rank: profit[day].indexOf(dayData),
                value: dayData.value
            };
        });

        const points = svg.selectAll(".point-" + crop.crop)
            .data(lineData)
            .enter()

        points.append("circle")
            .attr("class", "point-" + crop.crop)
            .attr("cx", d => x(d.day))
            .attr("cy", d => y(crops[d.rank].crop))
            .attr("r", 5)
            .attr("fill", "white")

        points.append("image")
            .attr("class", "crop-image-" + crop.crop)
            .attr("xlink:href", "data/crops/" + crop.crop + ".png")
            .attr("x", d => x(d.day) - 5)
            .attr("y", d => y(crops[d.rank].crop) - 55)
            .attr("width", 10)
            .attr("height", 10)
            .attr("opacity", 0)
            .transition()
                .duration(100)
                .delay((d,i) => i * 100)
                .ease(d3.easeLinear)
            .attr("y", d => y(crops[d.rank].crop) - 5)
            .attr("opacity", 1)
            .selection()
            .append("title")
                .text(d => crop.crop.replace(/_/g, " ") + ": " +d.value + "g");

    });
        
}