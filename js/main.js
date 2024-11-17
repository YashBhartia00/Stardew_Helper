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
    const container = d3.select("#fishInfo").html("");

    // Close Icon
    container.append("div")
    .attr("id", "close")
    .text("X")
    .on("click", function() {
        container.html(""); // Close the container on close
    });

    const contentContainer = container.append("div").attr("id", "fishInfoContent");

    // Left section with fish name and image
    const leftSection = contentContainer.append("div").attr("class", "page-left")

    // Add fish name
    leftSection.append("div")
    .attr("id", "fishName")
    .text(fish.Name);

    // Add Image
    leftSection.append("div")
    .attr("id", "fishImage")
    .append("img")
    .attr("src", `data/images/fish/${fish.Name.replace(/ /g, "_")}.png`);

    // Set fish description
    leftSection.append("div")
    .attr("class", "page-description")
    .text(fish.Description);

    // Right section
    const rightSection = contentContainer.append("div").attr("class", "page-right");

    // Sets Fish info
    rightSection.append("p").text(`Location: ${fish.Location}`);
    rightSection.append("p").text(`Time: ${fish.Time}`);
    rightSection.append("p").text(`Season: ${fish.Season}`);
    rightSection.append("p").text(`Weather: ${fish.Weather}`);
    rightSection.append("p").text(`Size: ${fish.Size}`);
    rightSection.append("p").text(`Difficulty & Behavior: ${fish.Difficulty}`);
    rightSection.append("p").text(`Base XP: ${fish.BaseXP}`);

    // Add price breakdown in grouped bar chart, price depending on quality. different bars represent profession
    const priceBreakdown = d3.select("#fishInfoContent").append("div").attr("id", "priceBreakdown");
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
    var margin = {top: 10, right: 30, bottom: 20, left: 50},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;
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
    console.log(data);

    // fx encodes the fish quality
    const fx = d3.scaleBand()
    .domain(subgroups)
    .range([0, width])
    .padding(0.2);
    

    // Add x encodes the profession
    const x = d3.scaleBand()
    .domain(groups)
    .range([0, fx.bandwidth()])
    .padding(0.05);

    const color = d3.scaleOrdinal()
    .domain(groups)
    .range(d3.schemeSpectral[groups.length]);

    // y encodes the price (height of the bars)
    let y = d3.scaleLinear()
    .domain([0, d3.max(data, d => Math.max(d["BP"], d["FP"], d["AP"]))]).nice()
    .range([height, 0]);

    // Show the bars
    svg.append("g")
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
            .attr("transform", d => "translate(" + fx(d.quality) + ",0)")
        .selectAll("rect")
        .data(d => groups.map(key => ({key: key, value: d[key]})))
        .enter()
        .append("rect")
            .attr("x", d => x(d.key))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.value))
            .style("fill", d => color(d.key))
            .append("title")
                .text(d => `${d.value}g`);
    
    // Add y axis
    svg.append("g")
        .call(d3.axisLeft(y));
    
    // Add x axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(fx).tickSize(0));

    // Add legend
    const legend = svg.append("g")
        .attr("transform", `translate(10, 0)`);

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