// Set the dimensions and margins of the graph
const width = 800;
const height = 600;

// Append the svg object to the body of the page
const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

// Initialize the simulation
const simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(d => d.id))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2));

// Load ingredient data and create type-color mapping
d3.csv("data/recepies/ingredient_data.csv").then(function(ingredientData) {
    const typeColor = d3.scaleOrdinal(d3.schemeCategory10);
    const ingredientTypeMap = {};
    ingredientData.forEach(d => {
        ingredientTypeMap[d.name] = d.type;
    });

    // Load the data
    d3.csv("data/recepies/graph_data.csv").then(data => {
        // Create nodes and links from the data
        const nodes = {};
        const links = data.map(d => {
            if (!nodes[d.recepie]) nodes[d.recepie] = { id: d.recepie, group: "recepie" };
            if (!nodes[d.ingredient]) nodes[d.ingredient] = { id: d.ingredient, group: "ingredient" };
            return { source: d.recepie, target: d.ingredient, value: +d.amount };
        });

        // Update nodes with type information
        data.forEach(d => {
            if (nodes[d.ingredient]) {
                nodes[d.ingredient].type = ingredientTypeMap[d.ingredient];
            }
        });

        // Convert nodes object to array
        const nodesArray = Object.values(nodes);

        // Add zoom functionality
        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on("zoom", zoomed);

        svg.call(zoom);

        function zoomed(event) {
            g.attr("transform", event.transform);
        }

        const g = svg.append("g");

        // Add the links
        const link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .attr("stroke-width", d => Math.sqrt(d.value));

        // Add the nodes as groups
        const node = g.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(nodesArray)
            .enter().append("g")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Append images to the nodes
        node.append("image")
            .attr("xlink:href", d => `data/images/recepies_ingredients/${d.id}.png`)
            .attr("x", -16)
            .attr("y", -16)
            .attr("width", 32)
            .attr("height", 32);

        // Append circles for outlines
        node.append("circle")
            .attr("r", 16)
            .attr("stroke", d => d.group === "ingredient" ? typeColor(d.type) : "#69b3a2")
            .attr("fill", "none")
            .attr("stroke-width", 2);

        // Add labels to the nodes
        const label = g.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodesArray)
            .enter().append("text")
            .attr("dy", -3)
            .text(d => d.id);

        // Apply the simulation to the nodes and links
        simulation
            .nodes(nodesArray)
            .on("tick", ticked);

        simulation.force("link")
            .links(links);

        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);

            label
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        }

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    });
});