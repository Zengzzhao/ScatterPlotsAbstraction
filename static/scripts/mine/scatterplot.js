const width = 800;
const height = 800;
const padding = 20;

const svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'none')
    .attr('stroke', 'black');

const label2color = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
const area_id2color = {
    0: '#cfe1f2', 1: '#a5cce4', 2: '#6daed5', 3: '#3c8bc3', 4: '#1864aa', 5: '#d3eecd', 6: '#c4e8be',
    7: '#b5e1ae', 8: '#a4da9e', 9: '#91d18e', 10: '#7dc87f', 11: '#68be72', 12: '#54b366', 13: '#41a75b',
    14: '#319a50', 15: '#238c46', 16: '#157f3b', 17: '#fdd8b3', 18: '#fb8d3d', 19: '#c44103', 20: '#e2e1ef',
    21: '#c9c9e2', 22: '#acabd2', 23: '#908cc1', 24: '#7769b0', 25: '#61409b', 26: '#fee5d9', 27: '#fcbba1',
    28: '#fc9272', 29: '#fb6a4a', 30: '#ef3b2c', 31: '#cb181d', 32: '#99000d', 33: '#cccccc'
};
const colorScheme = {
    black1nh: "rgb(56,153,201)",
    white1nh: "rgb(251,54,64)",
    asianpi1nh: "rgb(137,255,167)",
    other1nh: "rgb(167,153,183)",
    hisp: "rgb(255,240,124)",
    native1nh: "rgb(232,128,12)"
};

d3.json("static/data/dc_census_2012_2016/dc_census_2012_2016.json").then(function (points) {
    console.log(points.length);
    points = d3.shuffle(points).slice(0, 40000);
    const x_scale = d3.scaleLinear()
        .domain(d3.extent(points, d => d.x))
        .range([padding, width - padding]);
    const y_scale = d3.scaleLinear()
        .domain(d3.extent(points, d => d.y))
        .range([height - padding, padding]);
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'black');
    svg.append('g').selectAll('circle')
        .data(points).enter()
        .append('circle')
        .attr('cx', d => x_scale(d.x))
        .attr('cy', d => y_scale(d.y))
        .attr('r', 1)
        .attr('opacity', 0.35)
        .attr('fill', d => colorScheme[d.label]);
});