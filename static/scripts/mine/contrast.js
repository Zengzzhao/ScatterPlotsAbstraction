const data_name = 'hathi_trust_library';
const init_r = 1;

const file_path = "static/data/" + data_name + "/" + data_name + "_" + init_r + "_" + init_r + ".json";
d3.json(file_path).then(function(data_points) {
    // data_points = data_points.filter(d => d > 0.01);
    console.log(data_points.length);
    const delaunay = d3.Delaunay.from(data_points, d => d.x, d => d.y);
    const vars = [];
    for (let i = 0; i < data_points.length; i++) {
    	const neighbors = delaunay.neighbors(i);
    	const densities = [];
    	for (const id of neighbors) {
    		densities.push(data_points[id]['density']);
    	};
    	vars.push(d3.variance(densities));
    }
    console.log(d3.mean(vars));
});