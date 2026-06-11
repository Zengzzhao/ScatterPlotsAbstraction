const width = 800;
const height = 800;
const padding = 20;
// $.post('/get_density', {data_name: 'forest_covertype'}, function (density) {
//     density = JSON.parse(density);
//     const max_value = d3.max(density);
//     console.log(density.length);
//     const height = density.length / width;
//     const svg = d3.select('body')
//         .append('svg')
//         .attr('width', width)
//         .attr('height', height);
//     svg.append('rect')
//         .attr('width', width)
//         .attr('height', height)
//         .attr('fill', 'black');
//     console.log('max density:', max_value);
//     const color = d3.scaleSequential(d3.interpolateYlGnBu)
//         .domain([Math.pow(10, -10), max_value * 0.7]);
//
//     svg.append('g').selectAll('rect')
//         .data(density)
//         .enter()
//         .append('rect')
//         .attr('width', 1)
//         .attr('height', 1)
//         .attr('stroke', 'none')
//         .attr('fill', d => d < Math.pow(10, -10)? 'white': color(d))
//         .attr('x', (d, i) => Math.floor(i / width))
//         .attr('y', (d, i) => i % width);
// });

d3.json("static/data/forest_covertype/forest_covertype.json").then(function (points) {
    console.log(points.length);
    const svg = d3.select('body')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'black')
        .attr('fill', 'none')
        .attr('stroke', 'black');
    const x_scale = d3.scaleLinear()
        .domain(d3.extent(points, d => d.x))
        .range([padding, width - padding]);
    const y_scale = d3.scaleLinear()
        .domain(d3.extent(points, d => d.y))
        .range([padding, height - padding]);
    const contour_data = d3.contourDensity()
            .x(d => x_scale(d.x))
            .y(d => y_scale(d.y))
            .size([width, height])
            .bandwidth(5)
            .thresholds(25)
            (points);
    const [min_value, max_value] = d3.extent(contour_data, d => d.value);
    console.log(contour_data);
    console.log(max_value);

    const color = d3.scaleSequential([0, max_value * 0.7], d3.interpolateYlGnBu);
    const kde_g = svg.append('g');
    kde_g.selectAll('path')
        .data(contour_data)
        .enter().append('path')
        .attr('fill', d => color(d.value))
        .attr('d', d3.geoPath())
        .each(function() {
            const path_node = d3.select(this).node()
        })
        // .on('mouseover', function () {
        //     d3.select(this)
        //         .attr('stroke-width', 1.5)
        //         .attr('stroke', 'red');
        // })
        // .on('mouseout', function () {
        //     d3.select(this)
        //         .attr('stroke', 'none');
        // });

});