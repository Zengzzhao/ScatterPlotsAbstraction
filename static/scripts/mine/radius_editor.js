// 核心交互组件

// =====常量配置=====
// 宽高比例尺
const div_height = 900, preview_width = 900, editor_width = 900, padding = 30, padding2 = 20;
const div_width = preview_width + editor_width + padding2;
const control_div_height = 40;
const dis1 = 50, dis2 = 20;
const brush_thickness = 50;
const curve_g_width = editor_width - padding * 2 - brush_thickness;
const curve_g_height = div_height - brush_thickness - padding2;
let light_on = true, is_grey = false, show_contour = false,
    show_target_contour = false, show_selected_circles = false, is_colorful_contour = false;
let kde_bandwidth = 5, kde_threshold = 5;
const loss_regression = d3.regressionLoess().bandwidth(0.1);
let global_data_points;
// 颜色
const area_id2color = {
    0: '#cfe1f2', 1: '#a5cce4', 2: '#6daed5', 3: '#3c8bc3', 4: '#1864aa', 5: '#d3eecd', 6: '#c4e8be',
    7: '#b5e1ae', 8: '#a4da9e', 9: '#91d18e', 10: '#7dc87f', 11: '#68be72', 12: '#54b366', 13: '#41a75b',
    14: '#319a50', 15: '#238c46', 16: '#157f3b', 17: '#fdd8b3', 18: '#fb8d3d', 19: '#c44103', 20: '#e2e1ef',
    21: '#c9c9e2', 22: '#acabd2', 23: '#908cc1', 24: '#7769b0', 25: '#61409b', 26: '#fee5d9', 27: '#fcbba1',
    28: '#fc9272', 29: '#fb6a4a', 30: '#ef3b2c', 31: '#cb181d', 32: '#99000d', 33: '#cccccc'
};
const label2color = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
const race2color = {
    black1nh: "rgb(56,153,201)", white1nh: "rgb(251,54,64)", asianpi1nh: "rgb(137,255,167)",
    other1nh: "rgb(167,153,183)", hisp: "rgb(255,240,124)", native1nh: "rgb(232,128,12)"
};
const type2color = {
    0: area_id2color,
    1: label2color,
    2: race2color
};
// 数据集
let data_name = 'dblp';
let init_r = 3;
const data_name2type = {
    'dblp': 0,
    'cs_rankings': 0,
    'forest_covertype': 1,
    'person_activity': 1,
    'hathi_trust_library': 1,
    'dc_census_2012_2016': 2
};

// =====顶部控件栏=====
const control_div = d3.select('body')
    .append('div')
    .style('margin-bottom', '8px')
    .style('display', 'flex')
    .style('width', div_width + 'px')
    .style('height', control_div_height + 'px');
// 顶部控件栏1——数据集下拉框
const choose_input_div = control_div.append('div')
    .attr('id', 'choose_input_div')
    .attr('class', 'dropdown show');
choose_input_div.append('button')
    .attr('class', 'btn btn-secondary dropdown-toggle')
    .attr('type', 'button')
    .attr('id', 'dropdownMenuButton')
    .attr('data-toggle', 'dropdown')
    .attr('aria-haspopup', 'true')
    .attr('aria-expanded', 'false')
    .html(data_name);
choose_input_div.append('div')
    .attr('class', 'dropdown-menu')
    .attr('aria-labelledby', 'dropdownMenuButton')
    .selectAll('a')
    .data(Object.keys(data_name2type)).enter()
    .append('a')
    .attr('class', 'dropdown-item')
    .attr('href', '#')
    .html((d, i) => Object.keys(data_name2type)[i]);
$('a.dropdown-item').on('click', function () {
    const cur_data_name = $(this).text();
    $('#dropdownMenuButton').html(cur_data_name);
    if (cur_data_name !== data_name) {
        data_name = cur_data_name;
        init_r = 3;
        $("#radius_slider").slider('setValue', init_r);
        update_plot(data_name, init_r);
    }
});
// 顶部控件栏2——刻点半径调节器
control_div.append('div')
    .style('margin-left', '30px')
    .append('input')
    .attr('id', 'radius_slider')
    .attr('data-slider-id', 'ex1Slider')
    .attr('type', 'text')
    .attr('data-slider-ticks', '[1, 2, 3, 4, 5]')
    .attr('data-slider-ticks-snap-bounds', 30)
    .attr('data-slider-ticks-labels', '[1, 2, 3, 4, 5]')
    .attr('data-slider-value', 3)
    .attr('data-slider-tooltip', 'hide');
$('#radius_slider').slider({
    formatter: function (value) {
        return 'Current value: ' + value;
    }
})
    .on('slideStop', function (slideEvt) {
        if (slideEvt.value !== init_r) {
            init_r = slideEvt.value;
            update_plot(data_name, init_r);
        }
    });
// 顶部控件栏3——kde宽度调节器
const kde_bandwidth_slider_div = control_div.append('div')
    .style('margin-left', '30px')
    .style('display', 'none');
kde_bandwidth_slider_div.append('input')
    .attr('id', 'kde_bandwidth_slider')
    .attr('data-slider-id', 'ex1Slider')
    .attr('type', 'text')
    .attr('data-slider-min', 4)
    .attr('data-slider-max', 12)
    .attr('data-slider-step', 0.1)
    .attr('data-slider-value', 5);
$('#kde_bandwidth_slider').slider({
    'tooltip_position': 'bottom',
    formatter: function (value) {
        return 'Current value: ' + value;
    }
})
    .on('slideStop', function (slideEvt) {
        kde_bandwidth = slideEvt.value;
        const kde_g = preview_svg.select('#kde_g');
        draw_kde_g(kde_g, kde_bandwidth, kde_threshold);
    });
// 顶部控件栏4——kde阈值调节器
const kde_threshold_slider_div = control_div.append('div')
    .style('margin-left', '20px')
    .style('display', 'none');
