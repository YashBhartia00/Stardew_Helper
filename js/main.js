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