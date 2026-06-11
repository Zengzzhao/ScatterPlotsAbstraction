# encoding: utf-8
from flask import Flask, render_template, request, redirect, url_for
import json
import pickle
from sklearn.neighbors import KDTree
import os
from util import *
# from sampling.Sampler import *
# from sampling.SamplingMethods import *

app = Flask(__name__)
# 放开表单大小限制：cell_centroids/masses/densities 等大数组以表单字段提交，
# Werkzeug 3.1+ 默认 max_form_memory_size=500KB，超出会返回 413，这里取消限制
app.config['MAX_CONTENT_LENGTH'] = None
app.config['MAX_FORM_MEMORY_SIZE'] = None
app.config['MAX_FORM_PARTS'] = None
data_path = os.path.join('static','data')
width = None
tree = None
point_id2label = {}

# 曲线调整工具
@app.route('/index')
def index():
    return render_template('index.html')


@app.route('/index2')
def index2():
    return render_template('index2.html')


@app.route('/get_density', methods=['POST'])
def get_density():
    data_name = request.form['data_name']
    file_path = os.path.join(data_path, data_name, data_name + '_density.npy')
    density = np.load(file_path).tolist()
    return json.dumps(density)


@app.route('/get_sampling', methods=['POST'])
def get_sampling():
    data = np.asarray(json.loads(request.form['coords']))
    labels = np.asarray(json.loads(request.form['labels']))
    sampling_rate = float(request.form['sampling_rate'])
    sampler = Sampler()
    sampler.set_data(data, labels)
    sampler.set_sampling_method(MultiClassBlueNoiseSampling, sampling_rate=sampling_rate)
    sampled_data, sampled_labels = sampler.get_samples()

    return json.dumps({'sampled_data': sampled_data.tolist(), 'sampled_labels': sampled_labels.tolist()})

# 接收数据集名称，计算/从缓存中加载该散点图的kde、id-标签映射、kd树，返回kde
@app.route('/get_kde', methods=['POST'])
def get_kde():
    global width
    global point_id2label
    global tree
    data_name = str(request.form['data_name'])
    padding = int(request.form['padding'])
    width = int(request.form['width'])
    height = width

    # id-标签映射
    point_id2label_file_path = os.path.join(data_path, data_name, data_name + '_point_id2label.json')
    # 密度
    density_file_path = os.path.join(data_path, data_name, data_name + '_density.npy')
    # kde树
    tree_file_path = os.path.join(data_path, data_name, data_name + '_tree.pickle')

    # 如果缓存文件存在，则直接加载
    if os.path.exists(point_id2label_file_path):
        with open(point_id2label_file_path) as f:
            point_id2label = json.load(f)
        densities = np.load(density_file_path)
        with open(tree_file_path, 'rb') as f:
            tree = pickle.load(f)
    # 首次加载，计算kde、id-标签映射、kd树
    else:
        point_id2label = {}
        with open(os.path.join(data_path, data_name, data_name + '.json')) as f:
            id_ = 0
            coords = []
            for p in json.load(f):
                point_id2label[str(id_)] = p['label']
                coords.append([p['x'], p['y']])
                id_ += 1
        # 写出id-标签映射
        with open(point_id2label_file_path, 'w') as fw:
            json.dump(point_id2label, fw)
        # 坐标缩放，把 x、y 线性映射到 [padding, width-padding] 区间，使数据点适配画布。
        coords = np.asarray(coords)
        coords[:, 0] = d3_scale(coords[:, 0], out_range=(padding, width - padding))
        coords[:, 1] = d3_scale(coords[:, 1], out_range=(padding, height - padding))
        # 构建kd树
        tree = KDTree(coords)
        with open(tree_file_path, 'wb') as fw:
            pickle.dump(tree, fw)
        # 计算kde
        densities = get_kde_density(coords, width, height).flatten()
        min_density = np.min(densities)
        max_density = np.max(densities)
        densities = (densities - min_density) / (max_density - min_density)
        np.save(density_file_path, densities)

    return json.dumps(densities.tolist())


# 为每个抽象后的网格单元查询其最近的原始数据点标签
@app.route('/get_labels', methods=['POST'])
def get_labels():
    data_name = str(request.form['data_name'])
    min_radius = str(request.form['min_radius'])
    max_radius = str(request.form['max_radius'])
    cell_centroids = np.asarray(json.loads(request.form['cell_centroids']))
    cell_masses = json.loads(request.form['cell_masses'])
    cell_densities = np.asarray(json.loads(request.form['cell_densities']))

    # 查询每个网格单元的最近原始数据点id
    nearest_ids = tree.query(cell_centroids, k=1)[1].flatten().tolist()
    # 查询每个网格单元的最近原始数据点标签
    labels = list(map(lambda x: point_id2label[str(x)], nearest_ids))
    # 将每个网格单元的坐标、标签、质量、密度打包成一个列表
    results = []
    for ((x, y), label, mass, density) in zip(cell_centroids, labels, cell_masses, cell_densities):
        if mass is None:
            mass = 0
        results.append({
            'x': round(x, 3),
            'y': round(y, 3),
            'label': label,
            'mass': round(mass, 5),
            'density': round(density, 5),
        })
    # 写出结果
    file_path = os.path.join(data_path, data_name, '_'.join([data_name, min_radius, max_radius]) + '.json')
    if not os.path.exists(file_path):
        with open(file_path, 'w') as fw:
            json.dump(results, fw)
    return json.dumps(labels)


if __name__ == '__main__':
    app.run(debug=True, port=5190)
