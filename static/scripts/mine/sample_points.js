const width = 800;
const height = 800;
const padding = 20;
const line = d3.line().curve(d3.curveCatmullRomClosed);
const sample_num = 150;

const svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
const bg_rect = svg.append('rect')
    .attr('id', 'bg_rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill-opacity', 0)
    .attr('stroke', 'black');
const points = [[200, 200], [400, 150], [700, 600], [650, 700], [200, 600], [350, 400], [150, 200]];

const path = svg.append('path')
    .attr('d', line(points))
    .attr('stroke', 'black')
    .attr('fill', 'none');
const path_node = path.node();

svg.append('g')
    .attr('class', 'control_points')
    .selectAll('circle')
    .data(points)
    .enter()
    .append('circle')
    .attr('cx', d => d[0])
    .attr('cy', d => d[1])
    .attr('r', 3)
    .attr('fill', 'black');

const total_length = path_node.getTotalLength();
const sample_points = d3.ticks(0, total_length, sample_num)
    .map(d => path_node.getPointAtLength(d))
    .map(d => [d.x, d.y]);
svg.append('g')
    .attr('class', 'sample_points')
    .selectAll('circle')
    .data(sample_points)
    .enter()
    .append('circle')
    .attr('cx', d => d[0])
    .attr('cy', d => d[1])
    .attr('r', 2)
    .attr('fill', 'red');