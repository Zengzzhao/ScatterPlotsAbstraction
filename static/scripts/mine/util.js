// 工具函数库
// 提供几何计算工具：点间距离 dis/distance、路径上的最近点 closestPoint、沿路径插值 yOnPath
function dis(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function distance([x1, y1], [x2, y2]) {
    return Math.hypot(x1 - x2, y1 - y2);
}

function closestPoint(pathNode, point) {
    let pathLength = pathNode.getTotalLength(),
        precision = 8,
        best,
        bestLength,
        bestDistance = Infinity;

    // linear scan for coarse approximation
    for (let scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
        if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
            best = scan, bestLength = scanLength, bestDistance = scanDistance;
        }
    }

    // binary search for precise estimate
    precision /= 2;
    while (precision > 0.5) {
        let before,
            after,
            beforeLength,
            afterLength,
            beforeDistance,
            afterDistance;
        if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
            best = before, bestLength = beforeLength, bestDistance = beforeDistance;
        } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
            best = after, bestLength = afterLength, bestDistance = afterDistance;
        } else {
            precision /= 2;
        }
    }

    best = [best.x, best.y];
    best.distance = Math.sqrt(bestDistance);
    return best;

    function distance2(p) {
        let dx = p.x - point[0],
            dy = p.y - point[1];
        return dx * dx + dy * dy;
    }
}

function yOnPath(path, target_xs, h) {
    const target_ys = [];
    let length = 0, id = 0;
    const totalLength = path.getTotalLength();
    const step = Math.max(totalLength / 2000, 4);
    let {x, y} = path.getPointAtLength(0);
    while (length <= totalLength) {
        if (target_xs[id] <= x) {
            target_ys.push(Math.max(h - y, 0));
            id += 1;
        } else {
            length += step;
            ({x, y} = path.getPointAtLength(length));
            continue
        }
        if (id === target_xs.length) break;
    }
    target_ys.push(Math.max(h - y, 0));
    return target_ys;
}


function* euclidean_mst(points) {

    function distance2(i, j) {
        const dx = points[i * 2] - points[j * 2];
        const dy = points[i * 2 + 1] - points[j * 2 + 1];
        return dx * dx + dy * dy;
    }

    const delaunay = new d3.Delaunay(points);
    const heap = new FlatQueue();
    const set = new Uint8Array(points.length / 2);

    // Initialize the heap with the outgoing edges of vertex zero.
    set[0] = 1;
    for (const i of delaunay.neighbors(0)) {
        heap.push([0, i], distance2(0, i));
    }

    // For each remaining minimum edge in the heap…
    let edge;
    while (edge = heap.pop()) {
        const [i, j] = edge;

        // If j is already connected, skip; otherwise add the new edge to point j.
        if (set[j]) continue;
        set[j] = 1;
        yield edge;

        // Add each unconnected neighbor k of point j to the heap.
        for (const k of delaunay.neighbors(j)) {
            if (set[k]) continue;
            heap.push([j, k], distance2(j, k));
        }
    }
}