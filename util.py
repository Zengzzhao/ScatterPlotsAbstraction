import numpy as np
from KDEpy import FFTKDE
from sklearn.neighbors import LocalOutlierFactor

# 坐标缩放，把 x、y 线性映射到out_range区间，使数据点适配画布
def d3_scale(dat, out_range=(0, 1)):
    domain = [np.min(dat, axis=0), np.max(dat, axis=0)]

    def interp(x):
        return out_range[0] * (1.0 - x) + out_range[1] * x

    def uninterp(x):
        b = 0
        if (domain[1] - domain[0]) != 0:
            b = domain[1] - domain[0]
        else:
            b = 1.0 / domain[1]
        return (x - domain[0]) / b

    return interp(uninterp(dat))

# 计算一组数据点[{x: 1, y: 2}, {x: 2, y: 3},...]，计算该数据点分布范围内均匀网格各点的密度
def get_kde_density(points, w, h, bw=5):
    """
    给定一组数据点，计算该数据点分布范围内均匀网格各点的密度
    :param points: 数据点
    :param w: 数据点在x方向的分布长度
    :param h: 数据点在y方向的分布长度
    :param bw: 高斯核带宽
    :return: 每个采样点评估的密度
    """
    grids = np.empty((w * h, 2), dtype=float)
    for i in range(h):
        for j in range(w):
            grids[i * w + j] = [i, j]

    kde = FFTKDE(kernel="gaussian", bw=bw).fit(points)
    return kde.evaluate(grids)


# ============ 离群点保护（OP, Outlier Protection）============
def detect_outliers(coords, densities, width, height,
                    k=20, density_quantile=0.30, budget=200,
                    use_density_gate=True, contamination='auto'):
    """
    :param coords:    原始数据点画布坐标 ndarray, shape (N, 2)
    :param densities: 归一化到 [0,1] 的密度场
    :param width:     画布宽
    :param height:    画布高
    :param k:         LOF 的KNN近邻数，近似局部可达密度
    :param density_quantile: 密度门控阈值的分位数；只在"局部密度低于该分位数"的区域保留离群点，避免在高密度区把正常点误判为需要保护
    :param budget:    保护点数量上限，门控后按 LOF 降序取前 Top-N
    :param use_density_gate: 是否启用密度门控；关闭时对全部点直接按 LOF 取 Top-N
    :param contamination: 传给 LocalOutlierFactor 的污染比例，默认 'auto'
    :return: dict，scores 与 lof 均为被保护点的 LOF 离群强度
    """
    coords = np.asarray(coords, dtype=float)
    n = len(coords)
    if n == 0:
        return {'indices': [], 'scores': [], 'lof': [], 'local_density': []}

    # 1) 查询每个原始点处的局部 KDE 密度
    densities = np.asarray(densities, dtype=float)
    xi = np.clip(np.round(coords[:, 0]).astype(int), 0, width - 1)
    yi = np.clip(np.round(coords[:, 1]).astype(int), 0, height - 1)
    local_density = densities[xi * width + yi]

    # 2) LOF：基于 kNN 的局部可达密度，识别局部离群点
    k_eff = int(min(max(k, 1), n - 1)) if n > 1 else 1
    lof_score = np.zeros(n, dtype=float)
    if n > k_eff:
        lof = LocalOutlierFactor(n_neighbors=k_eff, contamination=contamination)
        lof.fit_predict(coords)
        lof_score = -lof.negative_outlier_factor_

    # 3) 密度门控（可选）：只在极低密度区域考虑保留离群点，高密度区不保留以避免重叠
    #    use_density_gate=False 时跳过门控，候选集为全部点
    if use_density_gate:
        density_gate = np.quantile(local_density, density_quantile)
        gate_mask = local_density <= density_gate
        candidate_idx = np.where(gate_mask)[0]
    else:
        candidate_idx = np.arange(n)

    # 4) 候选为空直接返回
    if len(candidate_idx) == 0:
        return {'indices': [], 'scores': [], 'lof': [], 'local_density': []}

    # 5) 候选集内部直接按 LOF 离群强度降序取 Top-N
    cand_lof = lof_score[candidate_idx]
    order = np.argsort(-cand_lof)
    if budget is not None and budget > 0:
        order = order[:budget]
    selected = candidate_idx[order]

    return {
        'indices': selected.tolist(),
        'scores': lof_score[selected].tolist(),
        'lof': lof_score[selected].tolist(),
        'local_density': local_density[selected].tolist(),
    }
