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

function create_points(center_x, center_y, sigma, num) {
    const randomX = d3.randomNormal(center_x, sigma);
    const randomY = d3.randomNormal(center_y, sigma);
    return Array.from({length: num}, () => [randomX(), randomY()]);
}

function concat(...args) {
    return args.reduce((acc, val) => [...acc, ...val]);
}

const random_points = [];
const flat_random_points = [];
for (const sample of sample_points) {
    for (const p of create_points(sample[0], sample[1], 10, 5)) {
        random_points.push(p);
        flat_random_points.push(p[0]);
        flat_random_points.push(p[1]);
    }
}

svg.append('g')
    .attr('class', 'random_points')
    .selectAll('circle')
    .data(random_points)
    .enter()
    .append('circle')
    .attr('cx', d => d[0])
    .attr('cy', d => d[1])
    .attr('r', 2)
    .attr('fill', 'green');

// const delaunay = d3.Delaunay.from(random_points);
// const voronoi = delaunay.voronoi([0, 0, width, height]);
//
// svg.append('path')
//     .attr('d', voronoi.render())
//     .attr('stroke', 'gray')
//     .attr('fill', 'none');


// const [x0, x1] = d3.extent(random_points.map(d => d[0])),
//     [y0, y1] = d3.extent(random_points.map(d => d[1]));
//
// const voronoi = d3.voronoi().extent([[x0 - 1, y0 - 1], [x1 + 1, y1 + 1]])(random_points).edges;
// const edges = voronoi
//     .filter(edge => {
//         if (edge && edge.right) {
//             const inside = edge.map(point => d3.polygonContains(random_points, point));
//             if (inside[0] === inside[1]) {
//                 return inside[0];
//             }
//             if (inside[1]) {
//                 edge.reverse();
//             }
//             return true;
//         }
//         return false;
//     })
//     .map(([start, end] = []) => {
//         const {intersection, distance} = findClosestPolygonIntersection(
//             start,
//             end,
//             polygon
//         );
//
//         if (intersection) {
//             intersection.clipped = true;
//         }
//
//         // Each edge has a starting point, a clipped end point, and an original end point
//         const edge = [start, intersection || end];
//         edge.distance = intersection ? distance : distanceBetween(start, end);
//
//         return edge;
//     });

// const start = 0;
// const {points, halfedges, triangles} = delaunay;
// for (let i = 0, n = halfedges.length; i < n; ++i) {
//   const j = halfedges[i];
//   if (j < i) continue;
//   const ti = triangles[i];
//   const tj = triangles[j];
//
//   context.moveTo(points[ti * 2], points[ti * 2 + 1]);
//   context.lineTo(points[tj * 2], points[tj * 2 + 1]);
// }


// function compute_angle(p1, p2) {
//     let angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) / Math.PI;
//     if (angle < 0) angle += 2;
//     return angle;
// }
// const center = [d3.mean(random_points, d => d[0]), d3.mean(random_points, d => d[1])];
// for (const p of random_points) {
//     p.angle = compute_angle(p, center);
// }
// random_points.sort((a, b) => a.angle - b.angle);

// const shortest_path = svg.append('g')
//     .attr('class', 'shortest_paths')
//     .selectAll('path')
//     .data(mst(flat_random_points))
//     .enter()
//     .append('path')
//     .attr('d', d => d3.line()([[flat_random_points[d[0] * 2], flat_random_points[d[0] * 2 + 1]],
//         [flat_random_points[d[1] * 2], flat_random_points[d[1] * 2 + 1]]]))
//     .attr('stroke', 'blue')
//     .attr('stroke-width', 2)
//     .attr('fill', 'none');


// const shortest_path = svg.append('path')
//     .attr('stroke', 'red')
//     .attr('fill', 'none');
// bg_rect.raise();
// bg_rect
//     .on('mousemove', function (e) {
//         const m = d3.pointer(e); // target
//
//         // Copied from delaunay.find.
//         let path = [start], i = start, c;
//         while ((c = delaunay._step(i, ...m)) >= 0 && c !== i && c !== start) {
//             path.push(i = c);
//         }
//
//         const recovered_points = path.map(d => random_points[d]);
//         shortest_path.attr('d', d3.line()(recovered_points))
//     })
//     .on('click', function () {
//         console.log('dd');
//     })


// svg.append('g')
//     .selectAll('path')
//     .data(delaunay.halfedges)
//     .enter()
//     .append('path')
//     .attr('d', d3.line()([]))
