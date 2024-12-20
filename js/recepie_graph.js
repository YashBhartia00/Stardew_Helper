// Global context object
const ctx = {
    svg: null,
    width: null,
    height: null,
    nodes: {},
    links: [],
    ingredientTypeMap: {},
    typeColor: null,
    simulation: null,
    linkedByIndex: {},
    recepieData: [],
    isScatterPlot: false, // New flag to track current visualization
    ingredientCategories: [],
    selectedCategories: new Set(),
    forceParams: {
        linkDistance: 30,
        linkStrength: 0.6,
        chargeStrength: -40,
        chargeDistanceMax: 300,
        collisionRadius: d => getNodeSize(d) / 2 + 5,
        centerStrength: 1,
    },
    useIngredientOpacity: true,
    hideIngredientsInScatterplot: true,
    ingredientOpacity: 0.2, // Control ingredient node opacity globally
};

// Define scale variables globally
let xScale;
let yScale;

// Initialize SVG canvas
function initSvg() {
    ctx.width = 1300;
    ctx.height = 600;
    ctx.svg = d3.select('svg')
        .attr('width', ctx.width)
        .attr('height', ctx.height);
}

// Define arrow markers
function defineArrowMarkers() {
    // Remove the arrow marker definition
}


// Define the tooltip div globally
const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('display', 'none')
    .style('background', '#fff')
    .style('border', '1px solid #ccc')
    .style('padding', '5px')

.on('mouseover', function(event, d) {
    highlightNode(d);
    tooltip.style('display', 'inline-block')
        .html(getTooltipContent(d))
                // Get the node's position (handle transform position for scatter plot)
        const nodePosition = d3.select(this).node().getBoundingClientRect();
        const offsetX = 10;  // Tooltip offset from the cursor
        const offsetY = 10;

        tooltip.style('left', (nodePosition.left + offsetX) + 'px')
            .style('top', (nodePosition.top + offsetY) + 'px');
})
.on('mousemove', function(event) {
    tooltip.style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY + 10) + 'px');
})
.on('mouseout', function() {
    resetHighlight();
    tooltip.style('display', 'none');
});

// Load recepie data
function loadRecepieData(callback) {
    d3.csv('data/recepies/recepie_data.csv').then(function(recepieData) {
        ctx.recepieData = recepieData;
        callback();
    });
}

// Load ingredient data and create type-color mapping
function loadIngredientData(callback) {
    d3.csv('data/recepies/ingredient_data.csv').then(function(ingredientData) {
        ingredientData.forEach(d => {
            d.price = +d.price || 0;
            ctx.nodes[d.name] = { id: d.name, group: 'ingredient', price: d.price, type: d.type };

            // Collect unique ingredient categories
            if (ctx.ingredientCategories.indexOf(d.type) === -1) {
                ctx.ingredientCategories.push(d.type);
            }
        });

        // Define color scale based on categories
        ctx.typeColor = d3.scaleOrdinal()
            .domain(ctx.ingredientCategories)
            .range(d3.schemeCategory10);

        callback();
    });
}

// Load main data and process nodes and links
function loadMainData(callback) {
    d3.csv('data/recepies/graph_data.csv').then(function(data) {
        data.forEach(d => {
            if (!ctx.nodes[d.recepie]) {
                const recepieInfo = ctx.recepieData.find(r => r.name === d.recepie);
                const price = recepieInfo ? +recepieInfo.price || 0 : 0;
                ctx.nodes[d.recepie] = { id: d.recepie, group: 'recepie', price: price };
            }
            ctx.links.push({ source: d.ingredient, target: d.recepie, value: +d.amount });
        });
        buildLinkedByIndex(); // Ensure linkedByIndex is built for highlighting
        callback();
    });
}

// Define applyForces function
function applyForces() {
    ctx.simulation
        .force('link', d3.forceLink()
            .id(d => d.id)
            .distance(ctx.forceParams.linkDistance)
            .strength(ctx.forceParams.linkStrength))
        .force('charge', d3.forceManyBody()
            .strength(ctx.forceParams.chargeStrength)
            .distanceMax(ctx.forceParams.chargeDistanceMax))
        .force('center', d3.forceCenter(ctx.width / 2, ctx.height / 2).strength(ctx.forceParams.centerStrength))
        .force('collision', d3.forceCollide()
            .radius(ctx.forceParams.collisionRadius));
}

