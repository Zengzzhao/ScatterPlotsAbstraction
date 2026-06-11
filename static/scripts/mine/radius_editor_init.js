const svg_w = 1548, svg_height = 700, preview_g_w = 700, editor_g_w = 680, padding = 20;
const dis1 = 50, dis2 = 20;
const brush_thickness = 50;
const curve_g_width = editor_g_w - padding * 2 - brush_thickness;
const curve_g_height = svg_height - padding - brush_thickness;
let light_on = true;

const area_id2color = {
    0: '#cfe1f2', 1: '#a5cce4', 2: '#6daed5', 3: '#3c8bc3', 4: '#1864aa', 5: '#d3eecd', 6: '#c4e8be',
    7: '#b5e1ae', 8: '#a4da9e', 9: '#91d18e', 10: '#7dc87f', 11: '#68be72', 12: '#54b366', 13: '#41a75b',
    14: '#319a50', 15: '#238c46', 16: '#157f3b', 17: '#fdd8b3', 18: '#fb8d3d', 19: '#c44103', 20: '#e2e1ef',
    21: '#c9c9e2', 22: '#acabd2', 23: '#908cc1', 24: '#7769b0', 25: '#61409b', 26: '#fee5d9', 27: '#fcbba1',
    28: '#fc9272', 29: '#fb6a4a', 30: '#ef3b2c', 31: '#cb181d', 32: '#99000d', 33: '#cccccc'
};

const colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];