kde_threshold_slider_div.append('input')
    .attr('id', 'kde_threshold_slider')
    .attr('data-slider-id', 'ex1Slider')
    .attr('type', 'text')
    .attr('data-slider-min', 5)
    .attr('data-slider-max', 30)
    .attr('data-slider-step', 5)
    .attr('data-slider-value', 5);
$('#kde_threshold_slider').slider({
    'tooltip_position': 'bottom',
    formatter: function (value) {
        return 'Current value: ' + value;
    }
})
    .on('slideStop', function (slideEvt) {
        kde_threshold = slideEvt.value;
        const kde_g = preview_svg.select('#kde_g');
        draw_kde_g(kde_g, kde_bandwidth, kde_threshold);
    });

// =====画图区域=====
const plot_div = d3.select('body')
    .append('div')
    .style('display', 'flex')
    .style('width', div_width + 'px')
    .style('height', div_height + 'px');
// 左侧预览图
const preview_svg = plot_div.append('div')
    .style('margin-right', padding2 + 'px')
    .style('width', preview_width + 'px')
    .style('height', div_height + 'px')
    .style('border', '1px solid #888')
    .append('svg')
    .attr('id', 'preview_svg')
    .attr('width', preview_width)
    .attr('height', div_height);
// 右侧调整工具
const editor_svg = plot_div.append('div')
    .style('width', editor_width + 'px')
    .style('height', div_height + 'px')
    .append('svg')
    .attr('id', 'editor_svg')
    .attr('width', editor_width)
    .attr('height', div_height);

// 
function draw_kde_g(kde_g, bandwidth, kde_threshold) {
    const contour_data = d3.contourDensity()
        .x(d => d.x)
        .y(d => d.y)
        .size([preview_width, div_height])
        .bandwidth(bandwidth)
        .thresholds(kde_threshold)
        (global_data_points);
    const contours = kde_g.selectAll('path').data(contour_data);
    if (is_colorful_contour) {
        const max_value = d3.max(contour_data, d => d.value);
        const color = d3.scaleSequential([0, max_value * 0.9], d3.interpolateYlGnBu);
        contours
            .enter().append('path')
            .merge(contours)
            .attr('stroke', 'none')
            .attr('fill', d => color(d.value))
            .attr('d', d3.geoPath());
    } else {
        contours
            .enter().append('path')
            .attr('fill', 'none')
            .attr('stroke', light_on ? 'black' : 'white')
            .attr('d', d3.geoPath());
    }
    contours.exit().remove();
}

function get_density_bound(bins, ratio = 0.85) {
    const min_target_num = Math.ceil(d3.sum(bins, d => d.length) * ratio);
    let min_bin_num = bins.length;
    let [min_i, min_j] = [0, bins.length - 1];
    for (let i = 0; i < bins.length; i++) {
        let cur_num = 0;
        for (let j = i; j < bins.length; j++) {
            cur_num += bins[j].length;
            if (cur_num >= min_target_num) {
                const cur_min_bin_num = j - i + 1;
                if (cur_min_bin_num < min_bin_num) {
                    min_bin_num = cur_min_bin_num;
                    [min_i, min_j] = [i, j];
                }
                break;
            }
        }
    }
    return [min_i, min_j, bins[min_i].x0, bins[min_j].x1];
}

