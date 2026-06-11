// d3-v5
const data_name = 'cs_rankings';
const init_r = 1;
const height = 800;
const width = 800;
const file_path = "static/data/" + data_name + "/" + data_name + "_" + init_r + "_" + init_r + ".json";
const area_id2color = {
    0: '#cfe1f2',
    1: '#a5cce4',
    2: '#6daed5',
    3: '#3c8bc3',
    4: '#1864aa',
    5: '#d3eecd',
    6: '#c4e8be',
    7: '#b5e1ae',
    8: '#a4da9e',
    9: '#91d18e',
    10: '#7dc87f',
    11: '#68be72',
    12: '#54b366',
    13: '#41a75b',
    14: '#319a50',
    15: '#238c46',
    16: '#157f3b',
    17: '#fdd8b3',
    18: '#fb8d3d',
    19: '#c44103',
    20: '#e2e1ef',
    21: '#c9c9e2',
    22: '#acabd2',
    23: '#908cc1',
    24: '#7769b0',
    25: '#61409b',
    26: '#fee5d9',
    27: '#fcbba1',
    28: '#fc9272',
    29: '#fb6a4a',
    30: '#ef3b2c',
    31: '#cb181d',
    32: '#99000d',
    33: '#cccccc'
};
d3.json(file_path).then(function(data_points) {
    const svg = d3.select('body')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    svg.append('rect')
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'black');

    const circle_g = svg
    	.append('g');
    circle_g.selectAll("circle")
        .data(data_points)
        .enter().append('circle')
        .attr("r", init_r)
        // .attr('cx', 0)
        // .attr('cy', 0)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr("fill", d => area_id2color[d.label])
        // .attr("transform", transform(d3.zoomIdentity));

    svg
        .append("rect")
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .attr("width", width)
        .attr("height", height)
        .call(
            d3
            .zoom()
            .scaleExtent([1/4, 8])
            .on("zoom", zoom)
        );

    function zoom(event) {
        // circle.attr("transform", transform(event.transform));
        circle_g.attr('transform', event.transform);
    }

    function transform(t) {
        return function(d) {
            return "translate(" + t.apply([d.x, d.y]) + ")";
        };
    }
});