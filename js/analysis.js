var gAst={}

function load() {
    var $file = document.getElementById('codefile')
    var $code=document.getElementById('code')
    var $codetext=document.getElementById('codetext')
    var html=''
    for(let ast in gAst){
        html+=`<details id="detail_${ast.replace('.','_')}">
                <summary onclick="scrollToView('detail_${ast.replace('.','_')}')">${ast}<a onclick="jumpOllama('${ast}')">${location.href.indexOf('davidkingzyb.tech')>=0?'🦙':''}</a></summary>
                <pre><code class="language-${gAst[ast].filetype}" id="${ast}">${gAst[ast].code.replaceAll('<','&lt;').replaceAll('>',"&gt;")}</code></pre>
                </details>`
        let t=ast.split('.')
        let c=gAst[ast].code
        if(t[1]=='py'){
            gAst[ast]=ESTREEPY.getAst(c.replace(/\r\n/g,'\n'),t[0])
        }else if(t[1]=='js'){
            gAst[ast]=ESTREEJS.getAst(c.replace(/\r\n/g,'\n'),t[0])
        }else{
            gAst[ast]=SCAST.getAst(c.replace(/\r\n/g,'\n'),t[0])
        }
        gAst[ast]['code']=c.replace(/\r\n/g,'\n')
        gAst[ast]['filetype']=t[1]
        gAst[ast]['filename']=t[0]
    }
    if($codetext&&$codetext.value){
        html=`<details id="detail_code">
            <summary>code</summary>
            <pre><code class="language-cs" id="codetext">${$codetext.value.replaceAll('<','&lt;').replaceAll('>',"&gt;")}</code></pre>
        </details>`;
        gAst.code=SCAST.getAst($codetext.value,'code')
        gAst.code['code']=$codetext.value
        gAst.code['filetype']=''
        $code.innerHTML=html;
        hljs.highlightAll();
        hljs.initLineNumbersOnLoad();
    }
    for(let i=0;i<$file.files.length;i++){
        let r = new FileReader()
        r.onload = function (e) {
            let t=r._filename.split('.')
            var c=e.target.result
            if(t[1]=='py'){
                gAst[r._filename]=ESTREEPY.getAst(c.replace(/\r\n/g,'\n'),t[0])
            }else if(t[1]=='js'){
                gAst[r._filename]=ESTREEJS.getAst(c.replace(/\r\n/g,'\n'),t[0])
            }else{
                gAst[r._filename]=SCAST.getAst(c.replace(/\r\n/g,'\n'),t[0])
            }
            gAst[r._filename]['code']=c.replace(/\r\n/g,'\n')
            gAst[r._filename]['filetype']=t[1]
            gAst[r._filename]['filename']=t[0]
            html+=`<details id="detail_${t[0]}_${t[1]}">
                <summary onclick="scrollToView('detail_${t[0]}_${t[1]}')">${r._filename} <a onclick="jumpOllama('${r._filename}')">${location.href.indexOf('davidkingzyb.tech')>=0?'🦙':''}</a></summary>
                <pre><code class="language-${t[1]}" id="${t[0]}">${c.replaceAll('<','&lt;').replaceAll('>',"&gt;")}</code></pre>
                </details>`
            $code.innerHTML=html;
            hljs.highlightAll();
            hljs.initLineNumbersOnLoad();
        }
        r.readAsText($file.files[i])
        r._filename=$file.files[i].name
    }
}

var gMermaid;


