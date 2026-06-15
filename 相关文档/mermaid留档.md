# weightedLBG流程

```
flowchart TD
    A[前端传递数据集和画布大小<br>后端计算数据集的KDE密度场] --> D[初始化: 随机生成 100 个刻点]

    D --> E{开始一轮迭代}
    E --> F["1.构建刻点的 Voronoi 图"]
    F --> H["2.遍历每个像素点，用其密度更新最近 Voronoi 的质量"]

    H --> J[3.遍历每个 Voronoi 单元,将其质量与阈值比较]

    J -->|质量 < delete_threshold<br/>密度太低| K[Merge/删除该刻点]
    J -->|质量 > split_threshold<br/>密度太高| L[Split: 分裂成 2 个点]
    J -->|阈值之间<br/>密度适中| M[Relax: 把刻点移到质心保留]

    K --> N[4.增加阈值<br/>把存活的刻点重组成新刻点]
    L --> N
    M --> N

    N --> O{是否还有 split 或 merge?<br/>是否达到最大迭代次数?}
    O -->|有 split/merge 且未达上限| E
    O -->|无 split/merge 或 达到最大次数| P[结束迭代<br/>输出最终刻点结果]

```


# OP-weightedLBG双通道总体流程

```
flowchart TD
    A["原始散点数据"] --> B["KDE核密度估计"]
    B --> C["双通道处理"]
    C --> E["通道一: weightedLBG抽象"]
    C --> F["通道二: OP离群点召回"]

    E --> E1["抽象刻点"]
    F --> F1["离群点"]

    E1 --> G["最终结果<br/>抽象刻点 + 离群点叠加"]
    F1 --> G

    style C fill:#e1f5fe,stroke:#0277bd
    style E fill:#fff3e0,stroke:#e65100
    style F fill:#f3e5f5,stroke:#6a1b9a
    style G fill:#c8e6c9,stroke:#2e7d32

```


# 召回门禁流程设计

```
flowchart TD
    A["输入: 原始点坐标、归一化密度场"] --> B["① 查询每点局部密度"]
    A --> C["② LOF 离群强度"]
    B --> D{"③ 密度门控判断"}
    C --> E
    D -- "低密度区通过门控" --> F["进入候选集"]
    D -- "高密度区被门控拦截" --> G["丢弃"]
    F --> E["④ 候选集内按 LOF 降序排序"]
    E --> J["⑤ 取 Top-K"]
    J --> K["输出: 被保护点"]

    style D fill:#ffe0b2,stroke:#e65100,stroke-width:2px
    style G fill:#ffcdd2,stroke:#c62828
    style K fill:#c8e6c9,stroke:#2e7d32

```