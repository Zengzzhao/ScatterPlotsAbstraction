# ScatterplotsAbstraction

> 一个基于 Flask + D3.js 的散点图密度感知抽象化交互可视化工具，用于论文研究。

---

## 📌 项目简介

**ScatterplotsAbstraction** 是一个前后端一体的 Web 应用，核心功能是对大规模散点图数据集进行**密度感知的抽象化处理**，从而在保留数据分布特征的前提下，降低视觉混乱（Over-plotting）。

系统通过核密度估计（KDE）生成密度场，并结合 KD 树最近邻查询，将前端传入的抽象单元（Cell）映射回原始数据点的标签，支持研究者对抽象半径等参数进行交互式调节。

---

## ✨ 核心功能

- **核密度估计（KDE）**：使用 KDEpy（FFTKDE）在像素网格上高效计算密度场
- **密度场缓存**：首次计算后自动缓存 `.npy` / `.pickle` / `.json` 等产物，后续加载无需重算
- **KD 树标签映射**：给定抽象 Cell 的质心坐标，通过 KD 树快速查找最近原始数据点并返回其标签
- **多数据集支持**：内置 6 个真实数据集，可扩展
- **交互式参数调节**：前端支持调节画布宽度、padding、最小/最大半径等参数
- **结果持久化**：每次标签查询结果自动保存为 JSON 文件，便于复现

---

## 🗂️ 内置数据集

| 数据集 | 描述 |
|---|---|
| `cs_rankings` | CS 学术排名数据 |
| `dblp` | DBLP 计算机科学文献数据 |
| `dc_census_2012_2016` | 美国人口普查数据（2012–2016）|
| `forest_covertype` | 森林覆盖类型数据 |
| `hathi_trust_library` | HathiTrust 数字图书馆数据 |
| `person_activity` | 人员活动轨迹数据 |

---

## 🏗️ 技术栈

| 层次 | 技术 |
|---|---|
| 后端框架 | Flask 3.1 |
| 数值计算 | NumPy 2.0 |
| 核密度估计 | KDEpy 1.1（FFTKDE） |
| 最近邻查询 | scikit-learn 1.6（KDTree） |
| 前端可视化 | D3.js v5 |
| 前端 UI | Bootstrap 4 + jQuery 3 |

---

## 📁 目录结构

```
scatterplotsAbstraction/
├── app.py                        # Flask 服务器 & API 路由
├── util.py                       # KDE 计算 & 坐标缩放工具函数
├── create_gray_image.py          # 灰度图像生成辅助脚本
├── test.py                       # 实验性测试脚本
├── requirements.txt              # Python 依赖列表
├── templates/
│   └── index.html                # 主页面入口（由 JS 动态渲染）
├── static/
│   ├── css/                      # Bootstrap & 自定义样式
│   ├── scripts/
│   │   ├── library/              # 第三方 JS 库（d3、jquery 等）
│   │   └── mine/                 # 项目核心 JS
│   │       ├── radius_editor.js  # 核心交互逻辑（最大文件，~51KB）
│   │       ├── radius_editor_init.js
│   │       ├── abstraction.js
│   │       ├── weightedLGB.js
│   │       ├── util.js
│   │       └── ...
│   ├── data/                     # 数据集目录（含缓存产物）
│   │   └── <dataset>/
│   │       ├── <dataset>.json               # 原始数据（必须）
│   │       ├── <dataset>_density.npy        # 密度场缓存（自动生成）
│   │       ├── <dataset>_tree.pickle        # KD 树缓存（自动生成）
│   │       └── <dataset>_point_id2label.json # 点 ID → 标签映射（自动生成）
│   └── webfonts/                 # FontAwesome 字体文件
└── utils/
    └── thread.py                 # 线程辅助工具
```

---

## 🚀 快速开始

### 1. 环境准备

> 需要 Python 3.8+

```bash
# 克隆仓库
git clone <your-repo-url>
cd scatterplotsAbstraction

# 创建并激活虚拟环境（推荐）
python -m venv .venv
source .venv/bin/activate      # macOS / Linux
# .venv\Scripts\activate       # Windows

# 安装依赖
pip install -r requirements.txt
```

### 2. 启动服务

```bash
python app.py
```

### 3. 打开浏览器

访问 [http://127.0.0.1:5190](http://127.0.0.1:5190)

---

## 🌐 API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/` 或 `/index` | 返回主页面 |
| `POST` | `/get_kde` | 计算或加载 KDE 密度场，初始化 KD 树 |
| `POST` | `/get_density` | 从缓存加载已有密度场 |
| `POST` | `/get_labels` | 查询抽象 Cell 对应的原始标签 |

### `/get_kde` 请求参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `data_name` | string | 数据集名称（对应 `static/data/` 下的目录名）|
| `padding` | int | 画布边缘 padding（像素） |
| `width` | int | 画布宽/高（正方形，单位像素） |

**返回**：归一化到 `[0, 1]` 的密度值数组（长度为 `width × width`）

### `/get_labels` 请求参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `data_name` | string | 数据集名称 |
| `min_radius` | number | 抽象 Cell 最小半径 |
| `max_radius` | number | 抽象 Cell 最大半径 |
| `cell_centroids` | JSON 数组 | Cell 质心坐标列表 `[[x, y], ...]` |
| `cell_masses` | JSON 数组 | 每个 Cell 的质量（点数量） |
| `cell_densities` | JSON 数组 | 每个 Cell 处的密度值 |

**返回**：每个 Cell 对应的标签字符串数组，同时将结果写入 `static/data/<data_name>/<data_name>_<min>_<max>.json`

---

## ➕ 添加自定义数据集

1. 在 `static/data/` 下创建以数据集名命名的目录：

```
static/data/<your_dataset>/
```

2. 准备 JSON 数据文件，每条记录格式如下：

```json
[
  { "x": 0.12, "y": 3.45, "label": "category_A" },
  { "x": 1.23, "y": 2.34, "label": "category_B" }
]
```

3. 将文件命名为 `<your_dataset>.json` 并放入对应目录。

4. 在浏览器中选择该数据集，后端会自动生成缓存文件。

---

## ⚙️ 注意事项

### macOS / Linux 路径问题

`app.py` 中默认使用 Windows 风格路径：

```python
data_path = r'static\data'
```

如在 macOS / Linux 上遇到路径错误，请修改为：

```python
data_path = 'static/data'
```

### 关于 `/get_sampling` 接口

该接口依赖 `Sampler` 和 `MultiClassBlueNoiseSampling`，对应模块已从本仓库移除。如调用此接口会报错，可在 `app.py` 中注释掉该路由。

### 生产环境部署

本项目使用全局变量缓存 KD 树等状态，**不适合多 Worker 并发部署**。如需生产化，建议：

```bash
# 只使用单 Worker
pip install gunicorn
gunicorn -w 1 -b 0.0.0.0:5190 app:app
```

---

## 📦 依赖版本

```
Flask==3.1.2
numpy==2.0.2
KDEpy==1.1.12
scikit-learn==1.6.1
scipy==1.13.1
```

完整依赖见 [requirements.txt](requirements.txt)。

---

## 📄 许可证

本项目为论文研究用途，暂无开源许可证声明。