d3.json("static/data/full_3_3_results.json").then(function (data_points) {
    console.log(data_points.length);
    data_points.sort((a, b) => a['density'] - b['density']);
    const init_r = 3;
    const min_r = 0, max_r = init_r * 1.5;
    console.log(d3.extent(data_points, d => d.density));
    // const [min_density, max_density] = d3.extent(data_points, d => d.density);
    const [min_density, max_density] = [0, 1];
    const cur_r_scale = d3.scaleLinear()
        .domain([min_density, max_density])
        .range([init_r, init_r]);

    const radius_editor_svg = d3.select('body').append('svg')
        .attr('id', 'radius_editor_svg')
        .attr('width', svg_w)
        .attr('height', svg_height);
    radius_editor_svg.append('clipPath')
        .attr('id', 'previewClipPath')
        .append('rect')
        .attr('width', preview_g_w)
        .attr('height', svg_height);

    const preview_x_scale = d3.scaleLinear()
        .domain(d3.extent(data_points, d => d.x))
        .range([padding, preview_g_w - padding]);
    const preview_y_scale = d3.scaleLinear()
        .domain(d3.extent(data_points, d => d.y))
        .range([padding, svg_height - padding]);

    const circles_g_zoom = d3.zoom()
        .extent([[0, 0], [preview_g_w, svg_height]])
        .scaleExtent([1 / 2, 8])
        .on("zoom", function () {
            circles_g.attr("transform", d3.event.transform);
        });

    const preview_g = radius_editor_svg.append('g')
        .attr('id', 'preview_g')
        .attr('clip-path', 'url(#previewClipPath)');
    const bg_rect = preview_g.append('rect')
        .attr('id', 'preview_bg_rect')
        .attr('width', preview_g_w)
        .attr('height', svg_height)
        .attr('fill-opacity', 0)
        .attr('fill', 'black')
        .attr('stroke', '#888');
    const circles_g = preview_g.append('g')
        .attr('id', 'circles_g');
    const event_rect = preview_g.append('rect')
        .attr('id', 'preview_event_rect')
        .attr('width', preview_g_w)
        .attr('height', svg_height)
        .attr('fill-opacity', 0)
        .call(circles_g_zoom);
    const toolbox_g = preview_g.append('g')
        .attr('id', 'toolbox_g')
        .attr('transform', `translate(${preview_g_w - 18}, 20)`);

    const fit_text = toolbox_g.append('text')
        .attr('id', 'fit_text')
        .attr('class', 'fas')
        .attr('text-anchor', 'middle')
        .attr('font-size', '22px')
        .attr('font-family', 'helvetica')
        .attr('alignment-baseline', 'central')
        .style('pointer-events', 'all')
        .on('mousedown', function () {
            d3.event.stopPropagation();
        })
        .on('click', function () {
            event_rect.call(circles_g_zoom.transform, d3.zoomIdentity);
        })
        .text('\uf31e');
    fit_text.append('title')
        .text('fit');

    const light_text = toolbox_g.append('text')
        .attr('id', 'fit_text')
        .attr('class', 'far')
        .attr('y', 35)
        .attr('text-anchor', 'middle')
        .attr('font-size', '25px')
        .attr('font-family', 'helvetica')
        .attr('alignment-baseline', 'central')
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
            } else {
                light_on = true;
                light_text.text('\uf0eb');
                bg_rect.attr('fill-opacity', 0);
                toolbox_g.selectAll('text').attr('fill', 'black');
            }
        })
        .text('\uf0eb');
    light_text.append('title')
        .text('control the light');

    circles_g.selectAll('circle').data(data_points, d => d.id)
        .enter().append('circle')
        .attr('cx', d => preview_x_scale(d.x))
        .attr('cy', d => preview_y_scale(d.y))
        .attr('r', d => cur_r_scale(d['density']))
        // .attr('fill', d => colors[d['label']]);
        .attr('fill', d => area_id2color[d['label']]);


    const editor_g = radius_editor_svg.append('g')
        .attr('transform', `translate(${preview_g_w + padding}, ${0})`);

    editor_g.append('clipPath')
        .attr('id', 'curveAreaClipPath')
        .append('rect')
        .attr('width', curve_g_width)
        .attr('height', curve_g_height);


    const bin_count = 50;
    const x_scale = d3.scaleLinear()
        .domain([min_density, max_density])
        .range([0, curve_g_width]);
    const y_scale = d3.scaleLinear()
        .domain([min_r, max_r])
        .range([0, curve_g_height]);

    const feasible_region = editor_g.append('rect')
        .attr('id', 'feasible_region')
        .attr('transform', `translate(${brush_thickness + padding}, ${0})`)
        .attr('fill', '#eee')
        .attr('stroke', '#888')
        .attr('pointer-events', 'none')
        .attr('opacity', 0);

    const histogram_g = editor_g.append('g')
        .attr('id', 'histogram_g')
        .attr('clip-path', 'url(#curveAreaClipPath)')
        .attr('transform', `translate(${brush_thickness + padding}, ${0})`);

    const thresholds = d3.range(min_density, max_density, (max_density - min_density) / bin_count);
    const histogram = d3.histogram()
        .domain(x_scale.domain())
        .thresholds(thresholds);
    const bins = histogram(data_points.map(d => d['density']));
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
    h_y_scale.range([curve_g_height, 0]);
    editor_g.append('g')
        .attr('id', 'histogram_axis_g')
        .attr('transform', `translate(${editor_g_w - padding}, ${0})`)
        .attr('class', 'axis')
        .call(d3.axisRight(h_y_scale).ticks(5, "f"));
    h_y_scale.range([0, curve_g_height * 0.8]);

    editor_g.append("text")
        .attr('id', 'histogram_axis_label')
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr('alignment-baseline', 'central')
        .attr('font-size', 15 + 'px')
        .attr('font-family', 'helvetica')
        .attr('fill', 'black')
        .attr("x", -10)
        .attr("y", editor_g_w - padding - 14)
        .text("Point Num");
    editor_g.append("rect")
        .attr('id', 'histogram_label_rect')
        .attr('fill', '#69b3a2')
        .attr('width', 15)
        .attr('height', 15)
        .attr("x", editor_g_w - padding - 20)
        .attr("y", 90)
        .text("Point Num");

    const adjust_curve_g = editor_g.append('g')
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

    const x_axis_g = editor_g.append('g')
        .attr('id', 'x_axis_g')
        .attr('transform', `translate(${brush_thickness + padding}, ${curve_g_height})`)
        .attr('class', 'axis')
        .call(d3.axisBottom(x_scale).ticks(5, "f"));

    editor_g.append("text")
        .attr('id', 'x_axis_label')
        .attr("text-anchor", "end")
        .attr('alignment-baseline', 'central')
        .attr('font-size', 15 + 'px')
        .attr('font-family', 'helvetica')
        .attr('fill', 'black')
        .attr("x", editor_g_w - padding - 10)
        .attr("y", svg_height - padding - brush_thickness / 2)
        .text("Local Density");

    y_scale.range([curve_g_height, 0]);
    const y_axis_g = editor_g.append('g')
        .attr('id', 'y_axis_g')
        .attr('transform', `translate(${brush_thickness + padding}, ${0})`)
        .attr('class', 'axis')
        .call(d3.axisLeft(y_scale).ticks(8, "f"));

    editor_g.append("text")
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

    let left_axis_point = [0, y_scale(init_r)];
    let right_axis_point = [curve_g_width, y_scale(init_r)];
    let control_points = [
        [x_scale(cur_r_scale.invert(init_r)), y_scale(init_r)],
        [curve_g_width, y_scale(init_r)]
    ];

    const straight_line = d3.line()
        .y(d => curve_g_height - d[1]);

    const curve1 = d3.curveMonotoneX;
    const curve2 = d3.curveCatmullRom.alpha(1);
    const curve_line = d3.line().curve(curve1)
        .y(d => curve_g_height - d[1]);

    const checked_color = '#ff7f00';
    editor_g.append('rect')
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
            editor_g.select('#curve2_rect').attr('fill', 'white');
            d3.select(this).attr('fill', checked_color);
            draw_curve();
        })
        .append('title')
        .text('curveMonotoneX' + '\n' + 'preserves monotonicity in y');

    editor_g.append('rect')
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
            editor_g.select('#curve1_rect').attr('fill', 'white');
            d3.select(this).attr('fill', checked_color);
            draw_curve();
        })
        .append('title')
        .text('curveCatmullRom' + '\n' + 'more natural');

    const curve_g = adjust_curve_g.append('g').attr('id', 'curve_g');
    const curve = curve_g.append('path')
        .attr('id', 'curve')
        .attr('fill', 'none')
        .attr('stroke', '#888')
        .attr('stroke-width', 2)
        .attr('pointer-events', 'none');

    // brushed x min/max value, not px
    let brushed_x_min = 0, brushed_x_max = max_density;
    const brush_x_g = editor_g.append('g')
        .attr('id', 'brush_x_g')
        .attr('transform', `translate(${brush_thickness + padding}, ${curve_g_height})`);

    brush_x_g.append('rect')
        .attr('id', 'brush_bg_rect')
        .attr('width', curve_g_width)
        .attr('height', brush_thickness)
        .attr('fill', '#ddd')
        .attr('fill-opacity', 0.5);

    // brush X
    const brush_X = d3.brushX()
        .extent([[0, 0], [curve_g_width, brush_thickness]])
        .on("brush", brushing_x)
        .on("end", brush_end_x);

    editor_g.append('g')
        .attr('id', 'brush_x_axis_g')
        .attr('transform', `translate(${brush_thickness + padding}, ${curve_g_height + brush_thickness})`)
        .attr('class', 'axis')
        .call(d3.axisBottom(x_scale).ticks(5, "f"));

    const x_scale_ = d3.scaleLinear()
        .domain([min_density, max_density])
        .range([0, curve_g_width]);

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

    // brush Y
    // brushed y min/max value, not px
    let brushed_y_min = 0, brushed_y_max = max_r;
    const brush_y_g = editor_g.append('g')
        .attr('id', 'brush_y_g')
        .attr('transform', `translate(${padding}, ${0})`);

    y_scale.range([curve_g_height, 0]);
    editor_g.append('g')
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

    // brush Y
    const brush_Y = d3.brushY()
        .extent([[0, 0], [brush_thickness, curve_g_height]])
        .on("brush", brushing_y)
        .on("end", brush_end_y);

    const y_scale_ = d3.scaleLinear()
        .domain([min_r, max_r])
        .range([0, curve_g_height]);

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


    function draw_curve() {
        let combined_d = straight_line([left_axis_point, control_points[0]]) +
            curve_line(control_points) + straight_line([control_points[control_points.length - 1], right_axis_point]);
        curve.attr('d', combined_d);
    }

    // update curve and control_points on the curve
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

            // 超出限制范围，直接删除
            // if(((m[0] === right_limit && i !== (control_points.length-1))
            //     || (m[0] === left_limit && i !== 0)) && control_points.length > 2) {
            //     if(i === 0) left_axis_point = [left_end, control_points[1][1]];
            //     else if(i === control_points.length-1) right_axis_point = [right_end, control_points[control_points.length-2][1]];
            //     control_points.splice(i, 1);
            //     update_curve();
            //     trigger = false;
            //     feasible_region.attr('opacity', 0);
            //     return;
            // }

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
            circles_g.selectAll('circle').attr('r', (d, i) => rs[i]);
        }
    }

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
                circles_g.selectAll('circle').attr('r', (d, i) => rs[i]);
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
});

