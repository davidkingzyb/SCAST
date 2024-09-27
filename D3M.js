var D3M=(function(){
    function IndentedTree(data){
        const format = d3.format(",");
        const nodeSize = 22;
        const root = d3.hierarchy(data).eachBefore((i => d => d.index = i++)(0));
        const nodes = root.descendants();
        const width = 928;
        const height = (nodes.length + 1) * nodeSize;

        const columns = [
            {
                label: "condition", 
                value: d => d.value, 
                format:d=>d.condition?d.condition.value:'', 
                x: 700
            },
            {
                label: "type", 
                value: d => d.value, 
                format:d=>d.type, 
                x: 840
            },
            {
                label: "poi", 
                value: d => d.value, 
                format:(d) => d.poi?d.poi.line+':'+d.poi.start:'-',
                x: 900
            },
        ];

        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-nodeSize / 2, -nodeSize * 3 / 2, width, height])
            .attr("style", `max-width: 100%; height: auto; font: ${gD3fontSize}px sans-serif; overflow: visible;`);

        const link = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#999")
            .selectAll()
            .data(root.links())
            .join("path")
            .attr("d", d => `
                M${d.source.depth * nodeSize},${d.source.index * nodeSize}
                V${d.target.index * nodeSize}
                h${nodeSize}
            `);

        const node = svg.append("g")
            .selectAll()
            .data(nodes)
            .join("g")
            .attr("transform", d => `translate(0,${d.index * nodeSize})`);

        node.append("circle")
            .attr("cx", d => d.depth * nodeSize)
            .attr("r", 2.5)
            .attr("fill", d => d.children ? null : "#999");

        node.append("text")
            .attr("dy", "0.32em")
            .attr("x", d => d.depth * nodeSize + 6)
            .text(d => d.data.name);

        node.append("title")
            .text(d => d.ancestors().reverse().map(d => d.data.name).join("/"));

        for (const {label, value, format, x} of columns) {
            svg.append("text")
                .attr("dy", "0.32em")
                .attr("y", -nodeSize)
                .attr("x", x)
                .attr("text-anchor", "end")
                .attr("font-weight", "bold")
                .text(label);
            node.append("text")
                .attr("dy", "0.32em")
                .attr("y", 0)
                .attr("x", x)
                .attr("text-anchor", "end")
                .text(d => format(d.data));
        }

        return svg.node();
    }

    function TidyTree(data){
        const width = 928;

        const root = d3.hierarchy(data);
        const dx = 20;
        const dy = width / (root.height + 1);
        const tree = d3.tree().nodeSize([dx, dy]);
        root.sort((a, b) => d3.ascending(a.data.name, b.data.name));
        tree(root);
        let x0 = Infinity;
        let x1 = -x0;
        root.each(d => {
        if (d.x > x1) x1 = d.x;
        if (d.x < x0) x0 = d.x;
        });
        const height = x1 - x0 + dx * 2;

        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-dy / 3, x0 - dx, width, height])
            .attr("style", `max-width: 100%; height: auto; font: ${gD3fontSize} sans-serif;`);

        const link = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5)
            .selectAll()
            .data(root.links())
            .join("path")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));

        const node = svg.append("g")
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
        .selectAll()
        .data(root.descendants())
        .join("g")
            .attr("transform", d => `translate(${d.y},${d.x})`);

        node.append("circle")
            .attr("fill", d => d.children ? "#555" : "#999")
            .attr("r", 2.5);

        node.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.children ? -6 : 6)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .text(d => d.data.name)
            .attr("stroke", "white")
            .attr("paint-order", "stroke");

        return svg.node();
    }

    function ClusterTree(data){
        const width = 928;
        const root = d3.hierarchy(data);
        const dx = 20;
        const dy = width / (root.height + 1);
        const tree = d3.cluster().nodeSize([dx, dy]);
        root.sort((a, b) => d3.ascending(a.data.name, b.data.name));
        tree(root);
        let x0 = Infinity;
        let x1 = -x0;
        root.each(d => {
            if (d.x > x1) x1 = d.x;
            if (d.x < x0) x0 = d.x;
        });
        const height = x1 - x0 + dx * 2;

        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-dy / 3, x0 - dx, width, height])
            .attr("style", `max-width: 100%; height: auto; font: ${gD3fontSize}px sans-serif;`);

        const link = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5)
            .selectAll()
            .data(root.links())
            .join("path")
                .attr("d", d3.linkHorizontal()
                    .x(d => d.y)
                    .y(d => d.x));
        
        const node = svg.append("g")
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .selectAll()
            .data(root.descendants())
            .join("g")
            .attr("transform", d => `translate(${d.y},${d.x})`);

        node.append("circle")
            .attr("fill", d => d.children ? "#555" : "#999")
            .attr("r", 2.5);

        node.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.children ? -6 : 6)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .text(d => d.data.name)
            .attr("stroke", "white")
            .attr("paint-order", "stroke");
        
        return svg.node();
    }

    function RadialTidyTree(data){
        const width = 928;
        const height = width;
        const cx = width * 0.5; // adjust as needed to fit
        const cy = height * 0.59; // adjust as needed to fit
        const radius = Math.min(width, height) / 2 - 30;
        const tree = d3.tree()
            .size([2 * Math.PI, radius])
            .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);
        const root = tree(d3.hierarchy(data)
            .sort((a, b) => d3.ascending(a.data.name, b.data.name)));
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-cx, -cy, width, height])
            .attr("style", `width: 100%; height: auto; font: ${gD3fontSize}px sans-serif;`);
        svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5)
            .selectAll()
            .data(root.links())
            .join("path")
            .attr("d", d3.linkRadial()
                .angle(d => d.x)
                .radius(d => d.y));
        svg.append("g")
            .selectAll()
            .data(root.descendants())
            .join("circle")
            .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
            .attr("fill", d => d.children ? "#555" : "#999")
            .attr("r", 2.5);
        svg.append("g")
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .selectAll()
            .data(root.descendants())
            .join("text")
            .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0) rotate(${d.x >= Math.PI ? 180 : 0})`)
            .attr("dy", "0.31em")
            .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
            .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
            .attr("paint-order", "stroke")
            .attr("stroke", "white")
            .attr("fill", "currentColor")
            .text(d => d.data.name);

        return svg.node();
    }

    function RadialClusterTree(data){
        const width = 928;
        const height = width;
        const cx = width * 0.5; // adjust as needed to fit
        const cy = height * 0.54; // adjust as needed to fit
        const radius = Math.min(width, height) / 2 - 80;
        const tree = d3.cluster()
            .size([2 * Math.PI, radius])
            .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);
        const root = tree(d3.hierarchy(data)
            .sort((a, b) => d3.ascending(a.data.name, b.data.name)));
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-cx, -cy, width, height])
            .attr("style", `width: 100%; height: auto; font: ${gD3fontSize}px sans-serif;`);
        svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5)
            .selectAll()
            .data(root.links())
            .join("path")
            .attr("d", d3.linkRadial()
                .angle(d => d.x)
                .radius(d => d.y));
        svg.append("g")
            .selectAll()
            .data(root.descendants())
            .join("circle")
            .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
            .attr("fill", d => d.children ? "#555" : "#999")
            .attr("r", 2.5);
        svg.append("g")
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .selectAll()
            .data(root.descendants())
            .join("text")
            .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0) rotate(${d.x >= Math.PI ? 180 : 0})`)
            .attr("dy", "0.31em")
            .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
            .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
            .attr("paint-order", "stroke")
            .attr("stroke", "white")
            .attr("fill", "currentColor")
            .text(d => d.data.name);

        return svg.node();
    }

    function EdgeBundling(d){
        function _D3Tree2Network(d){
            var r=[]
            var map={}
            for(let n of d.children){
                SCAST.traverseAst(n,function(node){
                    if(gD3.options[node.type]||gD3.options.all){
                        if(!map['network.'+node.value]){
                            map['network.'+node.value]=[]
                        }
                        if(node.children&&node.children.length>0){
                            for(let child of node.children){
                                if(!map['network.'+child.value]){
                                    map['network.'+child.value]=[]
                                }
                                map['network.'+node.value].push('network.'+child.value)
                            }
                        }
                        
                    }
                })
            }
            for(let k in map){
                r.push({name:k,imports:map[k]})
            }
            console.log('2network',r)
            return r
        }
        
        var colorin = "#00f"
        var colorout = "#f00"
        var colornone = "#ccc"
        var _d=[
            {name:'m.a',imports:['m.b','m.c']},
            {name:'m.b',imports:['m.c']},
            {name:'m.c',imports:['m.a']},
        ]
        var data=hierarchy(_D3Tree2Network(d))
        function id(node) {
            return `${node.parent ? id(node.parent) + "." : ""}${node.data.name}`;
        }
        function hierarchy(data, delimiter = ".") {
            let root;
            const map = new Map;
            data.forEach(function find(data) {
                const {name} = data;
                if (map.has(name)) return map.get(name);
                const i = name.lastIndexOf(delimiter);
                map.set(name, data);
                if (i >= 0) {
                find({name: name.substring(0, i), children: []}).children.push(data);
                data.name = name.substring(i + 1);
                } else {
                root = data;
                }
                return data;
            });
            return root;
            }
            function bilink(root) {
                const map = new Map(root.leaves().map(d => [id(d), d]));
                for (const d of root.leaves()) d.incoming = [], d.outgoing = d.data.imports.map(i => [d, map.get(i)]);
                for (const d of root.leaves()) for (const o of d.outgoing) o[1].incoming.push(o);
                return root;
                }
        const width = 954;
        const radius = width / 2;

        const tree = d3.cluster()
            .size([2 * Math.PI, radius - 100]);
        const root = tree(bilink(d3.hierarchy(data)
            .sort((a, b) => d3.ascending(a.height, b.height) || d3.ascending(a.data.name, b.data.name))));

        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", width)
            .attr("viewBox", [-width / 2, -width / 2, width, width])
            .attr("style", `max-width: 100%; height: auto; font: ${gD3fontSize}px sans-serif;`);

        const node = svg.append("g")
            .selectAll()
            .data(root.leaves())
            .join("g")
            .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
            .append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.x < Math.PI ? 6 : -6)
            .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
            .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
            .text(d => d.data.name)
            .each(function(d) { d.text = this; })
            .on("mouseover", overed)
            .on("mouseout", outed)
            .call(text => text.append("title").text(d => `${id(d)}
        ${d.outgoing.length} outgoing
        ${d.incoming.length} incoming`));

        const line = d3.lineRadial()
            .curve(d3.curveBundle.beta(0.85))
            .radius(d => d.y)
            .angle(d => d.x);

        const link = svg.append("g")
            .attr("stroke", colornone)
            .attr("fill", "none")
            .selectAll()
            .data(root.leaves().flatMap(leaf => leaf.outgoing))
            .join("path")
            .style("mix-blend-mode", "multiply")
            .attr("d", ([i, o]) => line(i.path(o)))
            .each(function(d) { d.path = this; });

        function overed(event, d) {
            link.style("mix-blend-mode", null);
            d3.select(this).attr("font-weight", "bold");
            d3.selectAll(d.incoming.map(d => d.path)).attr("stroke", colorin).raise();
            d3.selectAll(d.incoming.map(([d]) => d.text)).attr("fill", colorin).attr("font-weight", "bold");
            d3.selectAll(d.outgoing.map(d => d.path)).attr("stroke", colorout).raise();
            d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr("fill", colorout).attr("font-weight", "bold");
        }

        function outed(event, d) {
            link.style("mix-blend-mode", "multiply");
            d3.select(this).attr("font-weight", null);
            d3.selectAll(d.incoming.map(d => d.path)).attr("stroke", null);
            d3.selectAll(d.incoming.map(([d]) => d.text)).attr("fill", null).attr("font-weight", null);
            d3.selectAll(d.outgoing.map(d => d.path)).attr("stroke", null);
            d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr("fill", null).attr("font-weight", null);
        }

        return svg.node();
    }
    return {
        IndentedTree:IndentedTree,
        TidyTree:TidyTree,
        ClusterTree:ClusterTree,
        RadialTidyTree:RadialTidyTree,
        RadialClusterTree:RadialClusterTree,
        EdgeBundling:EdgeBundling,
    }

})()