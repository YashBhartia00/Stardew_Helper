const ctx = {
    MAP_W: 800,
    MAP_H: 600,
}

function createViz(){
    d3.select("mapContainer").append("svg")
                            .attr("width", ctx.MAP_W)
                            .attr("height", ctx.MAP_H)
    loadData();
}

function loadData(){
    const files = [
        "data/fish_detail.csv",
        "data/fish_price_breakdown.csv",
        "data/crabpotandothercatchables.csv",
    ]

    let promises = files.map(url => d3.csv(url))
    Promise.all(promises).then(function(data){
        addFishToList(data[0]);
        ctx.fish_price_breakdown = data[1];
    })
}

function addFishToList(fish){
    const container = d3.select("#fishList");
    fish.forEach(f => {
        let li = container.append("li").text(f.Name);
        li.on("click", function(){
            displayFishInfo(f);
        })
    })
}

function displayFishInfo(fish){
    const overlay = d3.select("body").append("div").attr("id", "fishInfoOverlay");
    const container = overlay.append("div").attr("id", "fishInfo");

    // Close Icon
    container.append("div")
    .attr("id", "close")
    .text("X")
    .on("click", function() {
        overlay.remove(); // Close the container on close
    });


    // Add fish name
    container.append("div")
    .attr("id", "fishName")
    .text(fish.Name);

    const contentContainer = container.append("div").attr("id", "fishInfoContent");


    // Left section with fish name and image
    const leftSection = contentContainer.append("div").attr("class", "page-left")


    // Add Image and motif
    const imageContainer = leftSection.append("div").attr("id", "fishImageContainer");
    imageContainer.append("img")
        .attr("src", `data/images/fish/${fish.Name.replace(/ /g, "_")}.png`);
    imageContainer.append("div")
        .attr("id", "fishMinigame");


    // Set fish description
    leftSection.append("div")
    .attr("class", "page-description")
    .text(fish.Description);

    // Right section
    const rightSection = contentContainer.append("div").attr("class", "page-right");
    
    // Create table for fish info
    const table = rightSection.append("table")
        .attr("id", "fishInfoTable");
    const tbody = table.append("tbody");

    const info = [
        { label: "Location", value: fish.Location },
        { label: "Time", value: fish.Time },
        { label: "Season", value: fish.Season },
        { label: "Weather", value: fish.Weather },
        { label: "Base XP", value: fish.BaseXP }
    ]

    info.forEach(i => {
        const row = tbody.append("tr");
        row.append("th").text(i.label);
        row.append("td").text(i.value);
    });

    // Add price breakdown in grouped bar chart, price depending on quality. different bars represent profession
    const priceBreakdown = rightSection.append("div")
        .attr("id", "priceBreakdown");
    priceBarChart("#priceBreakdown", fish.Name);
}




function myFilter() {
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('fishSearch');
    filter = input.value.toUpperCase();
    ul = document.getElementById("fishList");
    li = ul.getElementsByTagName('li');
    for (i = 0; i < li.length; i++) {
        a = li[i];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}


function priceBarChart(selector, fishName){
    let margin = {top: 10, right: 30, bottom: 20, left: 50},
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