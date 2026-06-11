import math
import os
import numpy as np
import PIL.Image as Image

data_name = 'forest_covertype'
density_file_path = os.path.join(r'static\data', data_name, data_name + '_density.npy')
densities = np.load(density_file_path)
num = densities.shape[0]
print(densities.shape)
min_density = np.min(densities)
max_density = np.max(densities)
densities = (densities - min_density) / (max_density - min_density)

upper = 0.9
lower = 0.001
values = []

gray = np.zeros(num)
main_densities = []
main_indices = []
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

im = Image.new('L', (800, 800))
im.putdata(gray)
im.save(data_name + '.jpg')

# a = np.array([3, 1, 2])
# print(np.argsort(a).argsort())