// Create simulation
function createSimulation() {
    ctx.simulation = d3.forceSimulation()
        .on('tick', ticked);
    applyForces();
}

// Add zoom functionality
function addZoom() {
    const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on('zoom', function(event) {
            ctx.g.attr('transform', event.transform);
        });
    ctx.svg.call(zoom);
}

// Update the createNodesAndLinks function to set up empty selections
function createNodesAndLinks() {
    ctx.g = ctx.svg.append('g');

    // Create empty link and node selections
    ctx.link = ctx.g.append('g')
        .attr('class', 'links')
        .selectAll('line')

    ctx.node = ctx.g.append('g')
        .attr('class', 'nodes')
        .selectAll('g');

    // Define the tooltip div
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('display', 'none')
        .style('background', '#fff')
        .style('border', '1px solid #ccc')
        .style('padding', '5px');

    // Initialize the visualization with all nodes and links
    updateVisualization(ctx.nodes, ctx.links);
}

// Update the updateVisualization function
function updateVisualization(filteredNodes, filteredLinks) {
    // Convert filteredNodes to an array if it's an object
    const nodesArray = Object.values(filteredNodes);

    // Update simulation nodes and links if simulation is defined
    if (ctx.simulation && !ctx.isScatterPlot) {
        ctx.simulation.nodes(nodesArray);
        ctx.simulation.force('link').links(filteredLinks);
    }

    // Update links
    ctx.link = ctx.g.select('.links').selectAll('line')
        .data(filteredLinks, d => `${d.source.id}->${d.target.id}`)
        .attr('stroke-width', d => d.value)
        .attr('stroke', d => ctx.typeColor(d.source.type));

    // Remove old links
    ctx.link.exit().remove();

    // Add new links
    const linkEnter = ctx.link.enter().append('line')
        .attr('class', 'link')
        .attr('stroke-width', d => d.value)
        .attr('stroke', d => ctx.typeColor(d.source.type)) // Ensure link color matches ingredient category
        .style('opacity', ctx.isScatterPlot ? 0 : 0.6); // Always 0 in scatterplot mode

    ctx.link = linkEnter.merge(ctx.link);

    // Update nodes
    ctx.node = ctx.g.select('.nodes').selectAll('g')
        .data(nodesArray, d => d.id);

    // Remove old nodes
    ctx.node.exit().remove();

    // Add new nodes
    const nodeEnter = ctx.node.enter().append('g')
        .attr('class', 'node')
        .style('opacity', d => {
            if (ctx.isScatterPlot && ctx.hideIngredientsInScatterplot && d.group === 'ingredient') {
                return 0;
            } else if (ctx.useIngredientOpacity && d.group === 'ingredient') {
                return 0.2;
            } else {
                return 1;
            }
        })
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    // Append images to entering nodes
    nodeEnter.filter(d => d.group === 'ingredient' || d.group === 'recepie')
        .append('image')
        .attr('xlink:href', d => `data/images/recepies_ingredients/${d.id}.png`)
        .attr('x', d => -getNodeSize(d) / 2)
        .attr('y', d => -getNodeSize(d) / 2)
        .attr('width', d => getNodeSize(d))
        .attr('height', d => getNodeSize(d));

    // Append circles to entering nodes
    nodeEnter.append('circle')
        .attr('r', d => getNodeSize(d) / 2)
        .attr('stroke', d => d.group === 'ingredient' ? '#4682b4' : '#ff8c00')
        .attr('fill', 'none')
        .attr('stroke-width', 2);

    // Merge entering and updating nodes
    ctx.node = nodeEnter.merge(ctx.node);

    // Update attributes and event listeners for all nodes
    ctx.node.style('opacity', d => d.group === 'ingredient' ? ctx.ingredientOpacity : 1)
        .on('mouseover', function(event, d) {
            if (ctx.isScatterPlot && d.group === 'ingredient') return; // Prevent hover for ingredients in scatterplot mode
            if (ctx.isScatterPlot && d.group === 'recepie') {
                tooltip.style('display', 'inline-block')
                    .html(getTooltipContent(d));
                return;
            }
            highlightNode(d);
            tooltip.style('display', 'inline-block')
                .html(getTooltipContent(d));
        })
        .on('mousemove', function(event) {
            if (ctx.isScatterPlot && d.group === 'ingredient') return; // Prevent hover for ingredients in scatterplot mode
            tooltip.style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY + 10) + 'px');
        })
        .on('mouseout', function() {
            if (ctx.isScatterPlot && d.group === 'ingredient') return; // Prevent hover for ingredients in scatterplot mode
            resetHighlight();
            tooltip.style('display', 'none');
        });

    // Restart the simulation if it is defined
    if (ctx.simulation) {
        ctx.simulation.alpha(1).restart();
    }

    // If in scatter plot mode, update positions
    if (ctx.isScatterPlot) {
        updateScatterPlotPositions(filteredNodes);
    }
}

