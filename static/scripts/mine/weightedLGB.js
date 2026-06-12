// 基于密度场(每个像素一个0-1的值代表，数据点的密集程度)生成一组抽象圆点
// values: 密度图,一维数组但是实际存的是一张二维密度图w*h
class Stippling {
    constructor(width, height, values, [min_radius, max_radius]) {
        this.width = width;
        this.height = height;
        this.radius_extent = [min_radius, max_radius];
        // 控制分裂/删除的阈值
        this.threshold = 0.4;
        // 每轮迭代的递增量，让算法逐渐稳定收敛
        this.delta_threshold = 0.01;
        // 初始随机 100 个点作为起点
        this.stipples = this.random_stipples(100);

        // 密度归一化到 0-1
        const value_scale = d3.scaleLinear()
            .domain(d3.extent(values))
            .range([0, 1]);
        for (let i = 0; i < values.length; i++) values[i] = value_scale(values[i]);
        this.values = values;
    }

    // 在画布范围内均匀随机生成 num 个点，每个点用数组 [x, y] 表示，并挂上 .radius 属性（初始为最小半径）
    random_stipples(num) {
        const stipples = new Array(num);
        const xran = d3.randomUniform(0, this.width);
        const yran = d3.randomUniform(0, this.height);
        for (let i = 0; i < num; ++i) {
            stipples[i] = [xran(), yran()];
            stipples[i].radius = this.radius_extent[0];
        }
        return stipples;
    }

    // 根据半径算出分裂上限和删除下限两个阈值（基准是该半径对应圆的面积，再上下浮动 threshold/2）
    thresholds(radius) {
        const area = Math.PI * radius * radius;
        return [
            (1.0 + this.threshold / 2.0) * area,
            (1.0 - this.threshold / 2.0) * area
        ];
    }

    // 一次迭代
    iterate() {
        // 由刻点构建Voronoi图
        const delaunay = d3.Delaunay.from(this.stipples);
        const voronoi = delaunay.voronoi([0, 0, this.width, this.height]);

        // 初始化每个刻点的属性
        for (let i = 0; i < this.stipples.length; i++) {
            const st = this.stipples[i];
            st.mass = 0;
            st.moment10 = 0;
            st.moment01 = 0;
            st.moment11 = 0;
            st.moment20 = 0;
            st.moment02 = 0;
        }
        // 遍历整个密度矩阵的每个像素点，看该像素点距离那个刻点最近,用其密度值更新该刻点的属性：质量和各阶矩
        let found = 0;
        for (let y = 0; y < this.height; y++) {
            const line = y * this.width;
            for (let x = 0; x < this.width; x++) {
                found = delaunay.find(x, y, found); // 找到离像素 (x,y) 最近的刻点的索引（即该像素属于哪个 Voronoi 单元）
                const st = this.stipples[found];
                // 获取像素 (x,y) 的密度值，在一维数组表示二维数组中，下标 = y * width + x
                const val = this.values[x + line];
                st.mass += val; // 密度作为当前刻点的质量

                const xval = x * val;
                const yval = y * val;
                st.moment10 += xval; // Σ x·val
                st.moment01 += yval; // Σ y·val
                st.moment11 += x * yval; // Σ x²·val
                st.moment20 += x * xval; // Σ y²·val
                st.moment02 += y * yval; // Σ xy·val
            }
        }

        // 把"平均密度"映射成"圆半径"的函数
        const density_to_radius = d3.scalePow()
            .exponent(1 / 100000)
            .domain([0.3, 1])
            .range(this.radius_extent)
            .clamp(true);

        // 遍历每个刻点，根据它的"质量"决定删除/分裂/保留，把存活的点重组成新的刻点
        const deleted = [];
        const splitted = [];
        const relaxed = [];
        for (let i = 0; i < this.stipples.length; i++) {
            // 第i个刻点的Voronoi单元顶点
            const polygon = voronoi.cellPolygon(i);
            if (!polygon) continue;
            const st = this.stipples[i];
            const mass = st.mass;

            // 基于每个Voronoi的平均密度计算刻点半径
            const area = Math.abs(d3.polygonArea(polygon)) || 1; // Voronoi单元的面积
            if (mass / area > 1) console.log('mass / area > 1,数据异常');
            let avg_density = 1 - Math.min(mass / area, 1);
            st.avg_density = avg_density;
            const radius = density_to_radius(avg_density);

            // 根据质量决定删除/分裂/保留
            const [split_threshold, delete_threshold] = this.thresholds(radius);
            // 质量太小 → 这个区域几乎没数据，圆点多余，删除
            if (mass < delete_threshold) {
                deleted.push(i);
            }
            // 质量太大 → 这个区域数据密度太大，圆点不够，分裂
            else if (mass > split_threshold) {
                // 沿数据分布的主轴方向分裂成两个点
                const centroid = d3.polygonCentroid(polygon); // Voronoi单元的质心,作为分裂的"中点"——两个新点会以它为中心对称分开
                const cx = centroid[0];
                const cy = centroid[1];

                const dist = Math.sqrt(area / Math.PI) / 2.0;

                const x = st.moment20 / mass - cx * cx;
                const y = 2 * (st.moment11 / mass - cx * cy);
                const z = st.moment02 / mass - cy * cy;

                // 主轴方向
                let orientation = Math.atan2(y, x - z) / 2.0;
                // 偏移量
                let deltaX = dist * Math.cos(orientation);
                let deltaY = dist * Math.sin(orientation);

                // 点 A：重心 + 偏移
                st[0] = cx + deltaX;
                st[1] = cy + deltaY;
                st.radius = radius;
                // 点 B：重心 − 偏移
                centroid[0] -= deltaX;
                centroid[1] -= deltaY;
                centroid.radius = radius;

                splitted.push(st);
                splitted.push(centroid);
            }
            // 质量适中 → 保留，把点移到加权重心
            else {
                st[0] = st.moment10 / mass;
                st[1] = st.moment01 / mass;
                st.radius = radius;
                relaxed.push(st);
            }
        }

        // 增加阈值，让算法逐渐稳定、加快收敛
        this.threshold = this.threshold + this.delta_threshold;
        console.log('threshold:', this.threshold);
        this.stipples.length = relaxed.length + splitted.length;
        // 把存活的点重组成新的 stipples
        for (let i = 0; i < relaxed.length; i++) this.stipples[i] = relaxed[i];
        for (let i = 0; i < splitted.length; i++) this.stipples[i + relaxed.length] = splitted[i];

        return { deleted, relaxed, splitted };
    }
}