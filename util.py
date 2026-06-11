import numpy as np
from KDEpy import FFTKDE

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