function genMermaid(){
    mermaid.initialize({ startOnLoad: false,securityLevel: 'loose', });
    var r={
        UML:'classDiagram\n',
        Flow:'flowchart LR\n',
        FlowLink:'',
        FlowNode:{},
        FlowOne:{},
        FlowVarNew:{},
        FlowFilter:gMermaid&&gMermaid.FlowFilter||{},  
        UMLClass:{},
        showCondition:true,//document.getElementById('mmdop_condition').checked,
        showRelation:true,//document.getElementById('mmdop_relation').checked,
        canclick:document.getElementById('mmdop_click').checked,
        showMethod:document.getElementById('mmdop_method').checked,
        showIf:document.getElementById('mmdop_if').checked,
        idone:document.getElementById('mmdop_idone').checked,
        showCall:document.getElementById('mmdop_call').checked,
        showNamespace:document.getElementById('mmdop_namespace').checked,
        sameName:document.getElementById('mmdop_samename').checked,
        FDPNode:{},
        FDPLinks:[],
    }
    for(let file in gAst){//generate FlowNode FlowOne UMLClass FDPNode Flow
        r.Flow+=`  subgraph ${file}\n   direction TB\n`;
        let namespace=null;
        if(gAst[file].filetype=='js'){
            ESTREEJS.setCode(gAst[file].code)
            ESTREEJS.traverseAst(gAst[file],(node)=>{
                node.poi=ESTREEJS.loc2poi(node)
            })
            ESTREEJS.traverseAst(gAst[file],(node)=>{
                return ESTREEJS.analysisMermaid(node,file,r)
            })
        }else if(gAst[file].filetype=='py'){
            ESTREEPY.setCode(gAst[file].code)
            ESTREEPY.traverseAst(gAst[file],(node)=>{
                node.poi=ESTREEPY.loc2poi(node)
            })
            ESTREEPY.traverseAst(gAst[file],(node)=>{
                return ESTREEPY.analysisMermaid(node,file,r)
            })
        }else{
            SCAST.traverseAst(gAst[file],(node)=>{
                return SCAST.analysisMermaid(node,file,r)
            })
        }
        
        if(namespace)r.Flow+=`  end\n`
        r.Flow+=`  end\n`
    }
    if(r.showRelation&&gMermaid){//第一次不渲染依赖 generate UML
        for(let ucls in r.UMLClass){//class 间依赖关系
            for(let x in r.UMLClass[ucls]){
                if(gMermaid&&gMermaid.FlowFilter[x]==false)continue
                if(ucls===x||ucls===x.split('_')[0])continue
                var v=r.UMLClass[ucls][x]
                if(v.type=='NewExpression'){
                    r.UML+=`${ucls}..>${v.value||v._value}\n`
                }
            }
        }
    }

    if(gMermaid&&r.showCall){//traverse FlowNode update FlowLink FDPLinks, replace _flow_str in Flow
        for(let nk in r.FlowNode){
            let node=r.FlowNode[nk]
            if(r.FlowFilter[node._flow_id]===false)continue
            // 连接方法内部细节调用线 click twice
            if(node.type=='NewExpression'||node.type=='CallExpression'){
                let flow_ones=r.FlowOne[node.value||node._value]
                if(r.idone&&flow_ones){
                    r.Flow=r.Flow.replaceAll(node._flow_str,'')
                    delete r.FDPNode[node._flow_id]
                    if(node.type=='CallExpression'&&r.sameName){//for same name function call
                        if(!node._flow_callee)node._flow_callee=flow_ones[0]
                        // console.log('samename',node._flow_callee,flow_ones) 
                        for(let i=0;i<flow_ones.length;i++){
                            let isvarnew=flow_ones[i].split('_').indexOf(r.FlowVarNew[node._flow_callee])>=0;
                            let isfunc=node._flow_callee==flow_ones[i]
                            let isstatic=!isfunc&&flow_ones[i].indexOf(node._flow_callee)>0;
                            if(isvarnew||isfunc||isstatic){
                                r.FlowLink+=`${node._flow_from} -..-> ${node._flow_prop||''} ${flow_ones[i]}\n`
                                r.FDPLinks.push({source:node._flow_from,target:flow_ones[i],value:2,dash:"5,5",dist:100,strength:0.1})
                            }
                        }
                    }else{
                        r.FlowLink+=`${node._flow_from} -..-> ${node._flow_prop||''} ${flow_ones[0]}\n`
                        r.FDPLinks.push({source:node._flow_from,target:flow_ones[0],value:2,dash:"5,5",dist:100,strength:0.1})
                    }
                }else{
                    r.FlowLink+=`${node._flow_from} -..-> ${node._flow_prop||''} ${node._flow_id}\n`
                    r.FDPLinks.push({source:node._flow_from,target:node._flow_id,value:2,dash:"5,5",dist:100,strength:0.1})
                }
            }else if(r.showIf
                    &&(node.type=="IfStatement"||node.type=="LoopStatement"||
                    node.type=="ForStatement"||node.type=="WhileStatement"||node.type=="DoWhileStatement"||node.type=="ForInStatement"||node.type=="ForOfStatement")
                ){
                //todo bug click mermaid first then check if and loop target undefined
                r.FlowLink+=`${node._flow_from} -..-> ${r.showCondition&&node._flow_condition||''} ${node._flow_id}\n`
                r.FDPLinks.push({source:node._flow_from,target:node._flow_id,value:2,dash:"5,5",dist:100,strength:0.1})
            }
        }
    }
    if(!r.canclick){
        r.Flow=r.Flow.replace(/\nclick(.+?)\n/g,'\n')
    }
    for(let file in gAst){
        if(gAst[file].ai){//saved ai to _analysiii
            for(let fid in gAst[file].ai){
                r.FlowNode[fid]._analysis=gAst[file].ai[fid]
            }
        }
    }
    gMermaid=r;
    console.log('gMermaid',gMermaid)
    renderMermaid()
    renderMermaidFilter()
    scrollToView('mermaidPane',-window.innerHeight/2-20)
    document.getElementById('aibtn').disabled=false
}

var gD3 = {tree: {},conf:{}}
var level_symbol={
    'public':'+',
    "private":'-',
    "protected":'#',
    "internal":'~',
    "static":'$',
}
function genD3(){
    var r={name:'file',children:[]}
    gD3.conf={
        scastops:getSCASTD3Option(),
        estreeops:getESTreeD3Option(),
        fontsize:gD3fontSize,
    }
    
    console.log('D3 config',gD3.conf)

    for(let file in gAst){
        let d3node=JSON.parse(JSON.stringify(gAst[file]))
        if(file.indexOf('.js')>=0){
            ESTREEJS.setCode(gAst[file].code)
            ESTREEJS.setD3Config(gD3.conf)
            ESTREEJS.traverseAst(d3node,(node)=>{
                return ESTREEJS.analysisD3(node,file)
            })
        }else if(file.indexOf('.py')>=0){
            ESTREEPY.setCode(gAst[file].code)
            ESTREEPY.setD3Config(gD3.conf)
            ESTREEPY.traverseAst(d3node,(node)=>{
                ESTREEPY.analysisD3(node,file)
            })
        }else{
            SCAST.setD3Config(gD3.conf)
            SCAST.traverseAst(d3node,(node)=>{
                return SCAST.analysisD3(node,file)
            })    
        }
        r.children.push(d3node)
    }
    gD3.tree=r;
    
    var D3Select=document.getElementById('D3Select').value;
    gD3.select=D3Select;
    console.log('gD3',gD3)

    renderD3(D3Select,gD3.tree)
    scrollToView('D3Select',-window.innerHeight/2-20)
}