// 更新两个图表（数据集、顶部刻点半径变化时都会触发）
function update_plot(data_name, init_r) {
    // 每次更新时重置初始化
    is_grey = false;
    show_contour = false;
    show_target_contour = false;
    show_selected_circles = false;
    kde_bandwidth_slider_div.style('display', 'none');
    kde_threshold_slider_div.style('display', 'none');
    const file_path = "static/data/" + data_name + "/" + data_name + "_" + init_r + "_" + init_r + ".json";
    preview_svg.selectAll('*').remove();
    editor_svg.selectAll('*').remove();

    // 读取后端KDE计算得到的文件数据{"x": 622.273, "y": 661.295, "label": 7, "mass": 25.36169, "density": 0.00724}
    d3.json(file_path).then(function (data_points) {
        // ====前序计算====
        // 数据密度归一化并升序排列
        const [init_min_density, init_max_density] = d3.extent(data_points, d => d['density']); // 获取点数据中density最大值与最小值
        for (const p of data_points) p['density'] = (p['density'] - init_min_density) / (init_max_density - init_min_density); // 将density数值归一化到[0, 1]
        data_points.sort((a, b) => a['density'] - b['density']);
        // 推导半径范围0-max,最终作为右侧曲线调整工具的y轴
        const [min_density, max_density] = [0, 1];
        const median_density = d3.median(data_points, d => d['density']);
        const min_r = 0, max_r = init_r * Math.sqrt(max_density / median_density);
        // 将后端的x、y坐标映射到像素空间上
        const preview_x_scale = d3.scaleLinear()
            .domain(d3.extent(data_points, d => d.x))
            .range([padding, preview_width - padding]);
        const preview_y_scale = d3.scaleLinear()
            .domain(d3.extent(data_points, d => d.y))
            .range([padding, div_height - padding]);
        for (const p of data_points) {
            p.x = preview_x_scale(p.x);
            p.y = preview_y_scale(p.y);
        }
        global_data_points = data_points;

        // ====为右侧调整工具计算两条参考线（轻微重叠警告的虚线，严重重叠警告的实线）=====
        // 把所有刻点按照density分成50个直方图桶
        const bin_count = 50;
        const thresholds = d3.range(min_density, max_density, (max_density - min_density) / bin_count);
        const histogram = d3.histogram()
            .value(d => d['density'])
            .domain([min_density, max_density])
            .thresholds(thresholds);
        const bins = histogram(data_points);
        // 使用 VPTree 查近邻，估算每个 bin 的"不重叠临界半径"
        const vptree = VPTreeFactory.build(data_points, dis);
        const reference_line_points = [];
        const serious_reference_line_points = [];
        for (const bin of bins) {
            const shuffled_bin = d3.shuffle(bin.slice())
                .slice(0, Math.max(10, Math.ceil(bin.length * 0.2)));
            let overlap_r = d3.mean(shuffled_bin, p => d3.mean(vptree.search(p, 3).slice(1), d => d.d) / 2);
            if (overlap_r === undefined) overlap_r = reference_line_points[reference_line_points.length - 1][1];
            let overlap_serious_r = overlap_r / (3 / 4);
            reference_line_points.push([(bin.x0 + bin.x1) / 2, overlap_r]);
            serious_reference_line_points.push([(bin.x0 + bin.x1) / 2, overlap_serious_r])
        }
        // 确定半径调整工具的上下限
        const [i, j, density_lower_bound, density_upper_bound] = get_density_bound(bins, 0.9);
        const r_lower_bound = init_r <= 1 ? init_r * 0.6 : Math.max(1.5, init_r * 1 / 3);
        const r_upper_bound = reference_line_points[j][1];

        // ======绘制左侧预览区=====
        // 初始状态下所有点半径相同，后续用户通过半径调整工具调整
        const init_r_scale = d3.scaleLinear()
            .domain([density_lower_bound, density_upper_bound])
            .range([init_r, init_r]);
        // 创建裁剪路径，当用户缩放/平移散点图时，超出svg边界的内容裁掉
        preview_svg.append('clipPath')
            .attr('id', 'previewClipPath')
            .append('rect')
            .attr('width', preview_width)
            .attr('height', div_height);
        preview_svg.attr('clip-path', 'url(#previewClipPath)');
        // 背景
        const bg_rect = preview_svg.append('rect')
            .attr('id', 'preview_bg_rect')
            .attr('width', preview_width)
            .attr('height', div_height)
            .attr('fill-opacity', light_on ? 0 : 1)
            .attr('fill', 'black');
        // 三个图层：原始散点图、KDE等高线密度图、用户通过密度笔刷选中的红色高亮点
        const circles_g = preview_svg.append('g').attr('id', 'circles_g');
        const kde_g = preview_svg.append('g').attr('id', 'kde_g');
        const selected_circles_g = preview_svg.append('g').attr('id', 'selected_circles_g');
        // 绘制初始散点图
        const colors = type2color[data_name2type[data_name]];
        const data_point_circles = circles_g.selectAll('circle')
            .data(data_points, d => d.id)
            .enter().append('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => d.r = init_r_scale(d['density']))
            .attr('fill', d => colors[d['label']]);
        // 总共点数文字标签
        const point_num_text = preview_svg.append('text')
            .attr('font-size', '20px')
            .attr('font-family', 'helvetica')
            .attr('alignment-baseline', 'hanging')
            .attr('text-anchor', 'start')
            .attr('x', 10)
            .attr('y', 10)
            .attr('fill', light_on ? 'black' : 'white')
            .text('point num: ' + data_points.length);
        // 覆盖整个svg的透明矩形，用于监听zoom事件
        // 缩放行为
        const zoom = d3.zoom()
            .extent([[0, 0], [preview_width, div_height]])
            .scaleExtent([1 / 8, 8])
            .on("zoom", function () {
                circles_g.attr('transform', d3.event.transform);
                kde_g.attr('transform', d3.event.transform);
                selected_circles_g.attr('transform', d3.event.transform);
            });
        const event_rect = preview_svg.append('rect')
            .attr('id', 'preview_event_rect')
            .attr('width', preview_width)
            .attr('height', div_height)
            .attr('fill-opacity', 0)
            .call(zoom);
        // 右上角工具栏
        const toolbox_g = preview_svg.append('g')
            .attr('id', 'toolbox_g')
            .attr('transform', `translate(${preview_width - 22}, 20)`);
        // 右侧工具1——fit：重置zoom，恢复至初始视角
        const fit_text = toolbox_g.append('text')
            .attr('id', 'fit_text')
            .attr('class', 'fas')
            .attr('text-anchor', 'middle')
            .attr('font-size', '22px')
            .attr('font-family', 'helvetica')
            .attr('alignment-baseline', 'central')
            .attr('fill', light_on ? 'black' : 'white')
            .style('pointer-events', 'all')
            .on('mousedown', function () {
                d3.event.stopPropagation();
            })
            .on('click', function () {
                event_rect.call(zoom.transform, d3.zoomIdentity);
            })
            .text('\uf31e');
        fit_text.append('title')
            .text('fit');
        // 右侧工具2 —— 切换灰度、彩色模式
        const grey_text = toolbox_g.append('text')
            .attr('id', 'grey_text')
            .attr('class', 'fas')
            .attr('y', 35)
            .attr('text-anchor', 'middle')
            .attr('font-size', '25px')
            .attr('font-family', 'helvetica')
            .attr('alignment-baseline', 'central')
            .attr('fill', light_on ? 'black' : 'white')
            .style('pointer-events', 'all')
            .on('mousedown', function () {
                d3.event.stopPropagation();
            })
            .on('click', function () {
                if (is_grey) {
                    data_point_circles.attr('fill', d => colors[d['label']]);
                    grey_text.text('\uf043');
                    is_grey = false;
                } else {
                    if (light_on) data_point_circles.attr('fill', 'black');
                    else data_point_circles.attr('fill', 'white');
                    grey_text.text('\uf5c7');
                    is_grey = true;
                }
            }).text('\uf043');
        grey_text.append('title')
            .text('desaturate colors');
        // 右侧工具3 —— 切换显示/隐藏等高线
        const contour_text = toolbox_g.append('text')
            .attr('id', 'contour_text')
            .attr('class', 'far')
            .attr('y', 70)
            .attr('text-anchor', 'middle')
            .attr('font-size', '25px')
            .attr('font-family', 'helvetica')
            .attr('alignment-baseline', 'central')
            .attr('fill', light_on ? 'black' : 'white')
            .style('pointer-events', 'all')
            .on('mousedown', function () {
                d3.event.stopPropagation();
            })
            .on('click', function () {
                if (show_contour) {
                    kde_g.selectAll('*').remove();
                    show_contour = false;
                    contour_text.attr('class', 'far').text('\uf111');
                    kde_bandwidth_slider_div.style('display', 'none');
                    kde_threshold_slider_div.style('display', 'none');
                    colorful_contour_text
                        .attr('opacity', 0)
                        .style('pointer-events', 'none');
                } else {
                    draw_kde_g(kde_g, kde_bandwidth, kde_threshold);
                    show_contour = true;
                    contour_text.attr('class', 'fas').text('\uf140');
                    kde_bandwidth_slider_div.style('display', 'block');
                    kde_threshold_slider_div.style('display', 'block');
                    colorful_contour_text
                        .attr('opacity', 1)
                        .style('pointer-events', 'all');
                }
            })
            .text('\uf111');
        contour_text.append('title')
            .text('show contours');
        // 右侧工具4 —— 等高线是否着色
        const colorful_contour_text = toolbox_g.append('text')
            .attr('id', 'colorful_contour_text')
            .attr('class', 'fas')
            .attr('x', -35)
            .attr('y', 70)
            .attr('text-anchor', 'middle')
            .attr('font-size', '25px')
            .attr('font-family', 'helvetica')
            .attr('alignment-baseline', 'central')
            .attr('fill', light_on ? 'black' : 'white')
            .attr('opacity', 0)
            .style('pointer-events', 'none')
            .on('mousedown', function () {
                d3.event.stopPropagation();
            })
            .on('click', function () {
                if (show_contour) {
                    if (is_colorful_contour) {
                        is_colorful_contour = false;
                        kde_g.selectAll('path')
                            .attr('fill', 'none')
                            .attr('stroke', light_on ? 'black' : 'white');

                    } else {
                        is_colorful_contour = true;
                        const contour_paths = kde_g.selectAll('path');
                        const contour_data = contour_paths.data();
                        const max_value = d3.max(contour_data, d => d.value);
                        const color = d3.scaleSequential([0, max_value * 0.9], d3.interpolateYlGnBu);
                        contour_paths
                            .attr('stroke', 'none')
                            .attr('fill', d => color(d.value));
                    }
                }
            })
            .text('\uf576');
        colorful_contour_text.append('title')
            .text('fill contours');
        // 右侧工具5 —— 切换暗亮背景
        const light_text = toolbox_g.append('text')
            .attr('id', 'fit_text')
            .attr('class', 'far')
            .attr('y', 105)
            .attr('text-anchor', 'middle')
            .attr('font-size', '25px')
            .attr('font-family', 'helvetica')
            .attr('alignment-baseline', 'central')
            .attr('fill', light_on ? 'black' : 'white')
            .style('pointer-events', 'all')
            .on('mousedown', function () {
                d3.event.stopPropagation();
            })
            .on('click', function () {
                if (light_on) {
                    light_on = false;
                    light_text.text('\uf0eb');
                    bg_rect.attr('fill-opacity', 1);
                    toolbox_g.selectAll('text').attr('fill', 'white');
                    point_num_text.attr('fill', 'white');
                    if (is_grey) data_point_circles.attr('fill', 'white');
                    if (!is_colorful_contour) kde_g.selectAll('path').attr('stroke', 'white');
                } else {
                    light_on = true;
                    light_text.text('\uf0eb');
                    bg_rect.attr('fill-opacity', 0);
                    toolbox_g.selectAll('text').attr('fill', 'black');
                    point_num_text.attr('fill', 'black');
                    if (is_grey) data_point_circles.attr('fill', 'black');
                    if (!is_colorful_contour) kde_g.selectAll('path').attr('stroke', 'black');
                }
            })
            .text('\uf0eb');
        light_text.append('title')
            .text('control the light');


        // ====右侧曲线调整工具====
        // 创建裁剪路径，防止曲线溢出
        editor_svg.append('clipPath')
            .attr('id', 'curveAreaClipPath')
            .append('rect')
            .attr('width', curve_g_width)
            .attr('height', curve_g_height);
        const x_scale = d3.scaleLinear()
            .domain([min_density, max_density])
            .range([0, curve_g_width]);
        const y_scale = d3.scaleLinear()
            .domain([min_r, max_r])
            .range([0, curve_g_height]);
        // 拖拽可移动点时的可行域提示框
        const feasible_region = editor_svg.append('rect')
            .attr('id', 'feasible_region')
            .attr('transform', `translate(${brush_thickness + padding}, ${0})`)
            .attr('fill', '#eee')
            .attr('stroke', '#888')
            .attr('pointer-events', 'none')
            .attr('opacity', 0);
        // kde图展示区 
        const target_kde_g_width = curve_g_width * 0.4;
        const target_kde_g_height = target_kde_g_width;
        const target_kde_g = editor_svg.append('g')
            .attr('id', 'target_kde_g')
            .attr('transform', `translate(${brush_thickness + padding + curve_g_width - target_kde_g_width}, ${0})`);
        // 直方图 
        // 直方图容器
        const histogram_g = editor_svg.append('g')
            .attr('id', 'histogram_g')
            .attr('clip-path', 'url(#curveAreaClipPath)')
            .attr('transform', `translate(${brush_thickness + padding}, ${0})`);
        // 直方图柱条
        const h_y_scale = d3.scaleLinear()
            .domain([0, d3.max(bins.map(x => x.length))])
            .range([0, curve_g_height * 0.8]);
        histogram_g.selectAll("rect").data(bins)
            .enter()
            .append("rect")
            .attr('class', 'histogram_rect')
            .attr("fill", "#69b3a2")
            .attr('id', (d, i) => 'rect_' + i)
            .attr('x', d => x_scale(d.x0))
            .attr('y', d => curve_g_height - h_y_scale(d.length))
            .attr("height", d => h_y_scale(d.length))
            .attr("width", d => Math.max(x_scale(d.x1) - x_scale(d.x0) - 1, 0));
        // 直方图柱顶数值标签
        const show_text_threshold = 15;
        const text_opacity = curve_g_width / bins.length > show_text_threshold ? 1 : 0;
        histogram_g.selectAll('text').data(bins)
            .enter()
            .append('text')
            .attr('x', d => x_scale(d.x0) + curve_g_width / bins.length / 2)
            .attr('y', d => curve_g_height - h_y_scale(d.length))
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'ideographic')
            .attr('font-size', 10 + 'px')
            .attr('font-family', 'helvetica')
            .attr('fill', 'black')
            .attr('opacity', d => (text_opacity && d.length !== 0) ? 1 : 0)
            .text(d => d.length);
        // 右侧y轴
        h_y_scale.range([curve_g_height, 0]);
        editor_svg.append('g')
            .attr('id', 'histogram_axis_g')
            .attr('transform', `translate(${editor_width - padding}, ${0})`)
            .attr('class', 'axis')
            .call(d3.axisRight(h_y_scale).ticks(5, "f"));
        h_y_scale.range([0, curve_g_height * 0.8]);
        // 右侧y轴标签
        editor_svg.append("text")
            .attr('id', 'histogram_axis_label')
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr('alignment-baseline', 'central')
            .attr('font-size', 15 + 'px')
            .attr('font-family', 'helvetica')
            .attr('fill', 'black')
            .attr("x", -10)
            .attr("y", editor_width - padding - 14)
            .text("Point Num");
        editor_svg.append("rect")
            .attr('id', 'histogram_label_rect')
            .attr('fill', '#69b3a2')
            .attr('width', 15)
            .attr('height', 15)
            .attr("x", editor_width - padding - 20)
            .attr("y", 90)
            .text("Point Num");
        // 左侧y轴
        y_scale.range([curve_g_height, 0]);
        const y_axis_g = editor_svg.append('g')
            .attr('id', 'y_axis_g')
            .attr('transform', `translate(${brush_thickness + padding}, ${0})`)
            .attr('class', 'axis')
            .call(d3.axisLeft(y_scale).ticks(8, "f"));
        // 左侧y轴标签
        editor_svg.append("text")
            .attr('id', 'y_axis_label')
            .attr("text-anchor", "end")
            .attr('alignment-baseline', 'central')
            .attr("transform", "rotate(-90)")
            .attr('font-size', 15 + 'px')
            .attr('font-family', 'helvetica')
            .attr('fill', 'black')
            .attr("x", -10)
            .attr("y", padding + brush_thickness / 2 - 10)
            .text("Radius");
        y_scale.range([0, curve_g_height]);
        // x轴
        const x_axis_g = editor_svg.append('g')
            .attr('id', 'x_axis_g')
            .attr('transform', `translate(${brush_thickness + padding}, ${curve_g_height})`)
            .attr('class', 'axis')
            .call(d3.axisBottom(x_scale).ticks(5, "f"));
        editor_svg.append("text")
            .attr('id', 'x_axis_label')
            .attr("text-anchor", "end")
            .attr('alignment-baseline', 'central')
            .attr('font-size', 15 + 'px')
            .attr('font-family', 'helvetica')
            .attr('fill', 'black')
            .attr("x", editor_width - padding - 10)
            .attr("y", div_height - padding2 - brush_thickness / 2)
            .text("Local Density");
        // 初始化调整曲线的端锚点、5个可拖拽点
        let left_axis_point = [0, y_scale(r_lower_bound)];
        let right_axis_point = [curve_g_width, y_scale(r_upper_bound)];
        let control_points = [];
        const step = (density_upper_bound - density_lower_bound) / 4;
        for (const density of d3.range(density_lower_bound, density_upper_bound + 0.001, step)) {
            control_points.push([x_scale(density), y_scale(init_r_scale(density))]);
        }
        const straight_line = d3.line()
            .y(d => curve_g_height - d[1]);
        // 曲线编辑区
        const adjust_curve_g = editor_svg.append('g')
            .attr('id', 'adjust_curve_g')
            .attr('clip-path', 'url(#curveAreaClipPath)')
            .attr('transform', `translate(${brush_thickness + padding}, ${0})`);
        const background_rect = adjust_curve_g
            .append('rect')
            .attr('id', 'background_rect')
            .attr('width', curve_g_width)
            .attr('height', curve_g_height)
            .attr('fill', '#ddd')
            .attr('fill-opacity', 0.2);
        // 监听光标在编辑区域移动，在曲线上悬停靠近时可插入新控制点的交互
        background_rect
            .on('mousemove', function () {                
                const m = d3.mouse(this);
                if (m[0] < control_points[0][0] && m[0] > control_points[control_points.length - 1][0])
                    return null;
                const closest = closestPoint(curve.node(), m);
                let index = -1;
                const bg_rect_drag = d3.drag()
                    .on("start", bg_rect_drag_start)
                    .on("drag", bg_rect_drag_move)
                    .on("end", bg_rect_drag_end);

                let left_limit = x_scale_(min_density), right_limit = x_scale_(max_density);

                function bg_rect_drag_start() {
                    const drag_p = d3.mouse(this);
                    for (let i = 0; i < control_points.length; i++) {
                        if (drag_p[0] < control_points[i][0]) {
                            index = i;
                            break;
                        }
                    }
                    control_points.splice(index, 0, [drag_p[0], curve_g_height - drag_p[1]]);
                    update_curve();

                    left_limit = Math.max(control_points[index - 1][0], 0);
                    right_limit = Math.min(control_points[index + 1][0], curve_g_width);
                    feasible_region
                        .attr('width', right_limit - left_limit)
                        .attr('height', curve_g_height)
                        .attr('x', left_limit)
                        .attr('y', 0);
                }

                let trigger_drag = true;

                function bg_rect_drag_move() {
                    if (!trigger_drag) return;
                    // feasible_region.attr('opacity', 1);
                    const drag_p = d3.mouse(this);
                    control_points[index][0] = drag_p[0];
                    control_points[index][1] = curve_g_height - drag_p[1];

                    update_curve();
                    if (drag_p[0] >= right_limit || drag_p[0] <= left_limit) {
                        control_points.splice(index, 1);
                        update_curve();
                        trigger_drag = false;
                    }
                }

                function bg_rect_drag_end() {
                    feasible_region.attr('opacity', 0);
                    const xs = data_points.map(d => x_scale_(d.density));
                    const rs = yOnPath(curve.node(), xs, curve_g_height).map(y => y_scale_.invert(y));
                    data_point_circles.attr('r', (d, i) => d.r = rs[i]);
                    if (show_selected_circles) update_selected_circles();
                }

                if (closest.distance < dis1 && m[0] > control_points[0][0] && m[0] < control_points[control_points.length - 1][0]) {
                    d3.select(this)
                        .attr('cursor', 'crosshair')
                        .call(bg_rect_drag);
                } else {
                    d3.select(this).attr('cursor', 'default')
                        .on('.drag', null)
                        .on('click', null);
                }
            });
        // 三条曲线：编辑曲线、普通参考线（红色虚线）、严重参考线（红色实线）
        const curve_g = adjust_curve_g.append('g').attr('id', 'curve_g');
        const curve = curve_g.append('path')
            .attr('id', 'curve')
            .attr('fill', 'none')
            .attr('stroke', '#888')
            .attr('stroke-width', 2)
            .attr('pointer-events', 'none');
        const reference_line = curve_g.append('path')
            .attr('id', 'reference_line')
            .attr('stroke', 'red')
            .attr('fill', 'none')
            .attr('stroke-dasharray', '5, 3')
            .attr('pointer-events', 'none');
        const serious_reference_line = curve_g.append('path')
            .attr('id', 'serious_reference_line')
            .attr('stroke', 'red')
            .attr('fill', 'none')
            .attr('pointer-events', 'none');

        
        // 两种调整工具的曲线
        const curve1 = d3.curveMonotoneX;
        const curve2 = d3.curveCatmullRom.alpha(1);
        const curve_line = d3.line().curve(curve1)
            .x(d => d[0])
            .y(d => curve_g_height - d[1]);
        // 按钮1——应用曲线1
        const checked_color = '#ff7f00';
        editor_svg.append('rect')
            .attr('id', 'curve1_rect')
            .attr('width', 20)
            .attr('height', 20)
            .attr('x', brush_thickness + padding + 10)
            .attr('y', 8)
            .attr('rx', 3)
            .attr('stroke', checked_color)
            .attr('fill', checked_color)
            .on('click', function () {
                curve_line.curve(curve1);
                editor_svg.select('#curve2_rect').attr('fill', 'white');
                d3.select(this).attr('fill', checked_color);
                draw_curve();
            })
            .append('title')
            .text('curveMonotoneX' + '\n' + 'preserves monotonicity in y');
        // 按钮2——应用曲线2
        editor_svg.append('rect')
            .attr('id', 'curve2_rect')
            .attr('width', 20)
            .attr('height', 20)
            .attr('x', brush_thickness + padding + 38)
            .attr('y', 8)
            .attr('rx', 3)
            .attr('stroke', checked_color)
            .attr('fill', 'white')
            .on('click', function () {
                curve_line.curve(curve2);
                editor_svg.select('#curve1_rect').attr('fill', 'white');
                d3.select(this).attr('fill', checked_color);
                draw_curve();
            })
            .append('title')
            .text('curveCatmullRom' + '\n' + 'more natural');
        // 显示/隐藏kde图的按钮
        const target_contour_text = editor_svg.append('text')
            .attr('id', 'target_contour_text')
            .attr('class', 'far')
            .attr('x', brush_thickness + padding + 20)
            .attr('y', 50)
            .attr('text-anchor', 'middle')
            .attr('font-size', '25px')
            .attr('font-family', 'helvetica')
            .attr('alignment-baseline', 'central')
            .attr('fill', 'black')
            .style('pointer-events', 'all')
            .on('mousedown', function () {
                d3.event.stopPropagation();
            })
            .on('click', function () {
                if (show_target_contour) {
                    show_target_contour = false;
                    target_kde_g.selectAll('*').remove();
                    target_contour_text.attr('class', 'far').text('\uf111');
                } else {
                    if (target_kde_g.select('image').empty()) {
                        const file_path = "static/data/" + data_name + "/" + "kde_white.png";
                        target_kde_g.append("image")
                            .attr('width', target_kde_g_width)
                            .attr('height', target_kde_g_height)
                            .attr("xlink:href", file_path);
                        target_kde_g.append('rect')
                            .attr('y', 1)
                            .attr('width', target_kde_g_width)
                            .attr('height', target_kde_g_height)
                            .attr('fill', 'none')
                            .attr('stroke', '#888');
                    }
                    show_target_contour = true;
                    target_contour_text.attr('class', 'fas').text('\uf140');
                }
            })
            .text('\uf111');
        target_contour_text.append('title')
            .text('show contours');
        // 是否显示使用红色当前笔刷所覆盖密度区间的圆圈的按钮
        const brush_height = 30;
        const selected_circles_text = editor_svg.append('text')
            .attr('id', 'show_selected_circles_text')
            .attr('class', 'far')
            .attr('x', brush_thickness + padding + curve_g_width - 10)
            .attr('y', curve_g_height - brush_height - 10)
            .attr('text-anchor', 'end')
            .attr('font-size', '25px')
            .attr('font-family', 'helvetica')
            .attr('alignment-baseline', 'bottom')
            .attr('fill', 'black')
            .style('pointer-events', 'all')
            .on('mousedown', function () {
                d3.event.stopPropagation();
            })
            .on('click', function () {
                console.log(show_selected_circles);
                
                if (show_selected_circles) {
                    show_selected_circles = false;
                    selected_circles_text.text('\uf0c8');
                    selected_circles_g.selectAll('*').remove();
                } else {
                    show_selected_circles = true;
                    selected_circles_text.text('\uf14a');
                }
            })
            .text('\uf0c8');
        
        
        // ====笔刷功能，滑动选中将在左侧散点图中红色显示当前密度区间的点====
        // 红色高亮展示左侧散点图中的选中圆点
        function update_selected_circles() {
            const selected_data_points = data_points
                .filter(d => d['density'] >= min_density_ && d['density'] <= max_density_);
            const selected_circles = selected_circles_g.selectAll('circle')
                .data(selected_data_points);
            console.log(d3.mean(selected_data_points, d => d['density']));
            const delaunay = d3.Delaunay.from(data_points, d => d.x, d => d.y);
            const distances = [];
            for (const p of selected_data_points) {
                const index = data_points.indexOf(p);
                const neighbors = delaunay.neighbors(index);
                for (const id of neighbors) {
                    distances.push(dis(data_points[index], data_points[id]) - 2 * init_r);
                }
            }
            selected_circles.enter()
                .append('circle')
                .attr('fill', 'red')
                .merge(selected_circles)
                .attr('cx', d => d.x)
                .attr('cy', d => d.y)
                .attr('r', d => d.r);
            selected_circles.exit().remove();
        }
        // 横向笔刷，拖拽结束触发brush_end
        const brush = d3.brushX()
            .extent([[0, 0], [curve_g_width, brush_height]])
            .on("end", brush_end);
        function brush_end() {
            if (d3.event.selection && show_selected_circles) {
                [min_density_, max_density_] = d3.event.selection.map(x_scale_.invert);
                update_selected_circles();
            }
        }
        // 笔刷元素添加上svg
        const defaultSelection = [100, 200];
        let min_density_ = x_scale(defaultSelection[0]),
            max_density_ = x_scale(defaultSelection[1]);
        const brush_g = editor_svg.append('g')
            .attr('id', 'brush_g')
            .attr('transform', `translate(${brush_thickness + padding}, ${curve_g_height - brush_height})`);
        brush_g.append('rect')
            .attr('width', curve_g_width)
            .attr('height', brush_height)
            .attr('fill', '#ddd')
            .attr('fill-opacity', 0.5);
        brush_g.call(brush)
            .call(brush.move, defaultSelection);
        // ====x轴缩放笔刷，拖动最右侧x轴来选择密度范围局部查看====
        let brushed_x_min = 0, brushed_x_max = max_density;
        const brush_x_g = editor_svg.append('g')
            .attr('id', 'brush_x_g')
            .attr('transform', `translate(${brush_thickness + padding}, ${curve_g_height})`);
        brush_x_g.append('rect')
            .attr('id', 'brush_bg_rect')
            .attr('width', curve_g_width)
            .attr('height', brush_thickness)
            .attr('fill', '#ddd')
            .attr('fill-opacity', 0.5);
        const brush_X = d3.brushX()
            .extent([[0, 0], [curve_g_width, brush_thickness]])
            .on("brush", brushing_x)
            .on("end", brush_end_x);
        // x轴刻度
        editor_svg.append('g')
            .attr('id', 'brush_x_axis_g')
            .attr('transform', `translate(${brush_thickness + padding}, ${curve_g_height + brush_thickness})`)
            .attr('class', 'axis')
            .call(d3.axisBottom(x_scale).ticks(5, "f"));
        const x_scale_ = d3.scaleLinear()
            .domain([min_density, max_density])
            .range([0, curve_g_width]);
        const y_scale_ = d3.scaleLinear()
            .domain([min_r, max_r])
            .range([0, curve_g_height]);
        function brushing_x() {
            if (d3.event.selection) {
                [brushed_x_min, brushed_x_max] = d3.event.selection.map(x_scale.invert);
                if (brushed_x_max === brushed_x_min) return;
                x_axis_g.call(d3.axisBottom(x_scale_).ticks(5, "f"));
                const right_axis_value = x_scale_.invert(right_axis_point[0]);
                const left_axis_value = x_scale_.invert(left_axis_point[0]);
                const point_values = control_points.map(p => x_scale_.invert(p[0]));
                x_scale_.domain([brushed_x_min, brushed_x_max]);
                right_axis_point[0] = x_scale_(right_axis_value);
                left_axis_point[0] = x_scale_(left_axis_value);
                control_points = point_values.map((p_v, i) => [x_scale_(p_v), control_points[i][1]]);

                histogram_g.selectAll("rect")
                    .attr('width', d => Math.max(x_scale_(d.x1) - x_scale_(d.x0) - 1, 0))
                    .attr('x', d => x_scale_(d.x0));
                const rect_width = histogram_g.select('rect').attr('width');
                if (rect_width >= show_text_threshold) {
                    histogram_g.selectAll('text')
                        .attr('x', d => x_scale_(d.x0) + rect_width / 2)
                        .attr('y', d => curve_g_height - h_y_scale(d.length))
                        .attr('opacity', d => d.length === 0 ? 0 : 1);
                } else {
                    histogram_g.selectAll('text')
                        .attr('opacity', 0);
                }
                update_curve();
            }
        }
        function brush_end_x() {
            if (!d3.event.selection) {
                brush_x_g.call(brush_X.move, defaultSelection_x);
            }
        }
        const defaultSelection_x = [0, curve_g_width];
        brush_x_g
            .call(brush_X)
            .call(brush_X.move, defaultSelection_x);

        // ====y轴缩放笔刷，拖动最上侧y轴来选择密度范围局部查看====
        let brushed_y_min = 0, brushed_y_max = max_r;
        const brush_y_g = editor_svg.append('g')
            .attr('id', 'brush_y_g')
            .attr('transform', `translate(${padding}, ${0})`);
        y_scale.range([curve_g_height, 0]);
        // y轴刻度
        editor_svg.append('g')
            .attr('id', 'brush_y_axis_g')
            .attr('transform', `translate(${padding}, ${0})`)
            .attr('class', 'axis')
            .call(d3.axisLeft(y_scale).ticks(8, "f"));
        y_scale.range([0, curve_g_height]);
        brush_y_g.append('rect')
            .attr('id', 'brush_bg_rect')
            .attr('width', brush_thickness)
            .attr('height', curve_g_height)
            .attr('fill', '#ddd')
            .attr('fill-opacity', 0.5);
        const brush_Y = d3.brushY()
            .extent([[0, 0], [brush_thickness, curve_g_height]])
            .on("brush", brushing_y)
            .on("end", brush_end_y);
        function brushing_y() {
            if (d3.event.selection) {
                const temp = d3.event.selection.map(y_scale.invert);
                if (temp[0] === temp[1]) return;
                brushed_y_min = max_r - temp[1];
                brushed_y_max = max_r - temp[0] + min_r;
                y_scale_.range([curve_g_height, 0]);
                y_axis_g.call(d3.axisLeft(y_scale_).ticks(8, "f"));
                y_scale_.range([0, curve_g_height]);
                const right_axis_value = y_scale_.invert(right_axis_point[1]);
                const left_axis_value = y_scale_.invert(left_axis_point[1]);
                const point_values = control_points.map(p => y_scale_.invert(p[1]));
                y_scale_.domain([brushed_y_min, brushed_y_max]);
                right_axis_point[1] = y_scale_(right_axis_value);
                left_axis_point[1] = y_scale_(left_axis_value);
                control_points = point_values.map((p_v, i) => [control_points[i][0], y_scale_(p_v)]);
                update_curve();
            }
        }
        function brush_end_y() {
            if (!d3.event.selection) {
                brush_y_g.call(brush_Y.move, defaultSelection_y);
            }
        }
        const defaultSelection_y = [0, curve_g_height];
        brush_y_g
            .call(brush_Y)
            .call(brush_Y.move, defaultSelection_y);

        // ====功能函数====
        function draw_curve() {
            let combined_d = straight_line([left_axis_point, control_points[0]])
                + curve_line(control_points)
                + straight_line([control_points[control_points.length - 1], right_axis_point]);
            curve.attr('d', combined_d);
            const reference = reference_line_points.map(p => [x_scale_(p[0]), y_scale_(p[1])]);
            reference_line.attr('d', curve_line(loss_regression(reference)));
            const serious_reference = serious_reference_line_points.map(p => [x_scale_(p[0]), y_scale_(p[1])]);
            serious_reference_line.attr('d', curve_line(loss_regression(serious_reference)));
        }
        // 
        function update_curve() {
            draw_curve();
            const control_point_drag = d3.drag()
                .on("start", drag_start)
                .on("drag", drag_move)
                .on("end", drag_end);
            const control_circles = curve_g.selectAll('.control_point').data(control_points, (d, i) => 'cp_' + i);
            control_circles.enter()
                .append('circle')
                .attr('id', (d, i) => 'cp_' + i)
                .attr('class', 'control_point')
                .attr('r', 6)
                .attr('stroke', 'none')
                .call(control_point_drag)
                .on('mouseover', function () {
                    d3.select(this).attr('cursor', 'move');
                })
                .on('mouseout', function () {
                    d3.select(this).attr('cursor', 'default');
                })
                .merge(control_circles)
                .attr('fill', 'grey')
                .attr('cx', d => d[0])
                .attr('cy', d => curve_g_height - d[1]);
            control_circles.exit().remove();
            let left_limit = x_scale_(min_density), right_limit = x_scale_(max_density);
            let trigger = true;
            function drag_start(d, i) {
                trigger = true;
                background_rect.attr('cursor', 'default');
                d3.select(this)
                    .attr('fill', 'black')
                    .attr('r', 8);
                left_limit = Math.max(i === 0 ? 0 : control_points[i - 1][0], 0);
                right_limit = Math.min(i === control_points.length - 1 ? curve_g_width : control_points[i + 1][0], curve_g_width);
                feasible_region
                    .attr('width', right_limit - left_limit)
                    .attr('height', curve_g_height)
                    .attr('x', left_limit)
                    .attr('y', 0)
                    .attr('opacity', 1);
            }
            let up_limit = curve_g_height, down_limit = 0;
            let merge_to_index = -1;
            function drag_move(d, i) {
                if (!trigger) return;
                let m = d3.mouse(this);
                m[1] = curve_g_height - m[1];
                m = [Math.min(Math.max(m[0], left_limit), right_limit),
                    Math.max(Math.min(m[1], up_limit), down_limit)];
                d3.select(this)
                    .attr('cx', m[0])
                    .attr('cy', curve_g_height - m[1]);

                const left_end = x_scale_(min_density);
                const right_end = x_scale_(max_density);

                control_points[i] = m;

                if (i === 0) left_axis_point = [left_end, m[1]];
                else if (i === control_points.length - 1) right_axis_point = [right_end, m[1]];
                draw_curve(control_points);

                merge_to_index = -1;
                if (i === 0) {
                    if (distance(m, control_points[1]) < dis2) {
                        merge_to_index = 1;
                    }
                } else if (i === control_points.length - 1) {
                    if (distance(m, control_points[control_points.length - 2]) < dis2) {
                        merge_to_index = control_points.length - 2;
                    }
                } else {
                    const cur_index = distance(m, control_points[i + 1]) > distance(m, control_points[i - 1]) ? (i - 1) : (i + 1);
                    if (distance(m, control_points[cur_index]) < dis2) {
                        merge_to_index = cur_index;
                    }
                }
                if (merge_to_index !== -1 && control_points.length > 2) {
                    curve_g.select('#cp_' + merge_to_index).attr('fill', 'red');
                } else {
                    curve_g.select('#cp_' + (i + 1)).attr('fill', 'grey');
                    curve_g.select('#cp_' + (i - 1)).attr('fill', 'grey');
                }
            }
            function drag_end(d, i) {
                d3.select(this)
                    .attr('fill', 'grey')
                    .attr('r', 6);
                feasible_region
                    .attr('opacity', 0);

                const left_end = x_scale_(min_density);
                const right_end = x_scale_(max_density);
                if (merge_to_index !== -1 && control_points.length > 2 && trigger) {
                    if (i === 0) left_axis_point = [left_end, control_points[1][1]];
                    else if (i === control_points.length - 1) right_axis_point = [right_end, control_points[control_points.length - 2][1]];
                    control_points.splice(i, 1);
                    update_curve();
                }
                const xs = data_points.map(d => x_scale_(d.density));
                const rs = yOnPath(curve.node(), xs, curve_g_height).map(y => y_scale_.invert(y));
                data_point_circles.attr('r', (d, i) => d.r = rs[i]);
                if (show_selected_circles) update_selected_circles();
            }
        }
    })
        .catch(function (error) {
            console.log(error);
        });
}

update_plot(data_name, init_r);