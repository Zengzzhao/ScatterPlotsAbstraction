// 主流程入口
// 整合 LBG 算法与 D3 绘图，调用后端 /get_kde、/get_labels 接口，运行抽象化流程并将结果圆圈和 KDE 轮廓渲染到 SVG


// const area2color = {
//     'AI': '#cfe1f2', 'Vision': '#a5cce4', 'ML': '#6daed5', 'NLP': '#3c8bc3', 'Web+IR': '#1864aa',
//     'Arch': '#d3eecd', 'Networks': '#c4e8be', 'Security': '#b5e1ae', 'DB': '#a4da9e', 'EDA': '#91d18e',
//     'Embedded': '#7dc87f', 'HPC': '#68be72', 'Mobile': '#54b366', 'Metrics': '#41a75b', 'OS': '#319a50',
//     'PL': '#238c46', 'SE': '#157f3b', 'Theory': '#fdd8b3', 'Crypto': '#fb8d3d', 'Logic': '#c44103',
//     'Comp.': '#e2e1ef', 'Graphics': '#c9c9e2', 'ECom': '#acabd2', 'HCI': '#908cc1', 'Robotics': '#7769b0',
//     'Visualization': '#61409b', 'Medical': '#fee5d9', 'Geo': '#fcbba1', 'Edu': '#fc9272', 'Business': '#fb6a4a',
//     'SP': '#ef3b2c', 'FS': '#cb181d', 'CS': '#99000d', 'Non_english': '#cccccc'
// };

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
const label2color = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
];
const race2color = {
    black1nh: "rgb(56,153,201)",
    white1nh: "rgb(251,54,64)",
    asianpi1nh: "rgb(137,255,167)",
    other1nh: "rgb(167,153,183)",
    hisp: "rgb(255,240,124)",
    native1nh: "rgb(232,128,12)"
};


function perform_weightedLGB(lbg_stippling, max_iteration = 100) {
    let iteration = 1;
    let status = lbg_stippling.iterate();
    // const threshold = lbg_stippling.stipples.length * 0.005;
    while (status.splitted.length !== 0 || status.deleted.length !== 0) {
        // console.log(status);
        status = lbg_stippling.iterate();
        console.log('iteration times:', iteration, status.splitted.length, status.deleted.length);
        if (iteration >= max_iteration) break;
        iteration += 1;
    }
}

function draw_circles(data) {
    const max_avg_density = d3.max(data, d => d.avg_density);
    svg.append('g')
        .attr('id', 'circles_g')
        .selectAll("circle")
        .data(data).enter()
        .append("circle")
        .attr("cx", d => d[0])
        .attr("cy", d => d[1])
        // .attr("r", d => Math.sqrt(d.avg_density / max_avg_density) * d.radius * 1.1)
        .attr('r', d => d.radius)
        .attr('fill', d => d.color);
}

function draw_kde_paths(data) {
    // 8-20/5-25
    const contour_data = d3.contourDensity()
        .x(d => d[1])
        .y(d => d[0])
        .size([width, height])
        .bandwidth(5)
        .thresholds(25)
        (data);
    const max_value = d3.max(contour_data, d => d.value);
    const color = d3.scaleSequential([0, max_value * 0.7], d3.interpolateYlGnBu);

    svg.append('g')
        .attr('id', 'kde_g')
        .selectAll('path')
        .data(contour_data)
        .enter().append('path')
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        // .attr('fill', d => color(d.value))
        .attr('d', d3.geoPath())
}

const [min_radius, max_radius] = [1, 3];
const width = 800;
const height = 800;
const max_iteration = 100;
const data_name = 'cs_rankings';
const svg = d3.select('body')
    .append('svg')
    .attr('width', width);

$.post('/get_kde', {
    data_name: data_name,
    padding: 20,
    width: 800
}, function(densities) {
    console.log(width, height, width * height);
    densities = JSON.parse(densities);
    console.log(d3.extent(densities));

    const lbg_stippling = new Stippling(width, height, densities, [min_radius, max_radius]);
    perform_weightedLGB(lbg_stippling, max_iteration);

    const cell_centroids = [];
    const cell_masses = [];
    const cell_densities = [];
    for (const st of lbg_stippling.stipples) {
        [st[0], st[1]] = [st[1], st[0]];
        cell_centroids.push([st[0], st[1]]);
        cell_masses.push(st.mass);
        if (st.avg_density === undefined) {
            console.log('avg_density is undefined');
            st.avg_density = densities[Math.round(st[0]) * width + Math.round(st[1])];
        }
        cell_densities.push(st.avg_density);
    }

    $.post('/get_labels', {
        data_name: data_name,
        min_radius: min_radius,
        max_radius: max_radius,
        cell_centroids: JSON.stringify(cell_centroids),
        cell_masses: JSON.stringify(cell_masses),
        cell_densities: JSON.stringify(cell_densities)
    }, function(labels) {
        console.log('cell num:', labels.length);

        labels = JSON.parse(labels);
        const colors = area_id2color; // race2color; area_id2color; label2color;
        for (let i = 0; i < lbg_stippling.stipples.length; i++) {
            const st = lbg_stippling.stipples[i];
            st.color = colors[labels[i]];
        }

        svg.attr('height', height);
        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'black');
        draw_circles(lbg_stippling.stipples);
        // draw_kde_paths(lbg_stippling.stipples);
    });
});