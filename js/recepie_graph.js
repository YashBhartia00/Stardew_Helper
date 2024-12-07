// Initialize SVG canvas
function initSvg() {
    const width = 1200;
    const height = 720;
    const svg = d3.select('svg')
        .attr('width', width)
        .attr('height', height);
    return { svg, width, height };
}

// Define arrow markers
function defineArrowMarkers(svg) {
    svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 23) // Adjust refX based on your node size
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 13)
        .attr('markerHeight', 13)
        .attr('xoverflow', 'visible')
      .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#999')
        .style('stroke', 'none');
}

// Load ingredient data and create type-color mapping
function loadIngredientData(nodes, callback) {
    d3.csv('data/recepies/ingredient_data.csv').then(function(ingredientData) {
        const typeColor = d3.scaleOrdinal(d3.schemeCategory10);
        const ingredientTypeMap = {};
        ingredientData.forEach(d => {
            ingredientTypeMap[d.name] = d.type;
        });

        // Get unique types and create type nodes
        const types = [...new Set(ingredientData.map(d => d.type))];
        types.forEach(type => {
            nodes[type] = { id: type, group: 'type', type: type };
        });

        callback(ingredientData, ingredientTypeMap, typeColor);
    });
}

// Load main data and process nodes and links
function loadMainData(nodes, links, ingredientData, ingredientTypeMap, typeColor, callback) {
    d3.csv('data/recepies/graph_data.csv').then(function(data) {
        // Create nodes and links from the data
        data.forEach(d => {
            // Add recipe nodes
            if (!nodes[d.recepie]) nodes[d.recepie] = { id: d.recepie, group: 'recepie' };
            // Add ingredient nodes
            if (!nodes[d.ingredient]) nodes[d.ingredient] = { id: d.ingredient, group: 'ingredient', type: ingredientTypeMap[d.ingredient] };
            // Add links from recipes to ingredients
            links.push({ source: d.recepie, target: d.ingredient, value: +d.amount });
        });

        // Add links from type nodes to ingredient nodes
        ingredientData.forEach(d => {
            if (nodes[d.name]) {
                links.push({
                    source: d.type,
                    target: d.name,
                    value: 1
                });
            }
        });

        // Convert nodes object to array
        const nodesArray = Object.values(nodes);

        // Create an index for quick lookup of connections
        const linkedByIndex = {};
        links.forEach(d => {
            linkedByIndex[`${d.source.index},${d.target.index}`] = true;
        });

        callback(nodesArray, links, linkedByIndex);
    });
}

// Create simulation
function createSimulation(width, height) {
    const simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));
    return simulation;
}

// Add zoom functionality
function addZoom(svg, g) {
    const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on('zoom', function(event) {
            g.attr('transform', event.transform);
        });
    svg.call(zoom);
}
var opacityHighlight = 0.8;
// Create nodes and links
function createNodesAndLinks(g, nodesArray, links, typeColor, linkedByIndex, simulation) {
    // Add the links
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('class', 'link')
        .attr('marker-end', 'url(#arrowhead)')
        .attr('stroke-width', d => d.value)
        .attr('stroke', '#999')
        .style('opacity', opacityHighlight);

    // Add the nodes as groups
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodesArray)
        .enter().append('g')
        .style('opacity', opacityHighlight)
        .call(d3.drag()
            .on('start', defineDrag.dragstarted)
            .on('drag', defineDrag.dragged)
            .on('end', defineDrag.dragended));

    // Append images to ingredient and recipe nodes
    node.filter(d => d.group === 'ingredient' || d.group === 'recepie')
        .append('image')
        .attr('xlink:href', d => `data/images/recepies_ingredients/${d.id}.png`)
        .attr('x', -16)
        .attr('y', -16)
        .attr('width', 32)
        .attr('height', 32);

    // Append circles for outlines
    node.append('circle')
        .attr('r', d => d.group === 'type' ? 30 : 16)
        .attr('stroke', d => typeColor(d.type))
        .attr('fill', d => {
            if (d.group === 'type') return typeColor(d.type);
            else if (d.group === 'recepie') return 'none';
            else return 'none';
        })
        .attr('stroke-width', 2);

    // For type nodes, add text labels
    node.filter(d => d.group === 'type')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .text(d => d.id)
        .attr('pointer-events', 'none')
        .attr('fill', '#fff');

    // Add hover interactions
    node.on('mouseover', defineHover.focus)
        .on('mouseout', defineHover.unfocus);

    // Add click event to type nodes to cluster ingredient nodes
    node.filter(d => d.group === 'type')
        .on('click', function(event, typeNode) {
            // On click, apply forces to attract ingredient nodes of this type
            simulation.force('x', d3.forceX(typeNode.x)
                .strength(d => d.type === typeNode.type ? 0.5 : 0));
            simulation.force('y', d3.forceY(typeNode.y)
                .strength(d => d.type === typeNode.type ? 0.5 : 0));

            simulation.alpha(0.5).restart();
        });

    return { node, link };
}

// Define drag interactions
function defineDrag(simulation) {
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

    return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
}

// Define hover interactions
function defineHover(node, link, linkedByIndex) {
    // Function to check if two nodes are connected
    function isConnected(a, b) {
        return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
    }

    // Focus and unfocus functions for hover interactions
    function focus(event, d) {
        const index = d.index;
        node.style('opacity', o => isConnected(d, o) ? opacityHighlight : opacityDim);
        link.style('opacity', o => o.source.index === index || o.target.index === index ? opacityHighlight : opacityDim);
    }

    function unfocus() {
        node.style('opacity', opacityHighlight);
        link.style('opacity', opacityHighlight);
    }

    node.on('mouseover', focus)
        .on('mouseout', unfocus);
}

// Main execution
const { svg, width, height } = initSvg();
defineArrowMarkers(svg);
const g = svg.append('g');

// Declare nodes and links in the main scope
const nodes = {};
const links = [];

loadIngredientData(nodes, function(ingredientData, ingredientTypeMap, typeColor) {
    loadMainData(nodes, links, ingredientData, ingredientTypeMap, typeColor, function(nodesArray, links, linkedByIndex) {
        const simulation = createSimulation(width, height);
        addZoom(svg, g);
        const { node, link } = createNodesAndLinks(g, nodesArray, links, typeColor, linkedByIndex, simulation);
        node.call(defineDrag(simulation));
        defineHover(node, link, linkedByIndex);

        // Initialize the simulation
        simulation
            .nodes(nodesArray)
            .on('tick', function() {
                link
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);

                node.attr('transform', d => `translate(${d.x},${d.y})`);
            });

        simulation.force('link')
            .links(links)
            .distance(100)
            .strength(0.5);
    });
});