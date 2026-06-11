// 加载抽象结果 JSON，用 D3 绘制抽象圆的半径分布直方图，用于分析半径频次

const data_name = 'cs_rankings';
const init_r = 1;

const file_path = "static/data/" + data_name + "/" + data_name + "_" + init_r + "_" + init_r + ".json";
// const file_path = "static/data/" + data_name + "/" + "density.json";

d3.json(file_path).then(function(data_points) {
    // data_points = data_points.filter(d => d > 0.01);
    console.log(data_points.length);
    console.log(d3.extent(data_points, d => d['density']));
    const variance = d3.variance(data_points, d => d['density']);
    const mean = d3.mean(data_points, d => d['density']);
    const coefficient_of_variation = Math.sqrt(variance) / mean;
    console.log('variance', variance);
    console.log('mean', mean);
    console.log('coefficient_of_variation', coefficient_of_variation);
    const min_density = 0;
    const max_density = 1;
    const bin_count = 256;
    const thresholds = d3.range(min_density, max_density, (max_density - min_density) / bin_count);
    const histogram = d3.histogram()
        .value(d => d['density'])
        .domain([0, 1])
        .thresholds(thresholds);
    const bins = histogram(data_points);
    console.log(bins.length);

    const height = 200;
    const width = 600;
    const h_y_scale = d3.scaleLinear()
        .domain([0, d3.max(bins.map(x => x.length))])
        .range([0, height * 0.8]);
    const x_scale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, width]);

    const svg = d3.select('body')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    svg.append('rect')
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('width', width)
        .attr('height', height);

    svg.append('g').selectAll("rect").data(bins)
        .enter()
        .append("rect")
        .attr('class', 'histogram_rect')
        .attr("fill", "#69b3a2")
        .attr('id', (d, i) => 'rect_' + i)
        .attr('x', d => x_scale(d.x0))
        .attr('y', d => height - h_y_scale(d.length))
        .attr("height", d => h_y_scale(d.length))
        .attr("width", d => Math.max(x_scale(d.x1) - x_scale(d.x0), 0));

});