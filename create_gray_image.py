# 把散点的密度数据（density）转换成一张 800×800 的灰度图，用密度的高低映射成像素的明暗，从而可视化密度分布。
import math
import os
import numpy as np
import PIL.Image as Image

data_name = 'forest_covertype'
density_file_path = os.path.join('static', 'data', data_name, data_name + '_density.npy')
densities = np.load(density_file_path)
num = densities.shape[0]
# 归一化
min_density = np.min(densities)
max_density = np.max(densities)
densities = (densities - min_density) / (max_density - min_density)

upper = 0.9
lower = 0.001
values = []
gray = np.zeros(num)
main_densities = []
main_indices = []

# 分段映射密度 → 灰度值
# 密度 < lower（极低密度）：灰度设为 255（纯白）
# 密度 > upper（极高密度）：灰度设为 0（纯黑）
# 中间区间的点：按排名比例线性映射到灰度,密度越高越黑、越低越白
for index, density in enumerate(densities):
    if density < lower:
        densities[index] = 0
        gray[index] = 255
    elif density > upper:
        densities[index] = 1
        gray[index] = 0
    else:
        main_densities.append(density)
        main_indices.append(index)
positions = np.argsort(main_densities).argsort()
num2 = len(main_indices)
for position, index in zip(positions, main_indices):
    gray[index] = 255 - math.floor(position / num2 * 255)

# 保存灰度图
im = Image.new('L', (800, 800))
im.putdata(gray)
im.save(data_name + '.jpg')
