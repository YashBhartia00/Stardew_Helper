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
            d.price = +d.price || 0;
        });

        // Get unique types and create type nodes
        const types = [...new Set(ingredientData.map(d => d.type))];
        types.forEach(type => {
            nodes[type] = { id: type, group: 'type', type: type};
        });

        callback(ingredientData, ingredientTypeMap, typeColor);
    });
}

// Load main data and process nodes and links
function loadMainData(nodes, links, ingredientData, ingredientTypeMap, typeColor, callback) {
    d3.csv('data/recepies/graph_data.csv').then(function(data) {
        // Create nodes and links from the data
        data.forEach(d => {
            //use ingredent data as price source as the price is not available in the graph data
            if(!nodes[d.ingredient]) { nodes[d.ingredient] = { id: d.ingredient, group: 'ingredient', type: ingredientTypeMap[d.ingredient] , price: ingredientData.find(x => x.name === d.ingredient).price}; }

            // Add recipe nodes
            if (!nodes[d.recepie]) nodes[d.recepie] = { id: d.recepie, group: 'recepie'};
            // Add ingredient nodes
            // if (!nodes[d.ingredient]) nodes[d.ingredient] = { id: d.ingredient, group: 'ingredient', type: ingredientTypeMap[d.ingredient] , price: +d.price};
            // Add links from recipes to ingredients
            links.push({ source: d.ingredient, target: d.recepie, value: +d.amount });
        });

        // Add links from type nodes to ingredient nodes
        // ingredientData.forEach(d => {
        //     if (nodes[d.name]) {
        //         links.push({
        //             source: d.type,
        //             target: d.name,
        //             value: 1
        //         });
        //     }
        // });

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
        .force('link', d3.forceLink().id(d => d.id).strength(-1))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.1))
        .force('collision', d3.forceCollide().radius(25))
        // .force('maxDistance', maxDistanceForce(maxDistance)); // Adding the max distance force
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
        .style('opacity', 0.6);

    // Add the nodes as groups
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodesArray)
        .enter().append('g')
        .style('opacity', d => d.group === 'ingredient' ? 0.7 : 1)
        .call(d3.drag()
            .on('start', defineDrag.dragstarted)
            .on('drag', defineDrag.dragged)
            .on('end', defineDrag.dragended));

    // Append images to ingredient and recipe nodes
    node.filter(d => d.group === 'ingredient' || d.group === 'recepie')
        .append('image')
        .attr('xlink:href', d => `data/images/recepies_ingredients/${d.id}.png`)
        .attr('x', d => d.price ? -Math.sqrt(d.price) / 2 : -16)
        .attr('y', d => d.price ? -Math.sqrt(d.price) / 2 : -16)
        .attr('width', d => d.price ? Math.sqrt(d.price) : 32)
        .attr('height', d => d.price ? Math.sqrt(d.price) : 32)
        // .on('error', function() { d3.select(this).attr('xlink:href', 'data/images/recepies_ingredients/default.png'); }); // Fallback for missing images

    // Append circles for outlines
    node.append('circle')
        .attr('r', d => {
            if (d.group === 'type') return 30;
            if (d.group === 'ingredient') {console.log(d.price); return Math.sqrt(d.price) / 2 || 16; } // Handle NaN values
            if (d.group === 'recepie') return Math.sqrt(d.price) / 2 || 16; // Handle NaN values
            return 16;
        })
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
    node.on('mouseover', function(event, d) {
        if (d.group === 'recepie') {
            node.filter(n => n.group === 'ingredient' && linkedByIndex[`${d.index},${n.index}`])
                .style('opacity', 1);
        }
    }).on('mouseout', function(event, d) {
        if (d.group === 'recepie') {
            node.filter(n => n.group === 'ingredient' && linkedByIndex[`${d.index},${n.index}`])
                .style('opacity', 0.7);
        }
    });

    // Add click event to type nodes to create and delete links
    // node.filter(d => d.group === 'type')
    //     .on('click', function(event, typeNode) {
    //         // Create links from type node to its ingredients
    //         const typeLinks = links.filter(l => l.source.type === typeNode.id || l.target.type === typeNode.id);
    //         const newLinks = typeLinks.map(l => ({ source: typeNode.id, target: l.target.id, value: 1 }));

    //         // Add new links to the graph
    //         const newLinkElements = g.selectAll('.new-link')
    //             .data(newLinks)
    //             .enter().append('line')
    //             .attr('class', 'new-link')
    //             .attr('stroke', '#999')
    //             .attr('stroke-width', 1)
    //             .style('opacity', 0.6);

    //         // Update the simulation with new links
    //         simulation.force('link').links([...links, ...newLinks]);
    //         simulation.alpha(0.5).restart();

    //         // Remove the new links after a delay
    //         setTimeout(() => {
    //             newLinkElements.remove();
    //             simulation.force('link').links(links);
    //             simulation.alpha(0.5).restart();
    //         }, 2000); // Adjust the delay as needed
    //     });

    return { node, link };
}

