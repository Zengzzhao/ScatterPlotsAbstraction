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


# 召回门禁流程设计

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