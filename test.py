# encoding: utf-8

import json
from KDEpy import FFTKDE
import numpy as np
import matplotlib.pyplot as plt
import time
import random

area2color = {'AI': '#cfe1f2', 'Vision': '#a5cce4', 'ML': '#6daed5', 'NLP': '#3c8bc3', 'Web+IR': '#1864aa',
              'Arch': '#d3eecd', 'Networks': '#c4e8be', 'Security': '#b5e1ae', 'DB': '#a4da9e', 'EDA': '#91d18e',
              'Embedded': '#7dc87f', 'HPC': '#68be72', 'Mobile': '#54b366', 'Metrics': '#41a75b', 'OS': '#319a50',
              'PL': '#238c46', 'SE': '#157f3b', 'Theory': '#fdd8b3', 'Crypto': '#fb8d3d', 'Logic': '#c44103',
              'Comp.': '#e2e1ef', 'Graphics': '#c9c9e2', 'ECom': '#acabd2', 'HCI': '#908cc1', 'Robotics': '#7769b0',
              'Visualization': '#61409b', 'Medical': '#fee5d9', 'Geo': '#fcbba1', 'Edu': '#fc9272',
              'Business': '#fb6a4a',
              'SP': '#ef3b2c', 'FS': '#cb181d', 'CS': '#99000d', 'Non_english': '#cccccc'}
color2area = {color: area for area, color in area2color.items()}
color2area_id = {color: id_ for id_, (area, color) in enumerate(area2color.items())}
area_id2color = {id_: color for id_, (area, color) in enumerate(area2color.items())}
area2area_id = {area: id_ for id_, (area, color) in enumerate(area2color.items())}
area_id2area = {id_: area for id_, (area, color) in enumerate(area2color.items())}

print(area_id2area)

# data = []
# with open(r'static/data/multiclass_blue_noise_10k.json') as f:
#     for item in json.load(f):
#         data.append({
#             'x': round(float(item['x']), 3),
#             'y': round(float(item['y']), 3),
#             'label': color2area_id[item['color']]
#         })
# with open(r'static/data/multiclass_blue_noise_10k2.json', 'w') as fw:
#     json.dump(data, fw)


# def get_kde_density(points, w, h, m, n):
#     """
#     给定一组数据点，计算该数据点分布范围内均匀网格各点的密度
#     :param points: 数据点
#     :param w: 数据点在x方向的分布长度
#     :param h: 数据点在y方向的分布长度
#     :param m: 把x方向切分的份数
#     :param n: 把y方向切分的份数
#     :return: 每个采样点评估的密度
#     """
#     grids = np.empty((m * n, 2), dtype=float)
#     grid_w = w / m
#     grid_h = h / n
#     for i in range(n):
#         for j in range(m):
#             grids[i * m + j] = [i * grid_h, j * grid_w]
#
#     kde = FFTKDE(kernel="gaussian", bw=5).fit(points)
#     return kde.evaluate(grids)
#
#
# with open(r'static/data/multiclass_blue_noise_80k.json') as f:
#     data = []
#     for p in json.load(f):
#         data.append([p['x'], p['y']])
#     data = np.asarray(data)
#
#     width = 800
#     height = 800
#     m = 200
#     n = 200
#
#     t0 = time.time()
#     density = get_kde_density(data, width, height, m, n)
#     t1 = time.time()
#     print('evaluate density takes', t1 - t0, 'seconds')
#
#     np.save('80k_density.npy', density)
#     print('density saved')


# with open(r'static/data/full.json') as f:
#     points = []
#     for p in json.load(f):
#         p['x'] = round(float(p['x']), 3)
#         p['y'] = round(float(p['y']), 3)
#         p['label'] = color2area_id[p['color']]
#         points.append(p)
#     with open(r'static/data/full2.json', 'w') as fw:
#         json.dump(points, fw)
#
#
# with open(r'static/data/other_data/forest_covertype/forest_covertype_5_5_results.json') as f:
#     density = np.load(r'static/data/other_data/forest_covertype/forest_covertype_density.npy')
#     print(density.shape)
#     points = []
#     densities = []
#     for point in json.load(f):
#         temp = float(density[round(point['x']) * 800 + round(point['y'])])
#         point['density'] = temp
#         densities.append(temp)
#         points.append(point)
#     max_ = np.max(densities)
#     min_ = np.min(densities)
#     for point in points:
#         point['density'] = round((point['density'] - min_) / (max_ - min_), 5)
# with open(r'static/data/other_data/forest_covertype/forest_covertype_5_5_results.json', 'w') as fw:
#     json.dump(points, fw)


# with open(r'static/data/full_1_1_results.json') as f:
#     target_density = 3.1415926 * 1 * 1
#     errors = []
#     for item in json.load(f):
#         error = item['density'] - target_density
#         errors.append(abs(error) / target_density)
#     print(sum(errors) / len(errors))