// Define drag interactions
function defineDrag(simulation) {
    return d3.drag()
        .on('start', function(event, d) {
            dragstarted(event, d, simulation);
        })
        .on('drag', function(event, d) {
            dragged(event, d);
        })
        .on('end', function(event, d) {
            dragended(event, d, simulation);
        });
}

function dragstarted(event, d, simulation) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d, simulation) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
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
        node.style('opacity', o => isConnected(d, o) ? 1 : 0.2);
        link.style('opacity', o => o.source.index === index || o.target.index === index ? 1 : 0.2);
    }

    function unfocus() {
        node.style('opacity', d => d.group === 'ingredient' ? 0.7 : 1);
        link.style('opacity', 0.6);
    }

    node.on('mouseover', focus)
        .on('mouseout', unfocus);
}

// Main execution
const { svg, width, height } = initSvg();
defineArrowMarkers(svg);

const g = svg.append('g');

// Append group for type hulls after creating 'g'
const typeHulls = g.append('g')
    .attr('class', 'type-hulls');

// Declare nodes and links in the main scope
const nodes = {};
const links = [];
const maxDistance = 200; // Set the maximum distance
const simulation = createSimulation(width, height, maxDistance);

loadIngredientData(nodes, function(ingredientData, ingredientTypeMap, typeColor) {
    loadMainData(nodes, links, ingredientData, ingredientTypeMap, typeColor, function(nodesArray, links, linkedByIndex) {
        const simulation = createSimulation(width, height);
        // const maxDistance = 20; // Set the maximum distance
        // const simulation = createSimulation(width, height, maxDistance);
        addZoom(svg, g);
        const { node, link } = createNodesAndLinks(g, nodesArray, links, typeColor, linkedByIndex, simulation);
        node.call(defineDrag(simulation));
        defineHover(node, link, linkedByIndex);

        // Initialize the simulation
        simulation
            .nodes(nodesArray)
            .on('tick', function() {
                // Update links
                link
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);

                // Update nodes
                node.attr('transform', d => `translate(${d.x},${d.y})`);

                // Update hulls for each type
                // const types = d3.groups(nodesArray.filter(d => d.group === 'ingredient'), d => d.type);

                // const hulls = typeHulls.selectAll('path')
                //     .data(types);

                // hulls.enter()
                //     .append('path')
                //     .attr('class', 'hull')
                //     .merge(hulls)
                //     .attr('d', function(d) {
                //         const points = d[1].map(n => [n.x, n.y]);
                //         if (points.length < 3) return null;
                //         const hull = d3.polygonHull(points);
                //         return 'M' + hull.join('L') + 'Z';
                //     })
                //     .attr('fill', d => typeColor(d[0]))
                //     .attr('stroke', d => typeColor(d[0]))
                //     .attr('stroke-width', 1)
                //     .attr('opacity', 0.2);

                // hulls.exit().remove();
            });

        simulation.force('link')
            .links(links)
            .distance(50)
            .strength(0.8);
            
        d3.select('#resetButton').on('click', function() {
            simulation.alpha(1).restart();
            simulation.force('x', null);
            simulation.force('y', null);
        });
    });
});
// function maxDistanceForce(radius) {
//     return function (d) {
//         var dx = d.x - width / 2,
//             dy = d.y - height / 2,
//             distance = Math.sqrt(dx * dx + dy * dy);

//         if (distance > radius) {
//             var angle = Math.atan2(dy, dx);
//             d.x = width / 2 + Math.cos(angle) * radius;
//             d.y = height / 2 + Math.sin(angle) * radius;
//         }
//     };
// }

// Reset button functionality