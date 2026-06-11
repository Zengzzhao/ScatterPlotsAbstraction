// 算法核心实现 
// Stippling 类 —— 基于密度场的加权 Lloyd 重心 Voronoi 点阵生成（即散点图抽象化的核心迭代算法，决定每个抽象圆的位置和大小）
class Stippling {
    constructor(width, height, values, [min_radius, max_radius]) {
        this.width = width;
        this.height = height;
        this.radius_extent = [min_radius, max_radius];
        this.threshold = 0.4;
        this.delta_threshold = 0.01;

        // normalize the values
        const value_scale = d3.scaleLinear()
            .domain(d3.extent(values))
            .range([0, 1]);
        for (let i = 0; i < values.length; i++) values[i] = value_scale(values[i]);
        this.values = values;

        // we initialize the algorithm with random stipples
        this.stipples = this.random_stipples(100);
    }

    // returns the thresholds for split and delete
    thresholds(radius) {
        const area = Math.PI * radius * radius;
        return [
            (1.0 + this.threshold / 2.0) * area,
            (1.0 - this.threshold / 2.0) * area
        ];
    }

    // generates `num` random stipples on top of the grid.
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

    // performs one iteration of the stippling algorithm
    iterate() {
        const delaunay = d3.Delaunay.from(this.stipples),
            voronoi = delaunay.voronoi([0, 0, this.width, this.height]);

        // initialize densities
        for (let i = 0; i < this.stipples.length; i++) {
            const st = this.stipples[i];
            st.mass = 0;
            st.moment10 = 0;
            st.moment01 = 0;
            st.moment11 = 0;
            st.moment20 = 0;
            st.moment02 = 0;
        }

        // compute the mass and the weighted centroid of each cell
        let found = 0;
        for (let y = 0; y < this.height; y++) {
            const line = y * this.width;
            for (let x = 0; x < this.width; x++) {
                found = delaunay.find(x, y, found);
                const st = this.stipples[found];
                const val = this.values[x + line];
                st.mass += val; // Moment00
                const xval = x * val;
                const yval = y * val;
                st.moment10 += xval;
                st.moment01 += yval;
                st.moment11 += x * yval;
                st.moment20 += x * xval;
                st.moment02 += y * yval;
            }
        }

        const density_to_radius = d3.scalePow()
            .exponent(1/100000)
            .domain([0.3, 1])
            .range(this.radius_extent)
            .clamp(true);

        const deleted = [];
        const splitted = [];
        const relaxed = [];

        for (let i = 0; i < this.stipples.length; i++) {
            const polygon = voronoi.cellPolygon(i);
            if (!polygon) continue;
            const st = this.stipples[i];
            const mass = st.mass;

            // determine point size based on average intensity
            const area = Math.abs(d3.polygonArea(polygon)) || 1;
            if (mass / area > 1) console.log('!!!!!!!!!!!!!!!!!!!');
            let avg_density = 1 - Math.min(mass / area, 1);
            st.avg_density = avg_density;
            const radius = density_to_radius(avg_density);

            const [split_threshold, delete_threshold] = this.thresholds(radius);
            if (mass < delete_threshold) {
                // Delete
                deleted.push(i);
                // nop
            } else if (mass > split_threshold) {
                // Split
                const centroid = d3.polygonCentroid(polygon);
                const cx = centroid[0];
                const cy = centroid[1];

                const dist = Math.sqrt(area / Math.PI) / 2.0;

                const x = st.moment20 / mass - cx * cx;
                const y = 2 * (st.moment11 / mass - cx * cy);
                const z = st.moment02 / mass - cy * cy;

                let orientation = Math.atan2(y, x - z) / 2.0;

                let deltaX = dist * Math.cos(orientation);
                let deltaY = dist * Math.sin(orientation);

                // re-use arrays to reduce GC pressure
                st[0] = cx + deltaX;
                st[1] = cy + deltaY;
                st.radius = radius;
                centroid[0] -= deltaX;
                centroid[1] -= deltaY;
                centroid.radius = radius;
                splitted.push(st);
                splitted.push(centroid);
            } else {
                // Relax
                st[0] = st.moment10 / mass;
                st[1] = st.moment01 / mass;
                st.radius = radius;
                relaxed.push(st);
            }
        }

        // we increase the threshold with each iteration for faster convergence
        this.threshold = this.threshold + this.delta_threshold;
        console.log(this.threshold);
        this.stipples.length = relaxed.length + splitted.length;
        for (let i = 0; i < relaxed.length; i++) this.stipples[i] = relaxed[i];
        for (let i = 0; i < splitted.length; i++) this.stipples[i + relaxed.length] = splitted[i];

        return {deleted, relaxed, splitted};
    }
}