// Adjust the createScatterPlot function to update positions without adding nodes
function createScatterPlot() {
    xScale = d3.scaleLinear()
        .domain(d3.extent(ctx.recepieData, d => +d.price))
        .range([100, ctx.width - 100]);

    yScale = d3.scaleLinear()
        .domain(d3.extent(ctx.recepieData, d => +d.health))
        .range([ctx.height - 100, 100]);

    // Update node positions
    updateScatterPlotPositions(ctx.nodes);

    // Hide links
    ctx.link.style('opacity', 0);

    // Remove forces
    ctx.simulation.force('charge', null)
        .force('link', null)
        .force('collision', null)
        .alpha(0)
        .stop();

    // Set ingredient opacity to 0 in scatter plot
    ctx.ingredientOpacity = 0;
    ctx.node.style('opacity', d => d.group === 'ingredient' ? ctx.ingredientOpacity : 1);

    // Remove existing axes and labels
    ctx.g.selectAll('.x-axis, .y-axis, .x-label, .y-label').remove();

    // Add axes and labels to scatterplot
    const xAxis = d3.axisBottom(xScale);
    ctx.xAxisG = ctx.g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${ctx.height - 100})`)
        .call(xAxis);
    ctx.xLabel = ctx.g.append('text')
        .attr('class', 'x-label')
        .attr('x', ctx.width / 2)
        .attr('y', ctx.height - 60)
        .attr('text-anchor', 'middle')
        .text('Price');

    const yAxis = d3.axisLeft(yScale);
    ctx.yAxisG = ctx.g.append('g')
        .attr('class', 'y-axis')
        .attr('transform', 'translate(100, 0)')
        .call(yAxis);
    ctx.yLabel = ctx.g.append('text')
        .attr('class', 'y-label y-label-button')
        .attr('transform', 'rotate(-90)')
        .attr('x', -ctx.height / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('cursor', 'pointer')
        .text('Health')
        .on('click', function() {
            setScatterYAxis('health');
        });

    ctx.yLabel2 = ctx.g.append('text')
        .attr('class', 'y-label y-label-button')
        .attr('transform', 'rotate(-90)')
        .attr('x', -ctx.height / 2)
        .attr('y', 55)
        .attr('text-anchor', 'middle')
        .style('cursor', 'pointer')
        .text('Energy')
        .on('click', function() {
            setScatterYAxis('energy');
        });

    ctx.isScatterPlot = true;
}

// New function to update positions in scatter plot mode
function updateScatterPlotPositions(filteredNodes, metric = 'health') {

console.log(filteredNodes);
    ctx.node.transition().duration(1000)
        .attr('transform', d => {
            if (d.group === 'recepie' && filteredNodes[d.id]) {
                const recepieInfo = ctx.recepieData.find(r => r.name === d.id);
                d.savedX = d.x; // Save current x position
                d.savedY = d.y; // Save current y position

                d.fx = xScale(+recepieInfo.price);
                d.fy = yScale(metric==='health' ? +recepieInfo.health : +recepieInfo.energy);

                return `translate(${d.fx},${d.fy})`;
            } else {

                return `translate(${d.x},${d.y})`;
            }
        });
}

// Toggle visualization on button click
d3.select('#toggleButton').on('click', function() {
    if (ctx.isScatterPlot) {
        createForceDirectedGraph();
    } else {
        createScatterPlot();
    }
});

// Initialize and load data
function init() {
    initSvg();
    defineArrowMarkers();
    loadRecepieData(function() {
        loadIngredientData(function() {
            loadMainData(function() {
                createNodesAndLinks(); // Ensure nodes and links are created first
                createSimulation(); // Ensure simulation is created before updating visualization
                createIngredientCategoryFilterButtons(); // Ensure filter buttons are created
                addZoom();
                buildLinkedByIndex();
                // Initialize the visualization with all nodes and links
                updateVisualization(ctx.nodes, ctx.links);
            });
        });
    });
}

// Create category filter buttons
function createIngredientCategoryFilterButtons() {
    const buttonContainer = d3.select('#categoryFilterButtons');
    ctx.ingredientCategories.forEach(category => {
        const button = buttonContainer.append('button')
            .attr('class', 'category-filter-button active') // Add 'active' class
            .style('background-color', ctx.typeColor(category)) // Set button color
            .text(category)
            .on('click', function() {
                toggleCategoryFilter(category, d3.select(this));
            });
        ctx.selectedCategories.add(category);
    });

    // Add 'All' button to select all categories
    buttonContainer.append('button')
        .attr('class', 'category-filter-button active')
        .text('All')
        .on('click', function() {
            ctx.selectedCategories = new Set(ctx.ingredientCategories);
            buttonContainer.selectAll('button.category-filter-button').classed('active', true);
            filterByIngredientCategories();
        });

    // Style all buttons as active initially
    buttonContainer.selectAll('button').classed('active', true);
}

// Function to toggle category selection
function toggleCategoryFilter(category, button) {
    if (ctx.selectedCategories.has(category)) {
        ctx.selectedCategories.delete(category);
        button.classed('active', false);
    } else {
        ctx.selectedCategories.add(category);
        button.classed('active', true);
    }
    filterByIngredientCategories();
}

// Function to filter recipes based on selected ingredient categories
function filterByIngredientCategories() {
    // Get ingredients belonging to selected categories
    const selectedIngredients = Object.values(ctx.nodes)
        .filter(node => node.group === 'ingredient' && ctx.selectedCategories.has(node.type))
        .map(node => node.id);

    // Filter links where the ingredient is in selectedIngredients
    const filteredLinks = ctx.links.filter(link => selectedIngredients.includes(link.source.id));

    // Get recipes that have links with selected ingredients
    const filteredRecipes = new Set(filteredLinks.map(link => link.target.id));

    // Build filtered nodes
    const filteredNodes = {};

    // Include selected ingredients
    selectedIngredients.forEach(ingredientName => {
        filteredNodes[ingredientName] = ctx.nodes[ingredientName];
    });

    // Include recipes connected to selected ingredients
    filteredRecipes.forEach(recipeName => {
        filteredNodes[recipeName] = ctx.nodes[recipeName];
    });

    // Update visualization with filtered nodes and links
    updateVisualization(filteredNodes, ctx.isScatterPlot ? [] : filteredLinks); // Pass empty links array in scatterplot mode
}

// Helper function to get tooltip content
function getTooltipContent(d) {
    if (d.group === 'ingredient') {
        return `<strong>${d.id}</strong><br>Type: ${d.type}<br>Price: ${d.price}`;
    } else if (d.group === 'recepie') {
        // also show health and energy, and small images of ingredients
        const recepieInfo = ctx.recepieData.find(r => r.name === d.id);
        const ingredients = ctx.links.filter(link => link.target.id === d.id)
            .map(link => link.source.id);
        const ingredientImages = ingredients.map(ingredient => `<img src="data/images/recepies_ingredients/${ingredient}.png" width="20" height="20" title="${ingredient}">`).join(' ');
        return `<strong>${d.id}</strong><br>Price: ${d.price}<br>Health: ${recepieInfo.health}<br>Energy: ${recepieInfo.energy}<br>Ingredients: ${ingredientImages}`;
              
    }
    return '';
}

// Get node size based on price
function getNodeSize(d) {
    return d.price ? Math.sqrt(d.price) : 32;
}

// Update positions on each tick
function ticked() {
    if (ctx.node) { // Ensure ctx.node is defined
        const radius = Math.min(ctx.width, ctx.height) / 2;
        const centerX = ctx.width / 2;
        const centerY = ctx.height / 2;

        ctx.node.attr('transform', d => {
            // const dx = d.x - centerX;
            // const dy = d.y - centerY;
            // const distance = Math.sqrt(dx * dx + dy * dy);
            // if (distance > radius - getNodeSize(d) / 2) {
            //     const angle = Math.atan2(dy, dx);
            //     d.x = centerX + (radius - getNodeSize(d) / 2) * Math.cos(angle);
            //     d.y = centerY + (radius - getNodeSize(d) / 2) * Math.sin(angle);
            // }

            //keep withing svg bounds rectangle
            d.x = Math.max(getNodeSize(d) / 2, Math.min(ctx.width - getNodeSize(d) / 2, d.x));
            d.y = Math.max(getNodeSize(d) / 2, Math.min(ctx.height - getNodeSize(d) / 2, d.y));

            return `translate(${d.x},${d.y})`;
        });

        ctx.link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
    }
}

// Drag interactions
function dragstarted(event, d) {
    if (!event.active) ctx.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) ctx.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// Highlight connected nodes
function highlightNode(d) {
    ctx.node.style('opacity', o => isConnected(d, o) ? 1 : 0.1);
    ctx.link.style('opacity', o => o.source === d || o.target === d ? 1 : 0.1);

}

function resetHighlight() {
    ctx.node.style('opacity', d => d.group === 'ingredient' ? ctx.ingredientOpacity : 1);
    ctx.link.style('opacity', ctx.isScatterPlot ? 0 : 0.6);
}

// Check if two nodes are connected
function isConnected(a, b) {
    return ctx.linkedByIndex[`${a.id},${b.id}`] || ctx.linkedByIndex[`${b.id},${a.id}`] || a.id === b.id;
}

// Build linkedByIndex for quick lookup
function buildLinkedByIndex() {
    ctx.links.forEach(d => {
        ctx.linkedByIndex[`${d.source},${d.target}`] = true;
    });

}

// Transition back to force-directed graph
function createForceDirectedGraph() {
    // Remove axes from ctx.g instead of ctx.svg
    ctx.g.selectAll('.x-axis, .y-axis, .x-label, .y-label').remove();

    // Reset node positions to saved positions
    ctx.node.each(d => {
        d.fx = d.savedX;
        d.fy = d.savedY;
    });

    // Transition nodes back to saved positions
    ctx.node.transition()
        .duration(1000)
        .attr('transform', d => `translate(${d.fx},${d.fy})`)
        .on('end', () => {
            // Remove fixed positions
            ctx.node.each(d => {
                d.fx = null;
                d.fy = null;
            });

            // Apply forces
            applyForces();

            // Reset ingredient opacity when switching back
            ctx.ingredientOpacity = 0.2;
            ctx.node.style('opacity', d => d.group === 'ingredient' ? ctx.ingredientOpacity : 1);

            // Restart simulation
            ctx.simulation.alpha(1).restart();
            ctx.isScatterPlot = false;
            updateVisualization(ctx.nodes, ctx.links);
        });
        ctx.link.transition().duration(1000)
            .style('opacity', 0.6);
}

// Add CSS styles for the filter buttons
d3.select('head').append('style').text(`
    .category-filter-button {
        margin: 5px;
        padding: 8px 12px;
        background-color: #f2d8e4; /* Pastel color */
        color: #333;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    .category-filter-button:hover {
        background-color: #e8c3d3;
    }
    .category-filter-button.active {
        background-color: #a64d79; /* Darker shade when selected */
        color: white;
    }
    #filterContainer {
        position: absolute;
        right: 20px;
        top: 100px;
        display: flex;
        flex-direction: column;
    }
    #filterButtons, #categoryFilterButtons {
        display: flex;
        flex-direction: column;
    }
`);

function setScatterYAxis(metric) {
    yScale.domain(d3.extent(ctx.recepieData, d => metric === 'health' ? +d.health : +d.energy));
    ctx.yAxisG.transition().call(d3.axisLeft(yScale));
    ctx.yLabel.text(metric.charAt(0).toUpperCase() + metric.slice(1));
    console.log(metric);
    updateScatterPlotPositions(ctx.nodes, metric);
}

init();