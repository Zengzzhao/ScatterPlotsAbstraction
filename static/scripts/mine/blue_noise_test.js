const width = 800;
const height = 800;
const svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'none')
    .attr('stroke', 'black');
const class_id2color = {
    0: 'red',
    1: 'blue',
    2: 'green'
};

function create_data() {
    let total_data = [];
    let randomX = d3.randomNormal(width / 2 - 100, 80),
        randomY = d3.randomNormal(height / 2 - 100, 80);
    d3.range(2000).map(function () {
        const x = randomX();
        const y = randomY();
        total_data.push({
            x: x,
            y: y,
            class_id: 0
        });
        return [x, y];
    });


    randomX = d3.randomNormal(width / 2 + 100, 80);
    randomY = d3.randomNormal(height / 2 + 100, 80);
    d3.range(4000).map(function () {
        const x = randomX();
        const y = randomY();
        total_data.push({
            x: x,
            y: y,
            class_id: 1
        });
        return [x, y];
    });

    randomX = d3.randomUniform(0, 800);
    randomY = d3.randomUniform(0, 800);
    d3.range(8000).map(function () {
        const x = randomX();
        const y = randomY();
        total_data.push({
            x: x,
            y: y,
            class_id: 2
        });
        return [x, y];
    });
    d3.shuffle(total_data);
    return total_data;
}


d3.json("static/data/blue_noise_test.json").then(function (points) {

    const random = d3.randomLcg(0.9051667019185816);
    const shuffle = d3.shuffler(random);
    points = shuffle(points);

     // svg.selectAll("circle")
     //    .data(points)
     //    .enter().append("circle")
     //    .attr("r", 2)
     //    .attr("cx", d => d.x)
     //    .attr("cy", d => d.y)
     //    .attr('fill', d => class_id2color[d.class_id]);

    const coords = [];
    const labels = [];
    for (const p of points) {
        coords.push([p.x, p.y]);
        labels.push(p.class_id);
    }
    $.post('/get_sampling', {
        coords: JSON.stringify(coords),
        labels: JSON.stringify(labels),
        sampling_rate: 0.5
    }, function (data) {
        data = JSON.parse(data);
        console.log(data);
        const sampled_points = [];
        for (let i = 0; i < data['sampled_data'].length; i++) {
            sampled_points.push({
                x: data['sampled_data'][i][0],
                y: data['sampled_data'][i][1],
                class_id: data['sampled_labels'][i]
            })
        }

        svg.selectAll("circle")
            .data(sampled_points)
            .enter().append("circle")
            .attr("r", 2)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr('fill', d => class_id2color[d.class_id]);

    });
});


