var gAst={}

function load() {
    var $file = document.getElementById('codefile')
    var $code=document.getElementById('code')
    var $codetext=document.getElementById('codetext')
    var html=''
    if($codetext&&$codetext.value){
        html=`<details id="detail_code">
            <summary>code</summary>
            <pre><code class="language-cs" id="codetext">${$codetext.value.replaceAll('<','&lt;').replaceAll('>',"&gt;")}</code></pre>
        </details>`;
        gAst.code=SCASTJS.getAst($codetext.value,'code')
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
                gAst[r._filename]=SCASTPY.getAst(c.replace(/\r\n/g,'\n'),t[0])
            }else if(t[1]=='js'){
                gAst[r._filename]=SCASTJS.getAst(c.replace(/\r\n/g,'\n'),t[0])
            }else{
                gAst[r._filename]=SCAST.getAst(c.replace(/\r\n/g,'\n'),t[0])
            }
            gAst[r._filename]['code']=c.replace(/\r\n/g,'\n')
            gAst[r._filename]['filetype']=t[1]
            gAst[r._filename]['filename']=t[0]
            html+=`<details id="detail_${t[0]}_${t[1]}">
                <summary onclick="scrollToView('detail_${t[0]}_${t[1]}')">${r._filename} <a onclick="jumpOllama('${r._filename}')">${gISAI==true?'🦙':''}</a></summary>
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
    var r={
        UML:'classDiagram\n',
        Flow:'flowchart LR\n',
        FlowLink:'',
        FlowNode:{},
        FlowOne:{},
        FlowFilter:gMermaid&&gMermaid.FlowFilter||{},  
        UMLClass:{},
        showCondition:true,//document.getElementById('mmdop_condition').checked,
        showRelation:document.getElementById('mmdop_relation').checked,
        showMethod:document.getElementById('mmdop_method').checked,
        showIf:document.getElementById('mmdop_if').checked,
        idone:document.getElementById('mmdop_idone').checked,
        showCall:document.getElementById('mmdop_call').checked,
        showNamespace:document.getElementById('mmdop_namespace').checked,
        FDPNode:{},
        FDPLinks:[],
    }
    for(let file in gAst){
        r.Flow+=`  subgraph ${file}\n   direction TB\n`;
        let namespace=null;
        if(gAst[file].filetype=='js'){
            SCASTJS.setCode(gAst[file].code)
            SCASTJS.traverseAst(gAst[file],(node)=>{
                node.poi=SCASTJS.loc2poi(node.loc)
            })
            SCASTJS.traverseAst(gAst[file],(node)=>{
                return SCASTJS.analysisMermaid(node,file,r)
            })
        }else if(gAst[file].filetype=='py'){
            SCASTPY.setCode(gAst[file].code)
            SCASTPY.traverseAst(gAst[file],(node)=>{
                node.poi=SCASTPY.loc2poi(node.loc)
            })
            SCASTPY.traverseAst(gAst[file],(node)=>{
                return SCASTPY.analysisMermaid(node,file,r)
            })
        }else{
            SCAST.traverseAst(gAst[file],(node)=>{
                return SCAST.analysisMermaid(node,file,r)
            })
        }
        
        if(namespace)r.Flow+=`  end\n`
        r.Flow+=`  end\n`
    }
    if(r.showRelation&&gMermaid){//第一次不渲染依赖
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

    if(gMermaid&&r.showCall){//traverse FlowNode
        for(let nk in r.FlowNode){
            let node=r.FlowNode[nk]
            if(r.FlowFilter[node._flow_id]===false)continue
            if(node.type=='NewExpression'||node.type=='CallExpression'){
                if(r.idone&&(r.FlowOne[node.value]||r.FlowOne[node._value])){
                    //click twice
                    r.Flow=r.Flow.replaceAll(node._flow_str,'')
                    delete r.FDPNode[node._flow_id]
                    r.FlowLink+=`${node._flow_from} -..-> ${node._flow_prop||''} ${r.FlowOne[node.value||node._value]}\n`
                    r.FDPLinks.push({source:node._flow_from,target:r.FlowOne[node.value||node._value],value:2,dash:"5,5",dist:100,strength:0.1})
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
    gMermaid=r;
    console.log('gMermaid',gMermaid)
    renderMermaid()
    renderMermaidFilter()
    scrollToView('mermaidUML',-window.innerHeight/2-20)
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
            SCASTJS.setCode(gAst[file].code)
            SCASTJS.setD3Config(gD3.conf)
            SCASTJS.traverseAst(d3node,(node)=>{
                return SCASTJS.analysisD3(node,file)
            })
        }else if(file.indexOf('.py')>=0){
            SCASTPY.setCode(gAst[file].code)
            SCASTPY.setD3Config(gD3.conf)
            SCASTPY.traverseAst(d3node,(node)=>{
                SCASTPY.analysisD3(node,file)
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

